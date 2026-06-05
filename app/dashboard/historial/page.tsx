import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { serializeDates } from "@/lib/serialize";

export default async function HistorialPage() {
  const session = await requireAuth();
  const userId = (session.user as any).id;

  const predictions = await query(`
    SELECT
      p.*,
      m.home_team, m.away_team, m.match_date,
      m.home_score, m.away_score, m.group_name, m.stage,
      (SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=m.id AND comodin_type='CO2') AS co2,
      (SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=m.id AND comodin_type='RIO') AS rio
    FROM predictions p
    JOIN matches m ON m.id = p.match_id
    WHERE p.user_id = $1
    ORDER BY m.match_date DESC
  `, [userId]);

  const serialized = serializeDates(predictions, ["match_date"]);
  const total = serialized.reduce((s: number, p: any) => s + (p.points ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display">MI HISTORIAL</h1>
        <p className="text-muted-foreground mt-1">
          {serialized.length} predicciones · <strong>{total} puntos</strong>
        </p>
      </div>
      <div className="space-y-2">
        {serialized.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl border px-4 py-3 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">{p.home_team} vs {p.away_team}</span>
              <div className="text-xs text-gray-400 mt-0.5">
                Tu prediccion: <strong>{p.home_score_pred} - {p.away_score_pred}</strong>
                {p.home_score !== null && <> · Resultado: <strong>{p.home_score} - {p.away_score}</strong></>}
                {p.co2 && <span className="ml-2 text-orange-500 font-medium">CO2</span>}
                {p.rio && <span className="ml-2 text-blue-500 font-medium">RIO</span>}
              </div>
            </div>
            {p.points !== null ? (
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                p.points === 3 ? "bg-green-100 text-green-700" :
                p.points === 2 ? "bg-blue-100 text-blue-700" :
                p.points === 1 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>{p.points} pts</span>
            ) : (
              <span className="text-xs text-gray-300">Pendiente</span>
            )}
          </div>
        ))}
        {serialized.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Todavia no hiciste ninguna prediccion.</p>
        )}
      </div>
    </div>
  );
}