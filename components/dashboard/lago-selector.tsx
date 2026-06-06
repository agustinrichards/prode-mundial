"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  userId: string;
  currentLagoDay: string | null;
  groupMatchDays: string[];
  isLocked: boolean;
}

export function LagoSelector({ userId, currentLagoDay, groupMatchDays, isLocked }: Props) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(currentLagoDay);
  const [confirmed, setConfirmed] = useState<string | null>(currentLagoDay);
  const [saving, setSaving] = useState(false);

const formatDate = (d: string) => {
  try {
    if (!d || typeof d !== "string") return String(d || "");
    const parts = d.substring(0, 10).split("-");
    if (parts.length !== 3) return d;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return d;
    const local = new Date(year, month, day);
    return local.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return d;
  }
};

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/special-bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lagoDay: selected }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setConfirmed(selected);
      toast({ title: `✓ LAGO confirmado: ${formatDate(selected)}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">🌊 Comodín LAGO</h3>
        {confirmed && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check className="w-3.5 h-3.5" /> Confirmado</span>}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Elegí un día de grupos. Ese día sumás los puntos del jugador que más puntos hizo (además de los tuyos).
      </p>

      {isLocked ? (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
          <Lock className="w-4 h-4 text-gray-400" />
          {confirmed ? <>Día elegido: <strong className="ml-1">{formatDate(confirmed)}</strong></> : "No elegiste un día LAGO."}
        </div>
      ) : confirmed ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-green-800">{formatDate(confirmed)}</p>
            <p className="text-xs text-green-600 mt-0.5">Confirmado — no se puede modificar</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {groupMatchDays.map(day => (
              <button key={day} onClick={() => setSelected(day)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  selected === day
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:bg-purple-50"
                }`}>
                {formatDate(day)}
              </button>
            ))}
          </div>
          {selected && (
            <button onClick={handleConfirm} disabled={saving}
              className="w-full bg-purple-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {saving ? "Confirmando..." : `Confirmar ${formatDate(selected)}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
