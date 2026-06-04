import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { redirect } from "next/navigation";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!(session.user as any).isAdmin) redirect("/dashboard");
  return session;
}
