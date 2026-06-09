"use client";

import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface WaterUpdate {
  week_number: number;
  week_date: string;
  weekly_net: number;
  cumulative: number;
  notes: string;
}

interface Props {
  updates: WaterUpdate[];
}

function formatWeekDate(val: string) {
  if (!val) return "";
  const d = parseISO(val);
  return isValid(d) ? format(d, "d MMM", { locale: es }) : val;
}

export function AguaLocalClient({ updates }: Props) {
  const lastUpdate = updates[updates.length - 1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Acumulado total</p>
          <p className="text-4xl font-bold text-primary">{lastUpdate?.cumulative ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">instalaciones netas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ultima semana</p>
          <p className="text-4xl font-bold text-blue-600">
            {lastUpdate?.weekly_net >= 0 ? "+" : ""}{lastUpdate?.weekly_net ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Semana {lastUpdate?.week_number} - {formatWeekDate(lastUpdate?.week_date)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Instalaciones por semana</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={updates} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week_date" tickFormatter={formatWeekDate} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: any) => [`${value} instalaciones`, "Semanal"]}
              labelFormatter={(label) => `Semana del ${formatWeekDate(label)}`}
            />
            <Bar dataKey="weekly_net" radius={[4, 4, 0, 0]}>
              {updates.map((entry) => (
                <Cell
                  key={entry.week_number}
                  fill={entry.weekly_net >= 0 ? "#0077B6" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Acumulado durante el Mundial</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={updates} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week_date" tickFormatter={formatWeekDate} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: any) => [`${value} instalaciones`, "Acumulado"]}
              labelFormatter={(label) => `Al ${formatWeekDate(label)}`}
            />
            <Bar dataKey="cumulative" fill="#00B4D8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Semana</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Fecha</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Semanal</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {updates.map((u) => (
              <tr key={u.week_number} className="border-t border-gray-50">
                <td className="px-4 py-3 text-gray-600">Semana {u.week_number}</td>
                <td className="px-4 py-3 text-gray-600">{formatWeekDate(u.week_date)}</td>
                <td className={`px-4 py-3 text-right font-medium ${u.weekly_net >= 0 ? "text-blue-600" : "text-red-500"}`}>
                  {u.weekly_net >= 0 ? "+" : ""}{u.weekly_net}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{u.cumulative}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
