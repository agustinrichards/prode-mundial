import { requireAdmin } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { AdminResultsClient } from "@/components/admin/admin-results-client";

export default async function AdminResultsPage() {
  await requireAdmin();
  const matches = await query(
    "SELECT * FROM matches WHERE is_visible = TRUE ORDER BY match_date ASC"
  );
  return <AdminResultsClient matches={matches} />;
}
