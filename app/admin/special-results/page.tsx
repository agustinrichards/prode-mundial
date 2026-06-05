import { requireAdmin } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";
import { AdminSpecialResultsClient } from "@/components/admin/admin-special-results-client";

export default async function AdminSpecialResultsPage() {
  await requireAdmin();
  const config = await queryOne("SELECT * FROM special_results LIMIT 1");
  const bets = await query(`
  SELECT u.id AS user_id, u.display_name, 
    sb.champion_team, sb.top_scorer_name, sb.lago_day, sb.water_installations,
    sb.champion_points, sb.scorer_points, sb.lago_bonus, sb.water_points
  FROM users u
  LEFT JOIN special_bets sb ON sb.user_id = u.id
  WHERE u.is_admin = FALSE
  ORDER BY u.display_name ASC
`);
  return <AdminSpecialResultsClient config={config} bets={bets} />;
}
