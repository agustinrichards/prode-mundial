"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  userId: string;
  initialBets: any;
  teams: string[];
  closed: boolean;
  closeDate: string | null;
}

export function SpecialBetsClient({ userId, initialBets, teams, closed, closeDate }: Props) {
  const { toast } = useToast();

  const [champion, setChampion] = useState(initialBets?.champion_team ?? "");
  const [champConfirmed, setChampConfirmed] = useState(!!initialBets?.champion_team);
  const [champSaving, setChampSaving] = useState(false);

  const [scorer, setScorer] = useState(initialBets?.top_scorer_name ?? "");
  const [scorerConfirmed, setScorerConfirmed] = useState(!!initialBets?.top_scorer_name);
  const [scorerSaving, setScorerSaving] = useState(false);

  const submitBet = async (field: "champion" | "scorer") => {
    const value = field === "champion" ? champion : scorer;
    if (!value.trim()) { toast({ title: "Completá el campo", variant: "destructive" }); return; }
    if (field === "champion") setChampSaving(true);
    else setScorerSaving(true);
    try {
      const res = await fetch("/api/special-bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championTeam: field === "champion" ? value : undefined,
          topScorerName: field === "scorer" ? value : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      if (field === "champion") setChampConfirmed(true);
      else setScorerConfirmed(true);
      toast({ title: "✓ Apuesta confirmada — no se puede modificar" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      if (field === "champion") setChampSaving(false);
      else setScorerSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {closed && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Las apuestas especiales están cerradas.
        </div>
      )}

      {/* Campeón */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">🏆 Campeón del Mundial</h3>
          {champConfirmed && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check className="w-3.5 h-3.5" /> Confirmado</span>}
        </div>
        {champConfirmed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-green-800">{champion}</p>
            <p className="text-xs text-green-600 mt-0.5">Confirmado — no se puede modificar</p>
          </div>
        ) : closed ? (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-500">
            {champion || "Sin apuesta"}
          </div>
        ) : (
          <div className="space-y-3">
            <select value={champion} onChange={e => setChampion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Elegir equipo —</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => submitBet("champion")} disabled={champSaving || !champion}
              className="w-full bg-primary text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-primary/90 disabled:opacity-50">
              {champSaving ? "Confirmando..." : "Confirmar apuesta"}
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">1ro: 10pts · 2do: 5pts · 3ro: 2pts</p>
      </div>

      {/* Goleador */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">⚽ Goleador del Mundial</h3>
          {scorerConfirmed && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check className="w-3.5 h-3.5" /> Confirmado</span>}
        </div>
        {scorerConfirmed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-green-800">{scorer}</p>
            <p className="text-xs text-green-600 mt-0.5">Confirmado — no se puede modificar</p>
          </div>
        ) : closed ? (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-500">
            {scorer || "Sin apuesta"}
          </div>
        ) : (
          <div className="space-y-3">
            <input type="text" value={scorer} onChange={e => setScorer(e.target.value)}
              placeholder="ej: Lionel Messi"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={() => submitBet("scorer")} disabled={scorerSaving || !scorer.trim()}
              className="w-full bg-primary text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-primary/90 disabled:opacity-50">
              {scorerSaving ? "Confirmando..." : "Confirmar apuesta"}
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">1ro: 6pts · 2do: 3pts · 3ro: 1pt</p>
      </div>
    </div>
  );
}
