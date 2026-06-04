import { requireAdmin } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";
import { AdminSpecialResultsClient } from "@/components/admin/admin-special-results-client";

export default async function AdminSpecialResultsPage() {
  await requireAdmin();
  const config = await queryOne("SELECT * FROM special_results LIMIT 1");
  const bets = await query("SELECT sb.*, u.display_name FROM special_bets sb JOIN users u ON u.id = sb.user_id");
  return <AdminSpecialResultsClient config={config} bets={bets} />;
}
