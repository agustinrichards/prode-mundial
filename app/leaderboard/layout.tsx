import { requireAuth } from "@/lib/auth/session";
import { NavLinks } from "@/components/dashboard/nav-links";
import { UserMenu } from "@/components/dashboard/user-menu";
import { MobileMenu } from "@/components/dashboard/mobile-menu";

export default async function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const isAdmin = (session.user as any).isAdmin ?? false;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden md:flex w-60 flex-col border-r border-gray-200 bg-white px-4 py-6 fixed h-full">
        <div className="mb-8 px-2">
          <span className="text-2xl font-display text-primary">⚽ PRODE 2026</span>
        </div>
        <nav className="flex-1">
          <NavLinks isAdmin={isAdmin} />
        </nav>
        <UserMenu user={session.user} />
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#1D1D1B" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "0.12em", color: "#0077B6" }}>
          ⚽ PRODE 2026
        </span>
        <MobileMenu isAdmin={isAdmin} user={session.user} />
      </div>
      <main className="flex-1 md:ml-60 p-4 md:p-8 max-w-5xl mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}