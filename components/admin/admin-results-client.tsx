"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Lock, Unlock } from "lucide-react";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stage: string;
  date_label: string;
  home_score: number | null;
  away_score: number | null;
  results_locked?: boolean;
  manually_locked?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_32: "Ronda de 32",
  round_of_16: "Octavos de Final",
  quarterfinal: "Cuartos de Final",
  semifinal: "Semifinales",
  third_place: "3er y 4to Puesto",
  final: "Final",
};

export function AdminResultsClient({ matches: initialMatches }: { matches: Match[] }) {
  const { toast } = useToast();
  const [matches, setMatches] = useState(initialMatches);
  const [results, setResults] = useState<Record<string, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [locked, setLocked] = useState<Set<string>>(
    new Set(initialMatches.filter(m => m.results_locked).map(m => m.id))
  );

  const getR = (id: string, match: Match) => results[id] ?? {
    home: match.home_score?.toString() ?? "",
    away: match.away_score?.toString() ?? "",
  };

  const saveResult = async (match: Match) => {
    const r = getR(match.id, match);
    if (r.home === "" || r.away === "") {
      toast({ title: "Ingresa ambos goles", variant: "destructive" });
      return;
    }
    setSaving(s => ({ ...s, [match.id]: true }));
    try {
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: parseInt(r.home),
          awayScore: parseInt(r.away),
          homeAet: null,
          awayAet: null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMatches(ms => ms.map(m => m.id === match.id ? {
        ...m,
        home_score: parseInt(r.home),
        away_score: parseInt(r.away),
      } : m));
      setLocked(prev => new Set([...prev, match.id]));
      toast({ title: `✓ ${match.home_team} vs ${match.away_team} guardado` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(s => ({ ...s, [match.id]: false }));
    }
  };

  const saveAll = async () => {
    const pending = matches.filter(m => {
      const r = getR(m.id, m);
      return !locked.has(m.id) && r.home !== "" && r.away !== "";
    });
    if (pending.length === 0) {
      toast({ title: "No hay resultados para guardar", variant: "destructive" });
      return;
    }
    setSavingAll(true);
    let saved = 0;
    for (const match of pending) {
      const r = getR(match.id, match);
      try {
        const res = await fetch("/api/admin/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: match.id,
            homeScore: parseInt(r.home),
            awayScore: parseInt(r.away),
            homeAet: null,
            awayAet: null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMatches(ms => ms.map(m => m.id === match.id ? {
          ...m,
          home_score: parseInt(r.home),
          away_score: parseInt(r.away),
        } : m));
        setLocked(prev => new Set([...prev, match.id]));
        saved++;
      } catch (e: any) {
        toast({ title: `Error en ${match.home_team} vs ${match.away_team}`, description: e.message, variant: "destructive" });
      }
    }
    setSavingAll(false);
    if (saved > 0) toast({ title: `✓ ${saved} resultados guardados y puntos calculados` });
  };

  const toggleManualLock = async (matchId: string, currentlyLocked: boolean) => {
    try {
      const res = await fetch("/api/admin/match-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, locked: !currentlyLocked }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMatches(ms => ms.map(m => m.id === matchId ? { ...m, manually_locked: !currentlyLocked } : m));
      toast({ title: !currentlyLocked ? "Partido bloqueado para jugadores" : "Partido desbloqueado" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const unlockMatch = async (matchId: string) => {
    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, unlockResult: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setLocked(prev => { const s = new Set(prev); s.delete(matchId); return s; });
      toast({ title: "Resultado desbloqueado" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Group by stage
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    if (!grouped[m.stage]) grouped[m.stage] = [];
    grouped[m.stage].push(m);
  }

  const stageOrder = ["group", "round_of_32", "round_of_16", "quarterfinal", "semifinal", "third_place", "final"];
  const sortedStages = Object.keys(grouped).sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b));

  const pendingCount = matches.filter(m => {
    const r = getR(m.id, m);
    return !locked.has(m.id) && r.home !== "" && r.away !== "";
  }).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cargar Resultados</h1>
          <p className="text-sm text-gray-500 mt-1">
            {matches.filter(m => m.home_score === null && !locked.has(m.id)).length} partidos pendientes · Penales no se cargan
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={savingAll || pendingCount === 0}
          className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {savingAll ? "Guardando..." : `Guardar todo (${pendingCount})`}
        </button>
      </div>

      {sortedStages.map(stage => (
        <div key={stage}>
          <div className="flex items-center justify-between mb-3">
  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
    {STAGE_LABELS[stage] ?? stage}
  </h2>
  <button
    onClick={async () => {
      if (!confirm(`¿Resetear todos los resultados de ${STAGE_LABELS[stage] ?? stage}?`)) return;
      try {
        const res = await fetch("/api/admin/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resetStage: stage }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMatches(ms => ms.map(m => m.stage === stage ? { ...m, home_score: null, away_score: null } : m));
        setLocked(prev => { const s = new Set(prev); matches.filter(m => m.stage === stage).forEach(m => s.delete(m.id)); return s; });
        toast({ title: `✓ Resultados de ${STAGE_LABELS[stage] ?? stage} reseteados` });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    }}
    className="text-xs text-red-400 hover:text-red-600 transition-colors"
  >
    Resetear fase
  </button>
</div>
          <div className="space-y-3">
            {grouped[stage].map(match => {
              const r = getR(match.id, match);
              const isLocked = locked.has(match.id);
              const hasResult = match.home_score !== null;

              return (
                <div key={match.id} className={`bg-white rounded-xl border p-4 ${isLocked ? "border-green-200 bg-green-50/30" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-gray-900">{match.home_team} vs {match.away_team}</span>
                      <span className="text-xs text-gray-400 ml-3">
                        {format(parseISO(match.match_date), "d MMM · HH:mm", { locale: es })}
                      </span>
                    </div>
<div className="flex items-center gap-2">
                      <button onClick={() => toggleManualLock(match.id, !!match.manually_locked)}
                        className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-full ${
                          match.manually_locked ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-red-500"
                        }`}>
                        {match.manually_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {match.manually_locked ? "Bloqueado" : "Bloquear"}
                      </button>
                      {isLocked && (
                        <button onClick={() => unlockMatch(match.id)}
                          className="text-xs text-gray-400 hover:text-orange-500 flex items-center gap-1 transition-colors">
                          <Unlock className="w-3 h-3" /> Desbloquear
                        </button>
                      )}
                      {isLocked && <Lock className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" min="0"
                      value={r.home}
                      disabled={isLocked}
                      onChange={e => setResults(s => ({ ...s, [match.id]: { ...getR(match.id, match), home: e.target.value } }))}
                      className={`w-16 text-center border rounded-lg py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400 ${
                        isLocked ? "border-green-200" : ""
                      }`}
                      placeholder="0"
                    />
                    <span className="text-gray-400 font-bold text-lg">-</span>
                    <input
                      type="number" min="0"
                      value={r.away}
                      disabled={isLocked}
                      onChange={e => setResults(s => ({ ...s, [match.id]: { ...getR(match.id, match), away: e.target.value } }))}
                      className={`w-16 text-center border rounded-lg py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400 ${
                        isLocked ? "border-green-200" : ""
                      }`}
                      placeholder="0"
                    />
                    {!isLocked && (
                      <button
                        onClick={() => saveResult(match)}
                        disabled={saving[match.id]}
                        className="ml-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                      >
                        {saving[match.id] ? "..." : "Guardar"}
                      </button>
                    )}
                    {isLocked && hasResult && (
                      <span className="ml-2 text-sm font-bold text-green-600">✓ Guardado</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}