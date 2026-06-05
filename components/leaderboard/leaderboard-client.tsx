"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Row {
  user_id: string;
  display_name: string;
  total_points: number;
  special_points: number;
  matches_predicted: number;
  correct_results: number;
}

interface Snapshot {
  snapshot_date: string;
}

interface Props {
  rows: Row[];
  currentUserId: string;
  snapshots: Snapshot[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardClient({ rows: initialRows, currentUserId, snapshots }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [selectedDate, setSelectedDate] = useState<string>("current");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedDate === "current") router.refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [router, selectedDate]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const loadSnapshot = async (date: string) => {
    if (date === "current") {
      setRows(initialRows);
      setSelectedDate("current");
      return;
    }
    setLoading(true);
    setSelectedDate(date);
    try {
      const res = await fetch(`/api/leaderboard/snapshot?date=${date}`);
      const data = await res.json();
      setRows(data.rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Date selector */}
      {snapshots.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Ver tabla al:</span>
          <button onClick={() => loadSnapshot("current")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedDate === "current" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
            }`}>
            {snapshots.map(s => (
            <button key={s.snapshot_date} onClick={() => loadSnapshot(s.snapshot_date)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedDate === s.snapshot_date ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
              }`}>
              {format(parseISO(s.snapshot_date), "d MMM", { locale: es })}
            </button>
          ))}
          <button onClick={() => loadSnapshot("current")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedDate === "current" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
            }`}>
            Hoy
          </button>
        </div>
      )}
      <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden transition-opacity ${loading ? "opacity-50" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-10">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Jugador</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Pts</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Especiales</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Predicciones</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Aciertos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isMe = row.user_id === currentUserId;
              return (
                <tr key={row.user_id} className={`border-b border-gray-50 last:border-0 transition-colors ${
                  isMe ? "bg-primary/5" : "hover:bg-gray-50"
                }`}>
                  <td className="px-4 py-3 text-center">
                    {MEDALS[i] ?? <span className="text-gray-400 font-medium">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${isMe ? "text-primary" : "text-gray-900"}`}>
                      {row.display_name}
                      {isMe && <span className="ml-2 text-xs text-primary/60">(vos)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{row.total_points}</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">+{row.special_points}</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{row.matches_predicted}</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{row.correct_results}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aún no hay puntos cargados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
