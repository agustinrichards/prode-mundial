"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header Agua Local */}
      <div style={{ backgroundColor: "#1D1D1B" }} className="px-8 py-5">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase leading-none">AGUA</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "32px", letterSpacing: "-0.02em", color: "white", lineHeight: 1 }}>
            LOCAL
          </div>
          <div className="text-[8px] tracking-[0.3em] text-gray-500 uppercase mt-0.5">PURA · LÓGICA · SUSTENTABLE</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ backgroundColor: "#F5F5F5" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⚽</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "40px", letterSpacing: "0.05em", color: "#0077B6" }}>
              PRODE 2026
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Mundial FIFA · Agua Local</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" onClick={handleSubmit} disabled={loading}
              className="w-full text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-50 transition-colors"
              style={{ backgroundColor: "#1D1D1B" }}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            agualocal.eco
          </p>
        </div>
      </div>
    </div>
  );
}