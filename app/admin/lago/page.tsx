import { requireAdmin } from "@/lib/auth/session";
import { query } from "@/lib/db";

export default async function AdminLagoPage() {
  await requireAdmin();

  const rows = await query(`
    SELECT u.display_name,
           (ds.match_date AT TIME ZONE 'America/New_York')::date AS dia,
           ds.points
    FROM daily_scores ds
    JOIN users u ON u.id = ds.user_id
    WHERE u.is_admin = FALSE
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
        <h1 className="text-4xl font-display">PUNTOS POR DÍA</h1>
        <p className="text-muted-foreground mt-1">Base para el comodín LAGO — máximo del día en negrita</p>
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
              <td className="px-4 py-2 font-semibold text-gray-500 text-xs uppercase">Máx día</td>
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