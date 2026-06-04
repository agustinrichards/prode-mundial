"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div style={{ backgroundColor: "#1D1D1B" }} className="px-8 py-5">
        <div className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase leading-none">AGUA</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "32px", letterSpacing: "-0.02em", color: "white", lineHeight: 1 }}>
          LOCAL
        </div>
        <div className="text-[8px] tracking-[0.3em] text-gray-500 uppercase mt-0.5">PURA · LÓGICA · SUSTENTABLE</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6" style={{ backgroundColor: "#F5F5F5" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⚽</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "40px", letterSpacing: "0.05em", color: "#0077B6" }}>
              PRODE 2026
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {done ? (
              <div className="text-center space-y-2">
                <div className="text-4xl">✅</div>
                <p className="font-semibold">Contraseña actualizada</p>
                <p className="text-sm text-gray-500">Redirigiendo al login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-semibold text-gray-900">Nueva contraseña</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "#1D1D1B" }}>
                  {loading ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}