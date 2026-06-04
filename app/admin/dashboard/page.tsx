import { requireAdmin } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

const DATE_LABELS = [
  { key: "fecha_1", label: "Fecha 1" },
  { key: "fecha_2", label: "Fecha 2" },
  { key: "fecha_3", label: "Fecha 3" },
  { key: "r32_1", label: "Ronda de 32" },
  { key: "r16_1", label: "Octavos de Final" },
  { key: "qf_1", label: "Cuartos de Final" },
  { key: "sf_1", label: "Semifinales" },
  { key: "3rd_place", label: "3er Puesto" },
  { key: "final", label: "Final" },
  { key: "especiales", label: "Especiales" },
];

export default async function AdminDashboardPage() {
  await requireAdmin();

  const users = await query(
    "SELECT id, display_name, email FROM users WHERE is_admin=FALSE ORDER BY display_name ASC"
  );

  const periods = await query("SELECT * FROM betting_periods ORDER BY date_label ASC");

  // For each user and date_label, check if they have predictions
  const predictionStatus = await query(`
    SELECT 
      p.user_id,
      m.date_label,
      COUNT(*) AS count,
      COUNT(*) FILTER (WHERE p.locked = TRUE) AS locked_count,
      COUNT(m2.id) AS total_matches
    FROM matches m
    LEFT JOIN predictions p ON p.match_id = m.id
    LEFT JOIN matches m2 ON m2.date_label = m.date_label AND m2.is_visible = TRUE
    WHERE m.is_visible = TRUE AND p.user_id IS NOT NULL
    GROUP BY p.user_id, m.date_label
  `);

  // Total matches per date_label
  const matchCounts = await query(`
    SELECT date_label, COUNT(*) AS total
    FROM matches WHERE is_visible = TRUE
    GROUP BY date_label
  `);

  // Special bets status
  const specialBets = await query(`
    SELECT user_id,
      champion_team IS NOT NULL AS has_champion,
      top_scorer_name IS NOT NULL AS has_scorer,
      lago_day IS NOT NULL AS has_lago,
      water_installations IS NOT NULL AS has_water
    FROM special_bets
  `);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Estado de apuestas por jugador y fecha</p>
      </div>
      <AdminDashboardClient
        users={users}
        periods={periods}
        predictionStatus={predictionStatus}
        matchCounts={matchCounts}
        specialBets={specialBets}
        dateLabels={DATE_LABELS}
      />
    </div>
  );
}
