"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const TEAMS = ["Argentina","Brasil","Francia","España","Alemania","Portugal","Países Bajos","Inglaterra","Bélgica","Uruguay","México","Canadá","Estados Unidos","Marruecos","Senegal","Japón","Corea del Sur","Croacia","Colombia","Ecuador","Suiza","Austria","Türkiye","Noruega","Suecia","Australia","Costa de Marfil","Sudáfrica","Ghana","Qatar","Bosnia y Herzegovina","Haití","Escocia","Paraguay","Curazao","Túnez","Egipto","Irán","Cabo Verde","Arabia Saudita","Iraq","Argelia","Jordania","RD Congo","Uzbekistán","Panamá","Nueva Zelanda"].sort();

const STAGE_LABELS: Record<string, string> = {
  round_of_32: "Ronda de 32",
  round_of_16: "Octavos de Final",
  quarterfinal: "Cuartos de Final",
  semifinal: "Semifinales",
  third_place: "3er y 4to Puesto",
  final: "Final",
};

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stage: string;
  date_label: string;
}

export function AdminKnockoutClient({ matches }: { matches: Match[] }) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Record<string, { home: string; away: string }>>(
    Object.fromEntries(matches.map(m => [m.id, { home: m.home_team, away: m.away_team }]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  const saveMatch = async (matchId: string) => {
    const t = teams[matchId];
    if (!t.home || !t.away) { toast({ title: "Elegí ambos equipos", variant: "destructive" }); return; }
    setSaving(matchId);
    try {
      const res = await fetch("/api/admin/knockout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeTeam: t.home, awayTeam: t.away }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✓ Equipos actualizados" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  // Group by stage
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    if (!grouped[m.stage]) grouped[m.stage] = [];
    grouped[m.stage].push(m);
  }

  const isPlaceholder = (name: string) => name.startsWith("Ganador") || name.startsWith("Perdedor") || name.startsWith("3ro") || name.startsWith("Segundo");

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([stage, stageMatches]) => (
        <div key={stage}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {STAGE_LABELS[stage] ?? stage}
          </h2>
          <div className="space-y-3">
            {stageMatches.map(m => {
              const t = teams[m.id];
              const homeIsPlaceholder = isPlaceholder(m.home_team);
              const awayIsPlaceholder = isPlaceholder(m.away_team);
              return (
                <div key={m.id} className="bg-white rounded-xl border p-4">
                  <p className="text-xs text-gray-400 mb-3">
                    {new Date(m.match_date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      {homeIsPlaceholder ? (
                        <select value={t.home} onChange={e => setTeams(prev => ({ ...prev, [m.id]: { ...prev[m.id], home: e.target.value } }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value={m.home_team}>{m.home_team}</option>
                          {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800">{t.home}</div>
                      )}
                    </div>
                    <span className="text-gray-400 font-bold text-lg">vs</span>
                    <div className="flex-1">
                      {awayIsPlaceholder ? (
                        <select value={t.away} onChange={e => setTeams(prev => ({ ...prev, [m.id]: { ...prev[m.id], away: e.target.value } }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value={m.away_team}>{m.away_team}</option>
                          {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800">{t.away}</div>
                      )}
                    </div>
                  </div>
                  {(homeIsPlaceholder || awayIsPlaceholder) && (
                    <button onClick={() => saveMatch(m.id)} disabled={saving === m.id}
                      className="mt-3 w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                      {saving === m.id ? "Guardando..." : "Confirmar equipos"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
