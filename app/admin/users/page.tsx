import { requireAdmin } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { AdminUsersClient } from "@/components/admin/admin-users-client";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await query(
    "SELECT id, email, display_name, is_admin FROM users ORDER BY display_name ASC"
  );
  return <AdminUsersClient users={users} />;
}
