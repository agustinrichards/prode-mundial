"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface User { id: string; display_name: string; email: string; }

interface Props { users: User[]; }

const DATE_OPTIONS = [
  { value: "fecha_1", label: "Fecha 1" },
  { value: "fecha_2", label: "Fecha 2" },
  { value: "fecha_3", label: "Fecha 3" },
  { value: "round_of_32", label: "Ronda 32" },
  { value: "round_of_16", label: "Octavos" },
  { value: "quarterfinal", label: "Cuartos" },
  { value: "semifinal", label: "Semis" },
  { value: "final", label: "Final" },
];

export function AdminSettingsClient({ users }: Props) {
  const { toast } = useToast();
  const [matchSearch, setMatchSearch] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Record<string, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [dateOverride, setDateOverride] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [resetUser, setResetUser] = useState("");
  const [resetType, setResetType] = useState<"date" | "specials">("date");
  const [resetDate, setResetDate] = useState("fecha_1");
  const [resetting, setResetting] = useState(false);
  const [unlockUser, setUnlockUser] = useState("");
  const [unlockType, setUnlockType] = useState<"all" | "date">("all");
  const [unlockDate, setUnlockDate] = useState("fecha_1");
  const [unlocking, setUnlocking] = useState(false);

  const searchMatches = async () => {
    if (!matchSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/matches/search?q=${encodeURIComponent(matchSearch)}`);
      const data = await res.json();
      setMatches(data.matches);
    } catch { toast({ title: "Error al buscar", variant: "destructive" }); }
    finally { setSearching(false); }
  };

  const saveResult = async (matchId: string) => {
    const r = results[matchId];
    if (!r?.home || !r?.away) { toast({ title: "Ingresá ambos goles", variant: "destructive" }); return; }
    setSaving(matchId);
    try {
      const res = await fetch("/api/admin/results", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeScore: parseInt(r.home), awayScore: parseInt(r.away) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✓ Resultado guardado" });
      setMatches(ms => ms.map(m => m.id === matchId ? { ...m, home_score: parseInt(r.home), away_score: parseInt(r.away) } : m));
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(null); }
  };

  const saveDateOverride = async (clear = false) => {
    setSavingDate(true);
    try {
      await fetch("/api/admin/date-override", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: clear ? null : dateOverride }),
      });
      toast({ title: clear ? "Fecha restaurada" : `Fecha simulada: ${dateOverride}` });
      if (clear) setDateOverride("");
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingDate(false); }
  };

  const handleUnlock = async () => {
    if (!unlockUser) { toast({ title: "Elegí un usuario", variant: "destructive" }); return; }
    setUnlocking(true);
    try {
      const body: any = { userId: unlockUser };
      if (unlockType === "all") body.unlockAll = true;
      else body.dateLabel = unlockDate;
      const res = await fetch("/api/admin/unlock", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✓ Apuestas desbloqueadas" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setUnlocking(false); }
  };

  const handleReset = async () => {
    if (!resetUser) { toast({ title: "Elegí un usuario", variant: "destructive" }); return; }
    const userName = users.find(u => u.id === resetUser)?.display_name;
    if (!confirm(`¿Seguro que querés resetear las apuestas de ${userName}? Esto no se puede deshacer.`)) return;
    setResetting(true);
    try {
      const body: any = { userId: resetUser };
      if (resetType === "specials") body.resetSpecials = true;
      else body.dateLabel = resetDate;
      const res = await fetch("/api/admin/reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✓ Predicciones reseteadas" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setResetting(false); }
  };

  return (
    <div className="space-y-8">


      {/* Unlock */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">🔓 Desbloquear apuestas</h2>
        <select value={unlockUser} onChange={e => setUnlockUser(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">— Elegir jugador —</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.display_name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => setUnlockType("all")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${unlockType === "all" ? "bg-primary text-white" : "border-gray-200 text-gray-600"}`}>
            Todas</button>
          <button onClick={() => setUnlockType("date")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${unlockType === "date" ? "bg-primary text-white" : "border-gray-200 text-gray-600"}`}>
            Por fecha</button>
        </div>
        {unlockType === "date" && (
          <select value={unlockDate} onChange={e => setUnlockDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {DATE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        )}
        <button onClick={handleUnlock} disabled={unlocking}
          className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
          {unlocking ? "..." : "Desbloquear"}</button>
      </div>

      {/* Reset */}
      <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
        <h2 className="font-semibold text-red-700">🗑️ Resetear predicciones</h2>
        <p className="text-xs text-red-500">Borra las predicciones del usuario. No se puede deshacer.</p>
        <select value={resetUser} onChange={e => setResetUser(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
          <option value="">— Elegir jugador —</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.display_name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => setResetType("date")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${resetType === "date" ? "bg-red-500 text-white" : "border-gray-200 text-gray-600"}`}>
            Por fecha</button>
          <button onClick={() => setResetType("specials")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${resetType === "specials" ? "bg-red-500 text-white" : "border-gray-200 text-gray-600"}`}>
            Especiales</button>
        </div>
        {resetType === "date" && (
          <select value={resetDate} onChange={e => setResetDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
            {DATE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        )}
        <button onClick={handleReset} disabled={resetting}
          className="w-full bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50">
          {resetting ? "Reseteando..." : "Resetear"}</button>
      </div>

      {/* Manual result */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">⚽ Ingresar resultado manualmente</h2>
        <div className="flex gap-2">
          <input type="text" value={matchSearch} onChange={e => setMatchSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchMatches()}
            placeholder="Buscar por equipo o fecha"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={searchMatches} disabled={searching}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
            {searching ? "..." : "Buscar"}</button>
        </div>
        <div className="space-y-2">
          {matches.map(m => (
            <div key={m.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{m.home_team} vs {m.away_team}</span>
                {m.home_score !== null && <span className="text-sm font-bold text-primary">{m.home_score} - {m.away_score}</span>}
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={results[m.id]?.home ?? (m.home_score?.toString() ?? "")}
                  onChange={e => setResults(r => ({ ...r, [m.id]: { ...r[m.id], home: e.target.value } }))}
                  className="w-14 text-center border rounded-lg py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                <span className="text-gray-400">-</span>
                <input type="number" min="0" value={results[m.id]?.away ?? (m.away_score?.toString() ?? "")}
                  onChange={e => setResults(r => ({ ...r, [m.id]: { ...r[m.id], away: e.target.value } }))}
                  className="w-14 text-center border rounded-lg py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                <button onClick={() => saveResult(m.id)} disabled={saving === m.id}
                  className="ml-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50">
                  {saving === m.id ? "..." : "Guardar"}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
