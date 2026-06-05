"use client";

import { useState } from "react";
import { format, isBefore, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Lock, Check, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stage: string;
  group_name: string;
  date_label: string;
  venue: string;
  city: string;
  home_score: number | null;
  away_score: number | null;
  predictions_close_at: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  points: number | null;
  prediction_id: string | null;
  locked: boolean;
  co2_used: boolean;
  rio_used: boolean;
  rio_home_pred: number | null;
  rio_away_pred: number | null;
}

interface Props {
  matches: Match[];
  userId: string;
  co2Usage: any[];
  rioUsage: any[];
  periods: { date_label: string; is_open: boolean }[];
}

const CO2_LIMITS: Record<string, number> = { group: 6, round_of_32: 2, round_of_16: 1 };
const RIO_LIMITS: Record<string, number> = { group: 6, round_of_32: 2, quarterfinal: 1 };

const TAB_GROUPS = [
  { key: "fecha_1", label: "Fecha 1", dateLabels: ["fecha_1"] },
  { key: "fecha_2", label: "Fecha 2", dateLabels: ["fecha_2"] },
  { key: "fecha_3", label: "Fecha 3", dateLabels: ["fecha_3"] },
  { key: "round_of_32", label: "Ronda 32", dateLabels: ["r32_1","r32_2","r32_3","r32_4"] },
  { key: "round_of_16", label: "Octavos", dateLabels: ["r16_1","r16_2","r16_3","r16_4"] },
  { key: "quarterfinal", label: "Cuartos", dateLabels: ["qf_1","qf_2"] },
  { key: "semifinal", label: "Semis", dateLabels: ["sf_1"] },
  { key: "third_place", label: "3° Puesto", dateLabels: ["3rd_place"] },
  { key: "final", label: "Final", dateLabels: ["final"] },
];

function safeParseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = parseISO(val);
  return isValid(d) ? d : null;
}

function formatMatchDate(val: string | null | undefined): string {
  const d = safeParseDate(val);
  if (!d) return "—";
  return format(d, "EEE d MMM · HH:mm", { locale: es });
}

export function MatchesClient({ matches, userId, co2Usage, rioUsage, periods }: Props) {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<Record<string, { home: string; away: string; rioHome: string; rioAway: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [localMatches, setLocalMatches] = useState(matches);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmedDates, setConfirmedDates] = useState<Set<string>>(
    new Set(matches.filter(m => m.locked).map(m => m.date_label))
  );
  const [activeTab, setActiveTab] = useState(TAB_GROUPS[0].key);

const isClosed = (m: Match) => {
  const period = periods.find(p => p.date_label === m.date_label);
  console.log("isClosed", m.date_label, "period:", period, "result:", period ? !period.is_open : true);
  if (period) return !period.is_open;
  return true;
};

  const getInput = (m: Match) => inputs[m.id] ?? {
    home: m.home_score_pred?.toString() ?? "",
    away: m.away_score_pred?.toString() ?? "",
    rioHome: m.rio_home_pred?.toString() ?? "",
    rioAway: m.rio_away_pred?.toString() ?? "",
  };

  const isDateConfirmed = (dateLabel: string) => confirmedDates.has(dateLabel);
  const isMatchLocked = (m: Match) => m.locked || isDateConfirmed(m.date_label);

  const setInput = (id: string, key: string, val: string) => {
    const m = localMatches.find(x => x.id === id)!;
    if (isMatchLocked(m)) return;
    setInputs(p => ({ ...p, [id]: { ...getInput(m), [key]: val } }));
    setSaved(p => ({ ...p, [id]: false }));
  };

  const savePred = async (match: Match, isRio = false) => {
    if (isMatchLocked(match)) return;
    const inp = getInput(match);
    const home = isRio ? inp.rioHome : inp.home;
    const away = isRio ? inp.rioAway : inp.away;
    if (home === "" || away === "") return;
    const key = match.id + (isRio ? "_rio" : "");
    setSaving(s => ({ ...s, [key]: true }));
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homePred: parseInt(home), awayPred: parseInt(away), isRio }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(s => ({ ...s, [match.id]: true }));
      setLocalMatches(ms => ms.map(m => m.id === match.id ? {
        ...m,
        home_score_pred: isRio ? m.home_score_pred : parseInt(home),
        away_score_pred: isRio ? m.away_score_pred : parseInt(away),
        rio_home_pred: isRio ? parseInt(home) : m.rio_home_pred,
        rio_away_pred: isRio ? parseInt(away) : m.rio_away_pred,
      } : m));
    } catch (e: any) {
      toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const toggleComodin = async (match: Match, type: "CO2" | "RIO") => {
    if (isMatchLocked(match)) return;
    const isActive = type === "CO2" ? match.co2_used : match.rio_used;
    try {
      const res = await fetch("/api/comodin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, type, remove: isActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setLocalMatches(ms => ms.map(m => m.id === match.id ? {
        ...m,
        co2_used: type === "CO2" ? !isActive : m.co2_used,
        rio_used: type === "RIO" ? !isActive : m.rio_used,
      } : m));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const confirmDatePredictions = async (dateLabel: string, dateMatches: Match[]) => {
    const openMatches = dateMatches.filter(m => !isClosed(m) && m.home_score === null);
    const missingPreds = openMatches.filter(m => {
      const inp = getInput(m);
      return (m.home_score_pred === null && inp.home === "") || (m.away_score_pred === null && inp.away === "");
    });

    if (missingPreds.length > 0) {
      toast({
        title: "Faltan predicciones",
        description: `Completa todos los partidos antes de confirmar (faltan ${missingPreds.length})`,
        variant: "destructive"
      });
      return;
    }

    setConfirming(dateLabel);
    try {
      let locked = 0;
      for (const m of openMatches) {
        if (m.home_score_pred !== null || getInput(m).home !== "") {
          await fetch("/api/predictions/lock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matchId: m.id }),
          });
          locked++;
        }
      }
      setConfirmedDates(prev => new Set([...prev, dateLabel]));
      toast({ title: `✓ ${locked} apuestas confirmadas y bloqueadas` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setConfirming(null);
    }
  };

  const co2Used = (stage: string) => parseInt(co2Usage.find(u => u.stage === stage)?.cnt ?? "0");
  const rioUsed = (stage: string) => parseInt(rioUsage.find(u => u.stage === stage)?.cnt ?? "0");

  const activeGroup = TAB_GROUPS.find(g => g.key === activeTab)!;
  const displayMatches = localMatches.filter(m => activeGroup.dateLabels.includes(m.date_label));

  const grouped: Record<string, Match[]> = {};
  for (const m of displayMatches) {
    if (!grouped[m.date_label]) grouped[m.date_label] = [];
    grouped[m.date_label].push(m);
  }

  const visibleTabs = TAB_GROUPS.filter(g =>
    g.dateLabels.some(dl => localMatches.some(m => m.date_label === dl))
  );

  const pointsColor = (pts: number) => {
    if (pts === 3) return "bg-green-100 text-green-700";
    if (pts === 2) return "bg-blue-100 text-blue-700";
    if (pts === 1) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const predColor = (pts: number | null) => {
    if (pts === 3) return "text-green-600";
    if (pts === 2) return "text-blue-600";
    if (pts === 1) return "text-yellow-600";
    if (pts === 0) return "text-red-500";
    return "text-gray-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {visibleTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comodines disponibles</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(CO2_LIMITS).map(([stage, limit]) => {
            const rem = limit - co2Used(stage);
            return <span key={stage} className={`text-xs font-medium ${rem > 0 ? "text-orange-600" : "text-gray-300"}`}>
              CO2 {stage === "group" ? "Grupos" : stage === "round_of_32" ? "R32" : "R16"}: {rem}/{limit}
            </span>;
          })}
          {Object.entries(RIO_LIMITS).map(([stage, limit]) => {
            const rem = limit - rioUsed(stage);
            return <span key={stage} className={`text-xs font-medium ${rem > 0 ? "text-blue-600" : "text-gray-300"}`}>
              RIO {stage === "group" ? "Grupos" : stage === "round_of_32" ? "R32" : "QF"}: {rem}/{limit}
            </span>;
          })}
        </div>
      </div>

      {Object.entries(grouped).map(([dateLabel, dateMatches]) => {
        const allClosed = dateMatches.every(m => isClosed(m));
        const dateConfirmed = isDateConfirmed(dateLabel);
        const openMatches = dateMatches.filter(m => !isClosed(m) && m.home_score === null);
        const allHavePreds = openMatches.every(m => {
          const inp = getInput(m);
          return m.home_score_pred !== null || (inp.home !== "" && inp.away !== "");
        });

        return (
          <div key={dateLabel} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {dateLabel.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </h2>
              {dateConfirmed ? (
                <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" /> Apuestas confirmadas
                </span>
              ) : allClosed ? (
                <span className="text-xs text-gray-300 flex items-center gap-1"><Lock className="w-3 h-3" /> Cerrada</span>
              ) : openMatches.length > 0 ? (
                <button onClick={() => confirmDatePredictions(dateLabel, dateMatches)}
                  disabled={confirming === dateLabel}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 transition-colors ${
                    allHavePreds
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}>
                  {confirming === dateLabel ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                  Confirmar apuestas
                </button>
              ) : null}
            </div>

            {!allHavePreds && !dateConfirmed && !allClosed && openMatches.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Completa todos los partidos para poder confirmar ({openMatches.filter(m => {
                  const inp = getInput(m);
                  return m.home_score_pred === null && (inp.home === "" || inp.away === "");
                }).length} sin prediccion)
              </div>
            )}

            {dateMatches.map(match => {
              const closed = isClosed(match);
              const locked = isMatchLocked(match);
              const inp = getInput(match);
              const isSavingMain = saving[match.id];
              const hasPred = match.home_score_pred !== null;

              return (
                <div key={match.id} className={`bg-white rounded-xl border p-4 transition-all ${
                  locked && !closed ? "border-green-200 bg-green-50/20" :
                  match.co2_used ? "border-orange-200" :
                  match.rio_used ? "border-blue-200" : "border-gray-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-400">
                        {formatMatchDate(match.match_date)}
                        {match.group_name && <span className="ml-1.5 text-gray-500">· Grupo {match.group_name}</span>}
                      </span>
                      {(match.venue || match.city) && (
                        <p className="text-xs text-gray-300 mt-0.5">📍 {[match.venue, match.city].filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {locked && !closed && <Lock className="w-3 h-3 text-green-500" />}
                      {closed && <Lock className="w-3 h-3 text-gray-300" />}
                      {match.points !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pointsColor(match.points)}`}>
                          {match.points} pts
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-right font-semibold text-sm text-gray-900">{match.home_team}</span>
                    <div className="flex items-center gap-1">
                      {match.home_score !== null ? (
  <div className="flex flex-col items-center px-2">
    {match.home_score_pred !== null ? (
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${predColor(match.points)}`}>
          {match.home_score_pred} - {match.away_score_pred}
        </span>
        {match.rio_used && match.rio_home_pred !== null && (
          <span className="text-sm text-blue-500 font-medium">
            ({match.rio_home_pred}-{match.rio_away_pred})
          </span>
        )}
      </div>
    ) : (
      <span className="text-lg font-bold text-gray-300">—</span>
    )}
    <span className="text-xs text-gray-400">{match.home_score} - {match.away_score}</span>
  </div>
                      ) : (
                        <>
                          <input type="number" min="0" max="99"
                            disabled={closed || locked}
                            value={inp.home}
                            onChange={e => setInput(match.id, "home", e.target.value)}
                            onBlur={() => savePred(match)}
                            className={`w-11 text-center border-2 rounded-lg py-1.5 text-base font-bold focus:outline-none transition-colors disabled:text-gray-400 ${
                              locked ? "border-green-300 bg-green-50 disabled:bg-green-50" :
                              saved[match.id] ? "border-green-400 bg-green-50" :
                              "border-gray-200 focus:border-primary disabled:bg-gray-50"
                            }`} />
                          <span className="text-gray-400 font-bold">-</span>
                          <input type="number" min="0" max="99"
                            disabled={closed || locked}
                            value={inp.away}
                            onChange={e => setInput(match.id, "away", e.target.value)}
                            onBlur={() => savePred(match)}
                            className={`w-11 text-center border-2 rounded-lg py-1.5 text-base font-bold focus:outline-none transition-colors disabled:text-gray-400 ${
                              locked ? "border-green-300 bg-green-50 disabled:bg-green-50" :
                              saved[match.id] ? "border-green-400 bg-green-50" :
                              "border-gray-200 focus:border-primary disabled:bg-gray-50"
                            }`} />
                        </>
                      )}
                    </div>
                    <span className="flex-1 font-semibold text-sm text-gray-900">{match.away_team}</span>
                  </div>

                  {!closed && match.home_score === null && (
                    <div className="flex justify-center mt-1.5 h-4">
                      {isSavingMain ? (
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Guardando...</span>
                      ) : locked ? (
                        <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Bloqueado: {match.home_score_pred} - {match.away_score_pred}</span>
                      ) : hasPred ? (
                        <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Guardado: {match.home_score_pred} - {match.away_score_pred}</span>
                      ) : (
                        <span className="text-xs text-gray-300">Sin prediccion</span>
                      )}
                    </div>
                  )}

                  {!closed && !locked && match.home_score === null && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button onClick={() => toggleComodin(match, "CO2")}
                        disabled={!match.co2_used && co2Used(match.stage) >= (CO2_LIMITS[match.stage] ?? 0)}
                        className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-all disabled:opacity-40 ${
                          match.co2_used ? "bg-orange-500 text-white border-orange-500" : "border-orange-200 text-orange-600 hover:bg-orange-50"
                        }`}>
                        {match.co2_used ? "✓ CO2 x2" : "CO2 doblar"}
                      </button>
                      <button onClick={() => toggleComodin(match, "RIO")}
                        disabled={!match.rio_used && rioUsed(match.stage) >= (RIO_LIMITS[match.stage] ?? 0)}
                        className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-all disabled:opacity-40 ${
                          match.rio_used ? "bg-blue-500 text-white border-blue-500" : "border-blue-200 text-blue-600 hover:bg-blue-50"
                        }`}>
                        {match.rio_used ? "✓ RIO" : "RIO 2da pred."}
                      </button>
                    </div>
                  )}

                  {match.rio_used && !closed && !locked && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-semibold mb-2">RIO — segunda prediccion</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 flex-1 text-right">{match.home_team}</span>
                        <input type="number" min="0" max="99" value={inp.rioHome}
                          onChange={e => setInput(match.id, "rioHome", e.target.value)}
                          onBlur={() => savePred(match, true)}
                          className="w-11 text-center border-2 border-blue-200 rounded-lg py-1 text-sm font-bold focus:border-blue-500 focus:outline-none" />
                        <span className="text-gray-400">-</span>
                        <input type="number" min="0" max="99" value={inp.rioAway}
                          onChange={e => setInput(match.id, "rioAway", e.target.value)}
                          onBlur={() => savePred(match, true)}
                          className="w-11 text-center border-2 border-blue-200 rounded-lg py-1 text-sm font-bold focus:border-blue-500 focus:outline-none" />
                        <span className="text-xs text-gray-500 flex-1">{match.away_team}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}