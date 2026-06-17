import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db";

export default async function DashboardLagoPage() {
  await requireAuth();

  const rows = await query(`
    SELECT u.display_name,
           (m.match_date AT TIME ZONE 'America/New_York')::date AS dia,
           COALESCE(SUM(p.points), 0) AS points
    FROM users u
    JOIN predictions p ON p.user_id = u.id
    JOIN matches m ON m.id = p.match_id
    WHERE u.is_admin = FALSE
    AND m.home_score IS NOT NULL
    AND p.points IS NOT NULL
    GROUP BY u.display_name, (m.match_date AT TIME ZONE 'America/New_York')::date
    ORDER BY dia ASC, u.display_name ASC
  `);

  const users = [...new Set(rows.map((r: any) => r.display_name))].sort();
  const days = [...new Set(rows.map((r: any) => {
    const d = r.dia instanceof Date ? r.dia.toISOString().substring(0, 10) : String(r.dia).substring(0, 10);
    return d;
  }))].sort();

  const matrix: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    const user = row.display_name;
    const day = row.dia instanceof Date ? row.dia.toISOString().substring(0, 10) : String(row.dia).substring(0, 10);
    if (!matrix[user]) matrix[user] = {};
    matrix[user][day] = Number(row.points);
  }

  const dayTotals: Record<string, number> = {};
  for (const day of days) {
    dayTotals[day] = Math.max(...users.map(u => matrix[u]?.[day] ?? 0));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display">PUNTOS POR DIA</h1>
        <p className="text-muted-foreground mt-1">Maximo del dia en negrita — base para el comodin LAGO</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="text-sm w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 sticky left-0 bg-gray-50">Jugador</th>
              {days.map(d => (
                <th key={d} className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                  {(() => { const p = d.split('-'); return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2])).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }); })()}
                </th>
              ))}
              <th className="text-right px-4 py-3 font-semibold text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const total = Object.values(matrix[user] ?? {}).reduce((a, b) => a + b, 0);
              return (
                <tr key={user} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white">{user}</td>
                  {days.map(d => {
                    const pts = matrix[user]?.[d] ?? 0;
                    const isMax = pts === dayTotals[d] && pts > 0;
                    return (
                      <td key={d} className={`px-3 py-2 text-right ${isMax ? 'font-bold text-primary' : 'text-gray-600'}`}>
                        {pts > 0 ? pts : '-'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right font-bold text-gray-900">{total}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-2 font-semibold text-gray-500 text-xs uppercase">Max dia</td>
              {days.map(d => (
                <td key={d} className="px-3 py-2 text-right font-bold text-primary text-xs">{dayTotals[d] ?? 0}</td>
              ))}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}