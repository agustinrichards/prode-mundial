import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { AguaLocalClient } from "@/components/dashboard/agua-local-client";
import { serializeDates } from "@/lib/serialize";

export default async function AguaLocalPage() {
  await requireAuth();
  const updates = await query("SELECT * FROM water_updates ORDER BY week_number ASC");
  const serialized = serializeDates(updates, ["week_date", "created_at"]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display">INSTALACIONES AGUA LOCAL</h1>
        <p className="text-muted-foreground mt-1">Seguimiento semanal durante el Mundial 2026</p>
      </div>
      <AguaLocalClient updates={serialized} />
    </div>
  );
}