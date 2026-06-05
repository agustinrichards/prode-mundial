import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { MisApuestasClient } from "@/components/dashboard/mis-apuestas-client";
import { redirect } from "next/navigation";

function serializeDate(val: any): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

export default async function VerTarjetasPage() {
  const session = await requireAuth();
  const user = session.user as any;
  if (user.isAdmin) redirect("/admin/matches");
  const userId = user.id;

  const myPredictions = await query(`
    SELECT m.id AS match_id, m.home_team, m.away_team, m.match_date,
      m.stage, m.group_name, m.date_label, m.venue, m.city,
      m.home_score, m.away_score, m.predictions_close_at,
      p.home_score_pred, p.away_score_pred, p.points, COALESCE(p.locked,FALSE) AS locked,
      EXISTS(SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=m.id AND comodin_type='CO2') AS co2,
      EXISTS(SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=m.id AND comodin_type='RIO') AS rio,
      rp.home_score_pred AS rio_home, rp.away_score_pred AS rio_away
    FROM matches m
    LEFT JOIN predictions p ON p.match_id=m.id AND p.user_id=$1
    LEFT JOIN rio_predictions rp ON rp.match_id=m.id AND rp.user_id=$1
    WHERE m.is_visible=TRUE ORDER BY m.match_date ASC
  `, [userId]);

  const allPredictions = await query(`
    SELECT m.id AS match_id, u.display_name, u.id AS user_id,
      p.home_score_pred, p.away_score_pred, p.points,
      EXISTS(SELECT 1 FROM comodin_usage WHERE user_id=u.id AND match_id=m.id AND comodin_type='CO2') AS co2,
      EXISTS(SELECT 1 FROM comodin_usage WHERE user_id=u.id AND match_id=m.id AND comodin_type='RIO') AS rio
    FROM matches m JOIN predictions p ON p.match_id=m.id JOIN users u ON u.id=p.user_id
    WHERE m.is_visible=TRUE
    ORDER BY m.match_date ASC, u.display_name ASC
  `);

  const specialBets = await query(`
    SELECT sb.user_id, u.display_name, sb.champion_team, sb.top_scorer_name,
           sb.lago_day, sb.water_installations,
           COALESCE(sb.champion_points,0) AS champion_points,
           COALESCE(sb.scorer_points,0) AS scorer_points,
           COALESCE(sb.lago_bonus,0) AS lago_bonus,
           COALESCE(sb.water_points,0) AS water_points
    FROM special_bets sb JOIN users u ON u.id=sb.user_id
    ORDER BY u.display_name ASC
  `);

  const users = await query(
    "SELECT id, display_name FROM users WHERE is_admin=FALSE ORDER BY display_name ASC"
  );

  const serializedMyPredictions = myPredictions.map((m: any) => ({
    ...m,
    match_date: serializeDate(m.match_date),
    predictions_close_at: serializeDate(m.predictions_close_at),
  }));

  const serializedSpecialBets = specialBets.map((b: any) => ({
    ...b,WHERE m.is_visible=TRUE AND m.predictions_close_at < NOW()
    lago_day: serializeDate(b.lago_day),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display">VER TARJETAS</h1>
        <p className="text-muted-foreground mt-1">Predicciones de todos · visibles tras el cierre de cada fecha</p>
      </div>
      <MisApuestasClient
        myPredictions={serializedMyPredictions}
        allPredictions={allPredictions}
        specialBets={serializedSpecialBets}
        users={users}
        userId={userId}
      />
    </div>
  );
}