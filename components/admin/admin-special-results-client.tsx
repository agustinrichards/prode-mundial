"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  config: any;
  bets: any[];
}

const TEAMS = ["Argentina","Brasil","Francia","España","Alemania","Portugal","Países Bajos","Inglaterra","Bélgica","Uruguay","México","Canadá","Estados Unidos","Marruecos","Senegal","Japón","Corea del Sur","Croacia","Colombia","Ecuador","Suiza","Austria","Türkiye","Noruega","Suecia","Australia","Costa de Marfil","Sudáfrica","Ghana","Qatar","Bosnia y Herzegovina","Haití","Escocia","Paraguay","Curazao","Túnez","Egipto","Irán","Cabo Verde","Arabia Saudita","Iraq","Argelia","Jordania","RD Congo","Uzbekistán","Panamá","Nueva Zelanda"].sort();

export function AdminSpecialResultsClient({ config, bets }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [form, setForm] = useState({
    champion_team: config?.champion_team ?? "",
    runner_up_team: config?.runner_up_team ?? "",
    third_place_team: config?.third_place_team ?? "",
    top_scorer_1: config?.top_scorer_1 ?? "",
    top_scorer_2: config?.top_scorer_2 ?? "",
    top_scorer_3: config?.top_scorer_3 ?? "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/special-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Resultados guardados" });
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
  const scorerStats: Record<string, number> = {};
  bets.forEach(b => {
    if (b.champion_team) champStats[b.champion_team] = (champStats[b.champion_team] ?? 0) + 1;
    if (b.top_scorer_name) scorerStats[b.top_scorer_name] = (scorerStats[b.top_scorer_name] ?? 0) + 1;
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Apuestas Especiales — Resultados</h1>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">🏆 Campeón</h2>
        <div className="grid grid-cols-3 gap-3">
          {(["champion_team","runner_up_team","third_place_team"] as const).map((f, i) => (
            <div key={f}>
              <label className="text-xs text-gray-500 mb-1 block">{["1er lugar","2do lugar","3er lugar"][i]}</label>
              <select value={form[f]} onChange={e => setForm(x => ({ ...x, [f]: e.target.value }))}
                className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— elegir —</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(champStats).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([t,c]) => (
            <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t} ({c})</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">⚽ Goleador</h2>
        <div className="grid grid-cols-3 gap-3">
          {(["top_scorer_1","top_scorer_2","top_scorer_3"] as const).map((f, i) => (
            <div key={f}>
              <label className="text-xs text-gray-500 mb-1 block">{["1er goleador","2do goleador","3er goleador"][i]}</label>
              <input type="text" value={form[f]} onChange={e => setForm(x => ({ ...x, [f]: e.target.value }))}
                placeholder={["Messi","Mbappé","Ronaldo"][i]}
                className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(scorerStats).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n,c]) => (
            <span key={n} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{n} ({c})</span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar resultados"}
        </button>
        <button onClick={handleCalculate} disabled={calculating}
          className="px-6 py-2.5 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 disabled:opacity-50">
          {calculating ? "Calculando..." : "Calcular puntos"}
        </button>
      </div>
    </div>
  );
}
