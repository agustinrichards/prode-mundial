"use client";

import { signOut } from "next-auth/react";

interface Props {
  user: { name?: string | null; email?: string | null } | undefined;
}

export function UserMenu({ user }: Props) {
  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <div className="flex items-center gap-3 px-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
