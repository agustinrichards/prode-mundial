import { requireAdmin } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { AdminKnockoutClient } from "@/components/admin/admin-knockout-client";
import { serializeDates } from "@/lib/serialize";

export default async function AdminKnockoutPage() {
  await requireAdmin();
  const matches = await query(`
    SELECT id, home_team, away_team, match_date, stage, date_label
    FROM matches WHERE stage != 'group'
    ORDER BY match_date ASC
  `);
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Equipos Eliminacion Directa</h1>
        <p className="text-sm text-gray-500 mt-1">Actualizá los nombres cuando se definan los clasificados</p>
      </div>
      <AdminKnockoutClient matches={serializeDates(matches, ["match_date"])} />
    </div>
  );
}