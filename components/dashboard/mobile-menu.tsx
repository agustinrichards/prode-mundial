"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLinks } from "@/components/dashboard/nav-links";
import { UserMenu } from "@/components/dashboard/user-menu";

interface Props {
  isAdmin: boolean;
  user: any;
}

export function MobileMenu({ isAdmin, user }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-white p-1">
        <Menu className="w-6 h-6" />
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-72 bg-white z-50 flex flex-col shadow-xl">
            <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#1D1D1B" }}>
              <div>
                <div className="text-[8px] tracking-[0.2em] text-gray-400 uppercase">AGUA</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "20px", color: "white" }}>
                  LOCAL
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 overflow-y-auto" onClick={() => setOpen(false)}>
              <NavLinks isAdmin={isAdmin} />
            </nav>

            <div className="px-4 pb-4 border-t border-gray-100 pt-4">
              <UserMenu user={user} />
            </div>
          </div>
        </>
      )}
    </>
  );
}