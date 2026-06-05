"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { parseISO } from "date-fns";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  group_name: string;
  stage: string;
  is_visible: boolean;
}

export function AdminMatchesClient({ matches: initial }: { matches: Match[] }) {
  const { toast } = useToast();
  const [matches, setMatches] = useState(initial);

  const toggleVisibility = async (id: string, visible: boolean) => {
    try {
      const res = await fetch("/api/admin/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id, isVisible: !visible }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMatches(m => m.map(x => x.id === id ? { ...x, is_visible: !visible } : x));
      toast({ title: !visible ? "Partido visible" : "Partido oculto" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestion de Partidos</h1>
      <div className="space-y-2">
        {matches.map(m => (
          <div key={m.id} className="bg-white rounded-xl border px-4 py-3 flex items-center justify-between">
            <div>
              <span className="font-medium">{m.home_team} vs {m.away_team}</span>
              <span className="text-xs text-gray-400 ml-3">
                {parseISO(m.match_date).toLocaleDateString("es-AR")} · Grupo {m.group_name}
              </span>
            </div>
            <button
              onClick={() => toggleVisibility(m.id, m.is_visible)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                m.is_visible
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {m.is_visible ? "Visible" : "Oculto"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}