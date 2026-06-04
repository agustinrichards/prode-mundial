"use client";

import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto rounded-lg px-4 py-3 shadow-lg text-sm font-medium
            transition-all duration-300 animate-in slide-in-from-bottom-2
            ${toast.variant === "destructive"
              ? "bg-red-600 text-white"
              : "bg-white text-gray-900 border border-gray-200"
            }
          `}
        >
          {toast.title && <p className="font-semibold">{toast.title}</p>}
          {toast.description && <p className="opacity-80 mt-0.5">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
}
