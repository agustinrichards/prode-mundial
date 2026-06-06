"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface WaterUpdate {
  week_number: number;
  week_date: string;
  weekly_net: number;
  cumulative: number;
}

interface Bet {
  water_installations: number;
  display_name: string;
}

interface Props {
  userId: string;
  currentBet: number | null;
  closed: boolean;
  updates: WaterUpdate[];
  allBets: Bet[];
}

export function WaterBetClient({ userId, currentBet, closed, updates, allBets }: Props) {
  const { toast } = useToast();
  const [value, setValue] = useState(currentBet?.toString() ?? "");
  const [submitted, setSubmitted] = useState(currentBet !== null);
  const [saving, setSaving] = useState(false);

  const lastUpdate = updates.length > 0 ? updates[updates.length - 1] : null;

  const handleSubmit = async () => {
    if (!value.trim() || isNaN(parseInt(value))) {
      toast({ title: "Ingresá un número válido", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/special-bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waterInstallations: parseInt(value) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSubmitted(true);
      toast({ title: "✓ Apuesta de agua confirmada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">💧 Instalaciones Netas de Agua Local</h3>
        {submitted && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check className="w-3.5 h-3.5" /> Confirmado</span>}
      </div>
      <p className="text-sm text-gray-500">
        Adiviná la cantidad de instalaciones netas de agua local entre el 11 de junio y el 19 de julio.
        <br />
        <span className="text-xs">Exacto: 10pts · Más cercano: 5pts</span>
      </p>

      {/* Weekly progress */}
      {updates.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-700 mb-2">Progreso semanal</p>
          <div className="space-y-1">
            {updates.map(u => (
              <div key={u.week_number} className="flex items-center justify-between text-xs">
                <span className="text-blue-600">
                  Semana {u.week_number} · {format(parseISO(u.week_date.substring(0, 10)), "d MMM", { locale: es })}
                </span>
                <span className="font-bold text-blue-800">
                  {u.weekly_net > 0 ? "+" : ""}{u.weekly_net.toLocaleString()} · Acum: {u.cumulative.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {lastUpdate && (
            <p className="text-xs text-blue-700 font-semibold mt-2 pt-2 border-t border-blue-200">
              Acumulado actual: {lastUpdate.cumulative.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Bet input */}
      {closed ? (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
          <Lock className="w-4 h-4 text-gray-400" />
          {submitted ? <>Tu apuesta: <strong className="ml-1">{parseInt(value).toLocaleString()}</strong></> : "No apostaste."}
        </div>
) : submitted ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-green-800">{parseInt(value).toLocaleString()} instalaciones</p>
            <p className="text-xs text-green-600 mt-0.5">Tu apuesta está confirmada y no puede modificarse</p>
          </div>
          <Lock className="w-4 h-4 text-green-500" />
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="ej: 1250"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={handleSubmit} disabled={saving || !value.trim()}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Confirmando..." : "Confirmar apuesta"}
          </button>
        </div>
      )}

      {/* All bets (visible after close) */}
      {closed && allBets.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Apuestas de todos</p>
          <div className="space-y-1">
            {allBets.sort((a, b) => a.water_installations - b.water_installations).map((b, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{b.display_name}</span>
                <span className="font-bold">{b.water_installations.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
