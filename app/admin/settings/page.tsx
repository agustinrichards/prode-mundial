import { requireAdmin } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { AdminSettingsClient } from "@/components/admin/admin-settings-client";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const users = await query(
    "SELECT id, display_name, email FROM users WHERE is_admin=FALSE ORDER BY display_name ASC"
  );
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Config & Testing</h1>
        <p className="text-sm text-gray-500 mt-1">Herramientas de administración y prueba</p>
      </div>
      <AdminSettingsClient users={users} />
    </div>
  );
}
