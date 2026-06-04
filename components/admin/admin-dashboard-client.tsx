"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface User { id: string; display_name: string; email: string; }
interface Period { date_label: string; is_open: boolean; }
interface PredStatus { user_id: string; date_label?: string; stage?: string; count: number; locked_count: number; }
interface MatchCount { date_label?: string; stage?: string; total: number; }
interface SpecialBet { user_id: string; has_champion: boolean; has_scorer: boolean; has_lago: boolean; has_water: boolean; }
interface DateLabel { key: string; label: string; matchField: string; }

interface Props {
  users: User[];
  periods: Period[];
  predByDateLabel: PredStatus[];
  predByStage: PredStatus[];
  matchCountsByLabel: MatchCount[];
  matchCountsByStage: MatchCount[];
  specialBets: SpecialBet[];
  dateLabels: DateLabel[];
}

export function AdminDashboardClient({
  users,
  periods: initialPeriods,
  predByDateLabel,
  predByStage,
  matchCountsByLabel,
  matchCountsByStage,
  specialBets,
  dateLabels,
}: Props) {
  const { toast } = useToast();
  const [periods, setPeriods] = useState(initialPeriods);
  const [toggling, setToggling] = useState<string | null>(null);

  const togglePeriod = async (dateLabel: string, currentlyOpen: boolean) => {
    setToggling(dateLabel);
    try {
      const res = await fetch("/api/admin/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateLabel, isOpen: !currentlyOpen }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPeriods((p) => p.map((x) => x.date_label === dateLabel ? { ...x, is_open: !currentlyOpen } : x));
      toast({ title: !currentlyOpen ? `Abierto: ${dateLabel}` : `Cerrado: ${dateLabel}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const getPeriod = (key: string) => periods.find((p) => p.date_label === key);

  const getMatchCount = (dl: DateLabel): number => {
    if (dl.matchField === "date_label") {
      const found = matchCountsByLabel.find((m) => m.date_label === dl.key);
      return parseInt(String(found?.total ?? "0"));
    }
    if (dl.matchField === "stage") {
      const found = matchCountsByStage.find((m) => m.stage === dl.key);
      return parseInt(String(found?.total ?? "0"));
    }
    return 0;
  };

  const getUserStatus = (userId: string, dl: DateLabel): string => {
    if (dl.matchField === "special") {
      const b = specialBets.find((s) => s.user_id === userId);
      if (!b) return "empty";
      const filled = [b.has_champion, b.has_scorer, b.has_lago, b.has_water].filter(Boolean).length;
      if (filled === 4) return "complete";
      if (filled > 0) return "partial";
      return "empty";
    }
    const total = getMatchCount(dl);
    if (total === 0) return "empty";
    let count = 0;
    let lockedCount = 0;
    if (dl.matchField === "date_label") {
      const s = predByDateLabel.find((s) => s.user_id === userId && s.date_label === dl.key);
      count = parseInt(String(s?.count ?? "0"));
      lockedCount = parseInt(String(s?.locked_count ?? "0"));
    } else {
      const s = predByStage.find((s) => s.user_id === userId && s.stage === dl.key);
      count = parseInt(String(s?.count ?? "0"));
      lockedCount = parseInt(String(s?.locked_count ?? "0"));
    }
    if (count === 0) return "empty";
    if (lockedCount >= total) return "locked";
    if (count >= total) return "complete";
    return "partial";
  };

  const statusIcon = (status: string) => {
    if (status === "locked") return <span className="text-green-600 font-bold">✓🔒</span>;
    if (status === "complete") return <span className="text-green-500 font-bold">✓</span>;
    if (status === "partial") return <span className="text-yellow-500 font-bold">~</span>;
    return <span className="text-gray-200 font-bold">-</span>;
  };

  const visibleDates = dateLabels.filter((d) => {
    if (d.matchField === "special") return true;
    return getMatchCount(d) > 0;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Periodos de apuestas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {dateLabels.map(({ key, label }) => {
            const period = getPeriod(key);
            const isOpen = period?.is_open ?? false;
            return (
              <div key={key} className={`rounded-xl border p-3 ${isOpen ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
                <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
                <button
                  onClick={() => togglePeriod(key, isOpen)}
                  disabled={toggling === key}
                  className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isOpen ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-600 text-white hover:bg-green-700"
                  } disabled:opacity-50`}
                >
                  {toggling === key ? "..." : isOpen ? "Cerrar" : "Abrir"}
                </button>
                <p className={`text-xs mt-1.5 text-center font-medium ${isOpen ? "text-green-600" : "text-gray-400"}`}>
                  {isOpen ? "Abierto" : "Cerrado"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50">
                Jugador
              </th>
              {visibleDates.map((d) => (
                <th key={d.key} className="text-center px-3 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {d.label}
                  {d.matchField !== "special" && (
                    <span className="block text-gray-300 font-normal">{getMatchCount(d)} p.</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">
                  {u.display_name}
                </td>
                {visibleDates.map((d) => (
                  <td key={d.key} className="px-3 py-3 text-center">
                    {statusIcon(getUserStatus(u.id, d))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t bg-gray-50 flex gap-4 text-xs text-gray-500">
          <span>Confirmado (lock)</span>
          <span>Completo</span>
          <span className="text-yellow-500">Parcial</span>
          <span className="text-gray-300">Sin apuestas</span>
        </div>
      </div>
    </div>
  );
}