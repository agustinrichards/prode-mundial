"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stage: string;
  home_score: number | null;
  away_score: number | null;
}

export function AdminResultsClient({ matches }: { matches: Match[] }) {
  const { toast } = useToast();
  const [results, setResults] = useState<Record<string, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const getR = (id: string) => results[id] ?? { home: "", away: "" };

  const saveResult = async (match: Match) => {
    const r = getR(match.id);
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
      toast({ title: "Resultado guardado y puntos calculados" });
      window.location.reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(s => ({ ...s, [match.id]: false }));
    }
  };

  const pending = matches.filter(m => m.home_score === null);
  const done = matches.filter(m => m.home_score !== null);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Cargar Resultados</h1>
        <p className="text-sm text-gray-500 mt-1">{pending.length} partidos pendientes · Penales no se cargan</p>
      </div>
      <div className="space-y-3">
        {pending.map(match => {
          const r = getR(match.id);
          return (
            <div key={match.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">{match.home_team} vs {match.away_team}</span>
                <span className="text-xs text-gray-400">
                  {format(parseISO(match.match_date), "d MMM · HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0" value={r.home}
                  onChange={e => setResults(s => ({ ...s, [match.id]: { ...getR(match.id), home: e.target.value } }))}
                  className="w-16 text-center border rounded-lg py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
                <span className="text-gray-400 font-bold text-lg">-</span>
                <input
                  type="number" min="0" value={r.away}
                  onChange={e => setResults(s => ({ ...s, [match.id]: { ...getR(match.id), away: e.target.value } }))}
                  className="w-16 text-center border rounded-lg py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
                <button
                  onClick={() => saveResult(match)}
                  disabled={saving[match.id]}
                  className="ml-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving[match.id] ? "Guardando..." : "Guardar"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Ingresa el resultado final. Penales no cuentan.</p>
            </div>
          );
        })}
        {pending.length === 0 && <p className="text-gray-400 text-sm">No hay partidos pendientes.</p>}
      </div>
      {done.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Resultados cargados ({done.length})</h2>
          <div className="space-y-1.5">
            {done.map(m => (
              <div key={m.id} className="bg-gray-50 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="text-gray-700">{m.home_team} vs {m.away_team}</span>
                <span className="font-bold text-primary">{m.home_score} - {m.away_score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}