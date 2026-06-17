import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matchId, homeScore, awayScore, homeAet, awayAet } = await req.json();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const effectiveHome = (homeAet !== null && homeAet !== undefined) ? homeAet : homeScore;
    const effectiveAway = (awayAet !== null && awayAet !== undefined) ? awayAet : awayScore;

    await client.query(
      `UPDATE matches SET home_score=$1, away_score=$2, home_score_aet=$3, away_score_aet=$4, updated_at=NOW() WHERE id=$5`,
      [homeScore, awayScore, homeAet ?? null, awayAet ?? null, matchId]
    );

    const preds = await client.query("SELECT * FROM predictions WHERE match_id=$1", [matchId]);
    const rioPreds = await client.query("SELECT * FROM rio_predictions WHERE match_id=$1", [matchId]);

    // Calcular puntos base para predicciones normales
    for (const pred of preds.rows) {
      const pts = calcPts(pred.home_score_pred, pred.away_score_pred, effectiveHome, effectiveAway);
      await client.query(
        "UPDATE predictions SET points=$1, updated_at=NOW() WHERE id=$2",
        [pts, pred.id]
      );
    }

    // Calcular puntos RIO
    for (const pred of rioPreds.rows) {
      const pts = calcPts(pred.home_score_pred, pred.away_score_pred, effectiveHome, effectiveAway);
      await client.query("UPDATE rio_predictions SET points=$1, updated_at=NOW() WHERE id=$2", [pts, pred.id]);
    }

    // Aplicar MAX(pred, rio) y CO2 sobre el mejor
    for (const pred of preds.rows) {
      const rioPred = rioPreds.rows.find((r: any) => r.user_id === pred.user_id);
      const co2 = await client.query(
        "SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=$2 AND comodin_type='CO2'",
        [pred.user_id, matchId]
      );
      const hasCo2 = co2.rowCount! > 0;

      const predPts = calcPts(pred.home_score_pred, pred.away_score_pred, effectiveHome, effectiveAway);
      const rioPts = rioPred ? calcPts(rioPred.home_score_pred, rioPred.away_score_pred, effectiveHome, effectiveAway) : -1;
      const bestPts = Math.max(predPts, rioPts);
      const finalPts = hasCo2 ? bestPts * 2 : bestPts;

      await client.query(
        "UPDATE predictions SET points=$1, updated_at=NOW() WHERE id=$2",
        [finalPts, pred.id]
      );
    }

    // Recalculate leaderboard
    const users = await client.query("SELECT DISTINCT user_id FROM predictions WHERE match_id=$1", [matchId]);
    for (const { user_id } of users.rows) {
      const t = await client.query(
        "SELECT COALESCE(SUM(points),0) AS total, COUNT(*) FILTER (WHERE points IS NOT NULL) AS predicted, COUNT(*) FILTER (WHERE points>0) AS correct FROM predictions WHERE user_id=$1 AND points IS NOT NULL",
        [user_id]
      );
      const { total, predicted, correct } = t.rows[0];

      await client.query(
        "INSERT INTO leaderboard_cache (user_id,total_points,matches_predicted,correct_results,updated_at) VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(user_id) DO UPDATE SET total_points=$2,matches_predicted=$3,correct_results=$4,updated_at=NOW()",
        [user_id, total, predicted, correct]
      );
    }

    // Daily scores for LAGO
    const md = await client.query("SELECT (match_date AT TIME ZONE 'America/New_York')::date AS d FROM matches WHERE id=$1", [matchId]);
    if (md.rows[0]) {
      const day = md.rows[0].d;
      const ds = await client.query(
        "SELECT p.user_id, COALESCE(SUM(p.points),0) AS pts FROM predictions p JOIN matches m ON m.id=p.match_id WHERE (m.match_date AT TIME ZONE 'America/New_York')::date=$1 AND p.points IS NOT NULL GROUP BY p.user_id",
        [day]
      );
      for (const { user_id, pts } of ds.rows) {
        await client.query(
          "INSERT INTO daily_scores (user_id,match_date,points) VALUES($1,$2,$3) ON CONFLICT(user_id,match_date) DO UPDATE SET points=$3,updated_at=NOW()",
          [user_id, day, pts]
        );
      }

      
      // Recalcular LAGO bonus para usuarios cuyo lago_day = hoy (EDT)
      const lagoUsers = await client.query(
        "SELECT user_id FROM special_bets WHERE lago_day = $1",
        [day]
      );
      if (lagoUsers.rows.length > 0) {
        const maxDay = await client.query(
          `SELECT MAX(pts) AS max_pts FROM (
            SELECT SUM(p.points) AS pts
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            WHERE (m.match_date AT TIME ZONE 'America/New_York')::date = $1
            AND p.points IS NOT NULL
            GROUP BY p.user_id
          ) daily`,
          [day]
        );
        const maxPts = Number(maxDay.rows[0]?.max_pts ?? 0);
        await client.query(
          "UPDATE special_bets SET lago_bonus=$1 WHERE lago_day=$2",
          [maxPts, day]
        );
        for (const { user_id } of lagoUsers.rows) {
          const t = await client.query(
            "SELECT COALESCE(SUM(points),0) AS match_total FROM predictions WHERE user_id=$1 AND points IS NOT NULL",
            [user_id]
          );
          const sp = await client.query(
            "SELECT COALESCE(champion_points,0)+COALESCE(scorer_points,0)+COALESCE(lago_bonus,0)+COALESCE(water_points,0) AS special_total FROM special_bets WHERE user_id=$1",
            [user_id]
          );
          const total = Number(t.rows[0].match_total) + (sp.rows[0] ? Number(sp.rows[0].special_total) : 0);
          await client.query(
            "INSERT INTO leaderboard_cache (user_id,total_points,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(user_id) DO UPDATE SET total_points=$2,updated_at=NOW()",
            [user_id, total]
          );
        }
      }
      const snap = await client.query(
        "SELECT user_id, total_points FROM leaderboard_cache ORDER BY total_points DESC"
      );
      for (let i = 0; i < snap.rows.length; i++) {
        await client.query(
          "INSERT INTO leaderboard_snapshots (snapshot_date,user_id,total_points,rank) VALUES($1,$2,$3,$4) ON CONFLICT(snapshot_date,user_id) DO UPDATE SET total_points=$3,rank=$4",
          [day, snap.rows[i].user_id, snap.rows[i].total_points, i + 1]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}

function calcPts(hp: number, ap: number, hr: number, ar: number) {
  if (hp === hr && ap === ar) return 3;
  const pd = hp - ap, rd = hr - ar;
  if (Math.sign(pd) === Math.sign(rd)) return 1;
  return 0;
}