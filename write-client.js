const fs = require('fs');
const content = `"use client";

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
  exact_results: number;
  diff_results: number;
  simple_results: number;
  co2_points: number;
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

const PERIOD_OPTIONS = [
  { key: "fecha_1", label: "Fecha 1" },
  { key: "fecha_2", label: "Fecha 2" },
  { key: "fecha_3", label: "Fecha 3" },
];

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
      const res = await fetch(\`/api/leaderboard/snapshot?date=\${date}\`);
      const data = await res.json();
      setRows(data.rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriod = async (periodKey: string) => {
    setLoading(true);
    setSelectedDate(periodKey);
    try {
      const res = await fetch(\`/api/leaderboard/period?period=\${periodKey}\`);
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
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Ver tabla al:</span>
        {PERIOD_OPTIONS.map(opt => (
          <button key={opt.key} onClick={() => loadPeriod(opt.key)}
            className={\`px-3 py-1.5 rounded-full text-sm font-medium transition-colors \${
              selectedDate === opt.key ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
            }\`}>
            {opt.label}
          </button>
        ))}
        {snapshots.map(s => (
          <button key={s.snapshot_date} onClick={() => loadSnapshot(s.snapshot_date)}
            className={\`px-3 py-1.5 rounded-full text-sm font-medium transition-colors \${
              selectedDate === s.snapshot_date ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
            }\`}>
            {(() => { const p = s.snapshot_date.substring(0,10).split('-'); return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2])).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }); })()}
          </button>
        ))}
        <button onClick={() => loadSnapshot("current")}
          className={\`px-3 py-1.5 rounded-full text-sm font-medium transition-colors \${
            selectedDate === "current" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
          }\`}>
          Hoy
        </button>
      </div>

      <div className={\`bg-white rounded-2xl border border-gray-200 overflow-hidden transition-opacity \${loading ? "opacity-50" : ""}\`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-10">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Jugador</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-600">Pts</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-600 hidden lg:table-cell">Exactos</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-600 hidden lg:table-cell">Simples</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-600 hidden md:table-cell">CO2</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-600 hidden md:table-cell">Especiales</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isMe = row.user_id === currentUserId;
              return (
                <tr key={row.user_id} className={\`border-b border-gray-50 last:border-0 transition-colors \${
                  isMe ? "bg-primary/5" : "hover:bg-gray-50"
                }\`}>
                  <td className="px-4 py-3 text-center">
                    {MEDALS[i] ?? <span