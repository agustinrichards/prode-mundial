import { requireAdmin } from "@/lib/auth/session";
import { NavLinks } from "@/components/dashboard/nav-links";
import { UserMenu } from "@/components/dashboard/user-menu";
import { MobileMenu } from "@/components/dashboard/mobile-menu";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white fixed h-full">
        {/* Logo Agua Local */}
        <div className="px-5 py-5 border-b border-gray-100" style={{ backgroundColor: "#1D1D1B" }}>
          <div className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase leading-none">AGUA</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "28px", letterSpacing: "-0.02em", color: "white", lineHeight: 1 }}>
            LOCAL
          </div>
          <div className="text-[8px] tracking-[0.3em] text-gray-500 uppercase mt-0.5">PURA · LÓGICA · SUSTENTABLE</div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "0.12em", color: "#0077B6" }}>
              ⚽ PRODE 2026
            </span>
            <span className="ml-2 text-[10px] text-gray-400 uppercase tracking-wider">Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4">
          <NavLinks isAdmin={true} />
        </nav>
        <div className="px-4 pb-4">
          <UserMenu user={session.user} />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#1D1D1B" }}>
        <div>
          <div className="text-[8px] tracking-[0.2em] text-gray-400 uppercase leading-none">AGUA</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "20px", letterSpacing: "-0.02em", color: "white" }}>
            LOCAL
          </div>
        </div>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "0.12em", color: "#0077B6" }}>
          ⚽ PRODE 2026 · ADMIN
        </span>
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-5xl mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}