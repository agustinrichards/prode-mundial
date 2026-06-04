import { requireAdmin } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { AdminMatchesClient } from "@/components/admin/admin-matches-client";

export default async function AdminMatchesPage() {
  await requireAdmin();
  const matches = await query("SELECT * FROM matches ORDER BY match_date ASC");
  return <AdminMatchesClient matches={matches} />;
}
