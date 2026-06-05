"use client";

import { useState } from "react";
import { format, isBefore, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Lock } from "lucide-react";

interface MyPred {
  match_id: string;
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
  locked: boolean;
  co2: boolean;
  rio: boolean;
  rio_home: number | null;
  rio_away: number | null;
}

interface OtherPred {
  match_id: string;
  display_name: string;
  user_id: string;
  home_score_pred: number | null;
  away_score_pred: number | null;
  points: number | null;
  co2: boolean;
  rio: boolean;
}

interface SpecialBet {
  user_id: string;
  display_name: string;
  champion_team: string | null;
  top_scorer_name: string | null;
  lago_day: string | null;
  water_installations: number | null;
  champion_points: number;
  scorer_points: number;
  lago_bonus: number;
  water_points: number;
}

interface Props {
  myPredictions: MyPred[];
  allPredictions: OtherPred[];
  specialBets: SpecialBet[];
  users: { id: string; display_name: string }[];
  userId: string;
}

const DATE_GROUPS = [
  { key: "fecha_1", label: "Fecha 1", dateLabels: ["fecha_1"] },
  { key: "fecha_2", label: "Fecha 2", dateLabels: ["fecha_2"] },
  { key: "fecha_3", label: "Fecha 3", dateLabels: ["fecha_3"] },
  { key: "round_of_32", label: "Ronda 32", dateLabels: ["r32_1","r32_2","r32_3","r32_4"] },
  { key: "round_of_16", label: "Octavos", dateLabels: ["r16_1","r16_2","r16_3","r16_4"] },
  { key: "quarterfinal", label: "Cuartos", dateLabels: ["qf_1","qf_2"] },
  { key: "semifinal", label: "Semis", dateLabels: ["sf_1"] },
  { key: "third_place", label: "3° Puesto", dateLabels: ["3rd_place"] },
  { key: "final", label: "Final", dateLabels: ["final"] },
  { key: "especiales", label: "Especiales", dateLabels: [] },
  { key: "totales", label: "Totales", dateLabels: [] },
];

const ptBadge = (pts: number | null) => {
  if (pts === null || pts === undefined) return "bg-gray-100 text-gray-400";
  if (pts === 3) return "bg-green-100 text-green-700";
  if (pts === 2) return "bg-blue-100 text-blue-700";
  if (pts === 1) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

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

export function MisApuestasClient({ myPredictions, allPredictions, specialBets, users, userId }: Props) {
  const [selectedUser, setSelectedUser] = useState<string>(userId);
  const [activeTab, setActiveTab] = useState("fecha_1");

  const now = new Date();
  const isClosed = (closeAt: string | null | undefined) => {
    const d = safeParseDate(closeAt);
    return d ? isBefore(d, now) : false;
  };

  const allByMatchUser: Record<string, Record<string, OtherPred>> = {};
  for (const p of allPredictions) {
    if (!allByMatchUser[p.match_id]) allByMatchUser[p.match_id] = {};
    allByMatchUser[p.match_id][p.user_id] = p;
  }

  const myByMatch: Record<string, MyPred> = {};
  for (const p of myPredictions) myByMatch[p.match_id] = p;

  const specialByUser: Record<string, SpecialBet> = {};
  for (const b of specialBets) specialByUser[b.user_id] = b;

const getPredForUser = (matchId: string, uid: string) => {
  const match = myByMatch[matchId];
  if (!match) return null;
  if (uid === userId) return match;
  return allByMatchUser[matchId]?.[uid] ?? null;
};

  const getDateGroupPoints = (uid: string, dateLabels: string[]) => {
    const preds = myPredictions.filter(m => dateLabels.includes(m.date_label));
    let total = 0;
    for (const m of preds) {
      const pred = uid === userId ? m : allByMatchUser[m.match_id]?.[uid];
      if (pred?.points) total += pred.points;
    }
    return total;
  };

  const getSpecialPoints = (uid: string) => {
    const b = specialByUser[uid];
    if (!b) return 0;
    return (b.champion_points ?? 0) + (b.scorer_points ?? 0) + (b.lago_bonus ?? 0) + (b.water_points ?? 0);
  };

  const getTotalPoints = (uid: string) => {
    const matchPts = myPredictions.reduce((sum, m) => {
      const pred = uid === userId ? m : allByMatchUser[m.match_id]?.[uid];
      return sum + (pred?.points ?? 0);
    }, 0);
    return matchPts + getSpecialPoints(uid);
  };

  const activeGroup = DATE_GROUPS.find(g => g.key === activeTab)!;
  const tabMatches = myPredictions.filter(m => activeGroup.dateLabels.includes(m.date_label));

  const visibleTabs = DATE_GROUPS.filter(g =>
    g.key === "especiales" || g.key === "totales" ||
    g.dateLabels.some(dl => myPredictions.some(m => m.date_label === dl))
  );

  const fecha1Closed = myPredictions.some(m => m.date_label === "fecha_1" && isClosed(m.predictions_close_at));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Jugadores</p>
        <div className="flex flex-wrap gap-2">
          {users.map(u => (
            <button key={u.id} onClick={() => setSelectedUser(u.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedUser === u.id ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {u.display_name}
              {u.id === userId && <span className="ml-1 text-xs opacity-70">(vos)</span>}
            </button>
          ))}
        </div>
      </div>

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

      {activeTab === "totales" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jugador</th>
                {visibleTabs.filter(t => t.key !== "totales" && t.key !== "especiales").map(t => (
                  <th key={t.key} className="text-right px-3 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">{t.label}</th>
                ))}
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500">Espec.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={`border-t border-gray-50 ${u.id === userId ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.display_name}
                    {u.id === userId && <span className="text-xs text-primary ml-1">(vos)</span>}
                  </td>
                  {visibleTabs.filter(t => t.key !== "totales" && t.key !== "especiales").map(t => (
                    <td key={t.key} className="px-3 py-3 text-right text-gray-600 hidden sm:table-cell">
                      {getDateGroupPoints(u.id, t.dateLabels)}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right text-gray-600">{getSpecialPoints(u.id)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{getTotalPoints(u.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "especiales" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Jugador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Campeon</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Goleador</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">LAGO</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Agua</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const b = specialByUser[u.id];
                const isMe = u.id === userId;
                if (!isMe && !fecha1Closed) return null;
                return (
                  <tr key={u.id} className={`border-t border-gray-50 ${isMe ? "bg-primary/5" : ""}`}>
                    <td className="px-4 py-3 font-medium">{u.display_name}{isMe && <span className="text-xs text-primary ml-1">(vos)</span>}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{b?.champion_team ?? <span className="text-gray-300">-</span>}</span>
                      {(b?.champion_points ?? 0) > 0 && <span className="ml-1.5 text-xs font-bold text-green-600">+{b.champion_points}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{b?.top_scorer_name ?? <span className="text-gray-300">-</span>}</span>
                      {(b?.scorer_points ?? 0) > 0 && <span className="ml-1.5 text-xs font-bold text-green-600">+{b.scorer_points}</span>}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {b?.lago_day ? (() => {
                        const d = safeParseDate(b.lago_day);
                        return d ? <span className="text-gray-700">{format(d, "d MMM", { locale: es })}</span> : <span className="text-gray-300">-</span>;
                      })() : <span className="text-gray-300">-</span>}
                      {(b?.lago_bonus ?? 0) > 0 && <span className="ml-1.5 text-xs font-bold text-green-600">+{b.lago_bonus}</span>}
                    </td>
                    <td className="px-3 py-3 text-right hidden md:table-cell">
                      <span className="text-gray-700">{b?.water_installations?.toLocaleString() ?? <span className="text-gray-300">-</span>}</span>
                      {(b?.water_points ?? 0) > 0 && <span className="ml-1.5 text-xs font-bold text-green-600">+{b.water_points}</span>}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-2 text-xs font-semibold text-gray-500">TOTAL ESPECIALES</td>
                <td className="px-4 py-2 text-right text-xs font-bold text-gray-700" colSpan={4}>
                  {users.map(u => `${u.display_name}: ${getSpecialPoints(u.id)}`).join(" · ")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab !== "totales" && activeTab !== "especiales" && (
        <div className="space-y-2">
          {activeGroup.dateLabels.length > 0 && (
            <div className="flex justify-end">
              <span className="text-xs text-gray-500">
                {users.find(u => u.id === selectedUser)?.display_name}: <strong className="text-gray-900">{getDateGroupPoints(selectedUser, activeGroup.dateLabels)} pts</strong> en esta etapa
              </span>
            </div>
          )}

          {tabMatches.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No hay partidos en esta etapa todavia.</p>
          )}

          {tabMatches.map(match => {
            const closed = isClosed(match.predictions_close_at);
            const pred = getPredForUser(match.match_id, selectedUser);
            const isMe = selectedUser === userId;
            const pts = (pred as any)?.points ?? null;
console.log("match", match.match_id, "user", selectedUser, "pred", pred);

            return (
              <div key={match.match_id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-gray-400">
                      {formatMatchDate(match.match_date)}
                      {match.group_name && <span className="ml-1.5">· Grupo {match.group_name}</span>}
                    </span>
                    {(match.venue || match.city) && (
                      <p className="text-xs text-gray-300 mt-0.5">📍 {[match.venue, match.city].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {closed && <Lock className="w-3 h-3 text-gray-300" />}
                    {pts !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ptBadge(pts)}`}>{pts} pts</span>
                    )}
                  </div>
                </div>

             {match.home_score !== null && (
  <div className="flex justify-center gap-8 mb-1">
<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Apuesta</span>
<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resultado</span>
  </div>
)}

<div className="flex items-center gap-3">
  <span className="flex-1 text-right font-semibold text-sm">{match.home_team}</span>
  <div className="text-center min-w-[120px]">
    {match.home_score !== null ? (
      <div className="flex items-center justify-center gap-4">
       {pred?.home_score_pred !== null && pred?.home_score_pred !== undefined ? (
  <span className={`text-sm font-bold ${
    (pred as any).points === 3 ? "text-green-600" :
    (pred as any).points === 2 ? "text-blue-600" :
    (pred as any).points === 1 ? "text-yellow-600" :
    (pred as any).points === 0 ? "text-red-500" : "text-gray-400"
  }`}>{pred.home_score_pred} - {pred.away_score_pred}</span>
) : (
  <span className="text-sm text-gray-300">—</span>
)}
<span className="text-sm font-bold text-primary">{match.home_score} - {match.away_score}</span>            (pred as any).points === 3 ? "text-green-600" :
            (pred as any).points === 2 ? "text-blue-600" :
            (pred as any).points === 1 ? "text-yellow-600" :
            (pred as any).points === 0 ? "text-red-500" : "text-gray-400"
          }`}>{pred.home_score_pred} - {pred.away_score_pred}</span>
        ) : (
          <span className="text-sm text-gray-300">—</span>
        )}
      </div>
    ) : pred?.home_score_pred !== null && pred?.home_score_pred !== undefined ? (
      <span className={`text-sm font-bold px-3 py-1 rounded-lg ${isMe ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-700"}`}>
        {pred.home_score_pred} - {pred.away_score_pred}
      </span>
    ) : (
      <span className="text-xs text-gray-300">{!isMe && !closed ? "🔒" : "—"}</span>
    )}
  </div>
  <span className="flex-1 font-semibold text-sm">{match.away_team}</span>
</div>

{pred && ((pred as any).co2 || (pred as any).rio) && (
  <div className="flex gap-2 mt-2 justify-center flex-wrap">
    {(pred as any).co2 && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">CO2 x2</span>}
    {(pred as any).rio && (
      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
        RIO{(pred as any).rio_home !== null && (pred as any).rio_away !== null
          ? ` · ${(pred as any).rio_home}-${(pred as any).rio_away}`
          : ""}
      </span>
    )}
  </div>
)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}