"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WaterUpdate {
  id: string;
  week_number: number;
  week_date: string;
  weekly_net: number;
  cumulative: number;
  notes: string;
}

interface Bet {
  water_installations: number;
  display_name: string;
}

interface Props {
  updates: WaterUpdate[];
  waterReal: number | null;
  bets: Bet[];
}

// Viernes del Mundial 2026 + día de la final
const WATER_DATES = [
  { date: "2026-06-13", label: "Vie 13 Jun" },
  { date: "2026-06-20", label: "Vie 20 Jun" },
  { date: "2026-06-27", label: "Vie 27 Jun" },
  { date: "2026-07-04", label: "Vie 4 Jul" },
  { date: "2026-07-11", label: "Vie 11 Jul" },
  { date: "2026-07-18", label: "Vie 18 Jul" },
  { date: "2026-07-20", label: "Dom 20 Jul · Final" },
];

export function AdminWaterClient({ updates: initial, waterReal: initialReal, bets }: Props) {
  const { toast } = useToast();
  const [updates, setUpdates] = useState(initial);
  const [waterReal, setWaterReal] = useState(initialReal?.toString() ?? "");
  const [form, setForm] = useState({ weekDate: "", weeklyNet: "", cumulative: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const addUpdate = async () => {
    if (!form.weekDate || !form.weeklyNet || !form.cumulative) {
      toast({ title: "Completá todos los campos", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const weekNumber = WATER_DATES.findIndex(d => d.date === form.weekDate) + 1;
      const res = await fetch("/api/admin/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          weekDate: form.weekDate,
          weeklyNet: parseInt(form.weeklyNet),
          cumulative: parseInt(form.cumulative),
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setUpdates(u => [...u, data.update].sort((a, b) => a.week_number - b.week_number));
      setForm({ weekDate: "", weeklyNet: "", cumulative: "", notes: "" });
      toast({ title: "Actualización agregada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveReal = async () => {
    try {
      const res = await fetch("/api/admin/water/final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waterReal: parseInt(waterReal) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Resultado final guardado" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const lastCumulative = updates.length > 0 ? updates[updates.length - 1].cumulative : 0;
  const usedDates = new Set(updates.map(u => u.week_date.split("T")[0]));

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Instalaciones de Agua Local</h1>
        <p className="text-sm text-gray-500 mt-1">Actualizá cada viernes durante el Mundial (13 Jun – 19 Jul)</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800">Acumulado actual: <span className="text-2xl font-bold">{lastCumulative.toLocaleString()}</span></p>
        <p className="text-xs text-blue-600 mt-1">{updates.length} actualizaciones cargadas</p>
      </div>

      {updates.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Fecha</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Neto</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {updates.map(u => {
                const dateStr = u.week_date.split("T")[0];
                const label = WATER_DATES.find(d => d.date === dateStr)?.label ??
                  format(new Date(dateStr + "T12:00:00"), "d MMM", { locale: es });
                return (
                  <tr key={u.id} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-medium">{label}</td>
                    <td className="px-4 py-2 text-right font-medium">{u.weekly_net > 0 ? "+" : ""}{u.weekly_net.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-bold text-blue-700">{u.cumulative.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Agregar actualización</h2>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
          <select value={form.weekDate} onChange={e => setForm(f => ({ ...f, weekDate: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Seleccioná una fecha</option>
            {WATER_DATES.map(d => (
              <option key={d.date} value={d.date} disabled={usedDates.has(d.date)}>
                {d.label}{usedDates.has(d.date) ? " (ya cargada)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Neto del período</label>
            <input type="number" value={form.weeklyNet} onChange={e => setForm(f => ({ ...f, weeklyNet: e.target.value }))}
              placeholder="ej: +12" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Acumulado total</label>
            <input type="number" value={form.cumulative} onChange={e => setForm(f => ({ ...f, cumulative: e.target.value }))}
              placeholder="ej: 850" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Notas opcionales" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={addUpdate} disabled={saving}
          className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Guardando..." : "Agregar"}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold">Resultado final (al 19 Jul)</h2>
        <div className="flex gap-3">
          <input type="number" value={waterReal} onChange={e => setWaterReal(e.target.value)}
            placeholder="Total final de instalaciones netas"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={saveReal} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
            Guardar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-3">Apuestas de los jugadores ({bets.length})</h2>
        <div className="space-y-2">
          {bets.map((b, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{b.display_name}</span>
              <span className="font-bold">{b.water_installations.toLocaleString()}</span>
            </div>
          ))}
          {bets.length === 0 && <p className="text-sm text-gray-400">Nadie apostó todavía.</p>}
        </div>
      </div>
    </div>
  );
}