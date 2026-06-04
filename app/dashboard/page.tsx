import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { MatchesClient } from "@/components/dashboard/matches-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await requireAuth();
  const user = session.user as any;

  // Admin goes to admin area
  if (user.isAdmin) redirect("/admin/matches");

  const userId = user.id;

  const matches = await query(`
    SELECT
      m.*,
      p.home_score_pred, p.away_score_pred, p.points, p.id AS prediction_id,
      COALESCE(p.locked, FALSE) AS locked,
      EXISTS(SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=m.id AND comodin_type='CO2') AS co2_used,
      EXISTS(SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=m.id AND comodin_type='RIO') AS rio_used,
      rp.home_score_pred AS rio_home_pred, rp.away_score_pred AS rio_away_pred
    FROM matches m
    LEFT JOIN predictions p ON p.match_id=m.id AND p.user_id=$1
    LEFT JOIN rio_predictions rp ON rp.match_id=m.id AND rp.user_id=$1
    WHERE m.is_visible=TRUE
    ORDER BY m.match_date ASC
  `, [userId]);

  const co2Usage = await query(`
    SELECT m.stage, COUNT(*) AS cnt FROM comodin_usage cu
    JOIN matches m ON m.id=cu.match_id
    WHERE cu.user_id=$1 AND cu.comodin_type='CO2' GROUP BY m.stage
  `, [userId]);

  const rioUsage = await query(`
    SELECT m.stage, COUNT(*) AS cnt FROM comodin_usage cu
    JOIN matches m ON m.id=cu.match_id
    WHERE cu.user_id=$1 AND cu.comodin_type='RIO' GROUP BY m.stage
  `, [userId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display">PREDICCIONES</h1>
        <p className="text-muted-foreground mt-1">Mundial FIFA 2026 · 11 Jun – 19 Jul</p>
      </div>
      <MatchesClient matches={matches} userId={userId} co2Usage={co2Usage} rioUsage={rioUsage} />
    </div>
  );
}
