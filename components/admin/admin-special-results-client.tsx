"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  config: any;
  bets: any[];
}

const TEAMS = ["Argentina","Brasil","Francia","España","Alemania","Portugal","Países Bajos","Inglaterra","Bélgica","Uruguay","México","Canadá","Estados Unidos","Marruecos","Senegal","Japón","Corea del Sur","Croacia","Colombia","Ecuador","Suiza","Austria","Türkiye","Noruega","Suecia","Australia","Costa de Marfil","Sudáfrica","Ghana","Qatar","Bosnia y Herzegovina","Haití","Escocia","Paraguay","Curazao","Túnez","Egipto","Irán","Cabo Verde","Arabia Saudita","Iraq","Argelia","Jordania","RD Congo","Uzbekistán","Panamá","Nueva Zelanda"].sort();

const SCORER_OPTIONS = [
  { value: "", label: "— Sin asignar —", pts: null },
  { value: "1", label: "1er goleador · 10 pts", pts: 10 },
  { value: "2", label: "2do goleador · 5 pts", pts: 5 },
  { value: "3", label: "3er goleador · 2 pts", pts: 2 },
  { value: "0", label: "No aparece · 0 pts", pts: 0 },
];

const CHAMP_OPTIONS = [
  { value: "", label: "— Sin asignar —", pts: null },
  { value: "1", label: "Campeón · 10 pts", pts: 10 },
  { value: "2", label: "2do lugar · 5 pts", pts: 5 },
  { value: "3", label: "3er lugar · 2 pts", pts: 2 },
  { value: "0", label: "No clasificó · 0 pts", pts: 0 },
];

export function AdminSpecialResultsClient({ config, bets }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [champForm, setChampForm] = useState({
    champion_team: config?.champion_team ?? "",
    runner_up_team: config?.runner_up_team ?? "",
    third_place_team: config?.third_place_team ?? "",
  });

  // scorer results per user: userId -> "1"|"2"|"3"|"0"|""
  const [scorerResults, setScorerResults] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    bets.forEach(b => {
      if (b.scorer_points === 10) init[b.user_id] = "1";
      else if (b.scorer_points === 5) init[b.user_id] = "2";
      else if (b.scorer_points === 2) init[b.user_id] = "3";
      else if (b.scorer_points === 0) init[b.user_id] = "0";
      else init[b.user_id] = "";
    });
    return init;
  });

  const handleSaveChamp = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/special-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(champForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Resultados de campeón guardados" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScorer = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(scorerResults)
        .filter(([, v]) => v !== "")
        .map(([userId, rank]) => ({
          userId,
          pts: SCORER_OPTIONS.find(o => o.value === rank)?.pts ?? 0,
        }));

      const res = await fetch("/api/admin/special-results/scorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Puntos de goleador guardados" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/admin/special-results/calculate", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Puntos calculados y leaderboard actualizado" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  };

  const champStats: Record<string, number> = {};
  bets.forEach(b => {
    if (b.champion_team) champStats[b.champion_team] = (champStats[b.champion_team] ?? 0) + 1;
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Apuestas Especiales — Resultados</h1>

      {/* Campeon */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">🏆 Campeón</h2>
        <div className="grid grid-cols-3 gap-3">
          {(["champion_team","runner_up_team","third_place_team"] as const).map((f, i) => (
            <div key={f}>
              <label className="text-xs text-gray-500 mb-1 block">{["1er lugar","2do lugar","3er lugar"][i]}</label>
              <select value={champForm[f]} onChange={e => setChampForm(x => ({ ...x, [f]: e.target.value }))}
                className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— elegir —</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(champStats).sort((a,b)=>b[1]-a[1]).map(([t,c]) => (
            <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t} ({c})</span>
          ))}
        </div>
        <button onClick={handleSaveChamp} disabled={saving}
          className="px-5 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar campeón"}
        </button>
      </div>

      {/* Goleador */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">⚽ Goleador — asignar por jugador</h2>
        <div className="space-y-3">
          {bets.map(b => (
            <div key={b.user_id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{b.display_name}</p>
                <p className="text-xs text-gray-400">{b.top_scorer_name || "Sin apuesta"}</p>
              </div>
              <select
                value={scorerResults[b.user_id] ?? ""}
                onChange={e => setScorerResults(r => ({ ...r, [b.user_id]: e.target.value }))}
                className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SCORER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button onClick={handleSaveScorer} disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar puntos goleador"}
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={handleCalculate} disabled={calculating}
          className="px-6 py-2.5 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 disabled:opacity-50">
          {calculating ? "Calculando..." : "Recalcular leaderboard"}
        </button>
      </div>
    </div>
  );
}