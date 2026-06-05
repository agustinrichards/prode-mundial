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

    for (const pred of preds.rows) {
      const pts = calcPts(pred.home_score_pred, pred.away_score_pred, effectiveHome, effectiveAway);
      const co2 = await client.query(
        "SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=$2 AND comodin_type='CO2'",
        [pred.user_id, matchId]
      );
      await client.query(
        "UPDATE predictions SET points=$1, updated_at=NOW() WHERE id=$2",
        [co2.rowCount! > 0 ? pts * 2 : pts, pred.id]
      );
    }

    for (const pred of rioPreds.rows) {
      const pts = calcPts(pred.home_score_pred, pred.away_score_pred, effectiveHome, effectiveAway);
      await client.query("UPDATE rio_predictions SET points=$1, updated_at=NOW() WHERE id=$2", [pts, pred.id]);
    }

    // Recalculate leaderboard — incluye puntos RIO si son mejores que la pred original
    const users = await client.query("SELECT DISTINCT user_id FROM predictions WHERE match_id=$1", [matchId]);
    for (const { user_id } of users.rows) {
      // Suma de puntos de predicciones normales
      const normalPts = await client.query(
        "SELECT COALESCE(SUM(points),0) AS total, COUNT(*) FILTER (WHERE points IS NOT NULL) AS predicted, COUNT(*) FILTER (WHERE points>0) AS correct FROM predictions WHERE user_id=$1 AND points IS NOT NULL",
        [user_id]
      );

      // Suma de puntos RIO extra (solo cuando RIO supera a la pred original)
      const rioPtsResult = await client.query(
        `SELECT COALESCE(SUM(
          GREATEST(rp.points, COALESCE(p.points, 0)) - COALESCE(p.points, 0)
        ), 0) AS rio_bonus
        FROM rio_predictions rp
        LEFT JOIN predictions p ON p.user_id = rp.user_id AND p.match_id = rp.match_id
        WHERE rp.user_id=$1 AND rp.points IS NOT NULL`,
        [user_id]
      );

      const total = Number(normalPts.rows[0].total) + Number(rioPtsResult.rows[0].rio_bonus);
      const predicted = Number(normalPts.rows[0].predicted);
      const correct = Number(normalPts.rows[0].correct);

      await client.query(
        "INSERT INTO leaderboard_cache (user_id,total_points,matches_predicted,correct_results,updated_at) VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(user_id) DO UPDATE SET total_points=$2,matches_predicted=$3,correct_results=$4,updated_at=NOW()",
        [user_id, total, predicted, correct]
      );
    }

    // Daily scores for LAGO
    const md = await client.query("SELECT match_date::date AS d FROM matches WHERE id=$1", [matchId]);
    if (md.rows[0]) {
      const day = md.rows[0].d;
      const ds = await client.query(
        "SELECT p.user_id, COALESCE(SUM(p.points),0) AS pts FROM predictions p JOIN matches m ON m.id=p.match_id WHERE m.match_date::date=$1 AND p.points IS NOT NULL GROUP BY p.user_id",
        [day]
      );
      for (const { user_id, pts } of ds.rows) {
        await client.query(
          "INSERT INTO daily_scores (user_id,match_date,points) VALUES($1,$2,$3) ON CONFLICT(user_id,match_date) DO UPDATE SET points=$3,updated_at=NOW()",
          [user_id, day, pts]
        );
      }

      const snap = await client.query(
        "SELECT user_id, total_points FROM leaderboard_cache ORDER BY total_points DESC"
      );
      for (let i = 0; i < snap.rows.length; i++) {
        await client.query(
          "INSERT INTO leaderboard_snapshots (snapshot_date,user_id,total_points,rank) VALUES($1,$2,$3,$4) ON CONFLICT(snapshot_date,user_id) DO UPDATE SET total_points=$3,rank=$4",