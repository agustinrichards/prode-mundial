import { requireAdmin } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";
import { AdminWaterClient } from "@/components/admin/admin-water-client";
import { serializeDates } from "@/lib/serialize";

export default async function AdminWaterPage() {
  await requireAdmin();
  const updatesRaw = await query("SELECT * FROM water_updates ORDER BY week_number ASC");
  const updates = serializeDates(updatesRaw, ["week_date", "created_at", "updated_at"]);
  const result = await queryOne("SELECT water_real FROM special_results LIMIT 1");
  const bets = await query(`
    SELECT sb.water_installations, u.display_name
    FROM special_bets sb
    JOIN users u ON u.id=sb.user_id
    WHERE sb.water_installations IS NOT NULL
    ORDER BY u.display_name ASC
  `);
  return <AdminWaterClient updates={updates} waterReal={result?.water_real ?? null} bets={bets} />;
}