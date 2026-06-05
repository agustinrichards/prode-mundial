import { requireAdmin } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { serializeDates } from "@/lib/serialize";

const DATE_LABELS = [
  { key: "fecha_1", label: "Fecha 1", matchField: "date_label" },
  { key: "fecha_2", label: "Fecha 2", matchField: "date_label" },
  { key: "fecha_3", label: "Fecha 3", matchField: "date_label" },
  { key: "round_of_32", label: "Ronda de 32", matchField: "stage" },
  { key: "round_of_16", label: "Octavos", matchField: "stage" },
  { key: "quarterfinal", label: "Cuartos", matchField: "stage" },
  { key: "semifinal", label: "Semis", matchField: "stage" },
  { key: "third_place", label: "3er Puesto", matchField: "stage" },
  { key: "final", label: "Final", matchField: "stage" },
  { key: "especiales", label: "Especiales", matchField: "special" },
];

export default async function AdminDashboardPage() {
  await requireAdmin();

  const users = await query(
    "SELECT id, display_name, email FROM users WHERE is_admin=FALSE ORDER BY display_name ASC"
  );
  const periodsRaw = await query("SELECT * FROM betting_periods ORDER BY date_label ASC");
  const periods = serializeDates(periodsRaw, ["created_at", "updated_at", "opens_at", "closes_at"]);

  const predByDateLabel = await query(`
    SELECT p.user_id, m.date_label, COUNT(*) AS count,
      COUNT(*) FILTER (WHERE p.locked = TRUE) AS locked_count
    FROM matches m
    LEFT JOIN predictions p ON p.match_id = m.id
    WHERE m.is_visible = TRUE AND p.user_id IS NOT NULL
    GROUP BY p.user_id, m.date_label
  `);

  const predByStage = await query(`
    SELECT p.user_id, m.stage, COUNT(*) AS count,
      COUNT(*) FILTER (WHERE p.locked = TRUE) AS locked_count
    FROM matches m
    LEFT JOIN predictions p ON p.match_id = m.id
    WHERE m.is_visible = TRUE AND p.user_id IS NOT NULL
    GROUP BY p.user_id, m.stage
  `);

  const matchCountsByLabel = await query(`
    SELECT date_label, COUNT(*) AS total
    FROM matches WHERE is_visible = TRUE
    GROUP BY date_label
  `);

  const matchCountsByStage = await query(`
    SELECT stage, COUNT(*) AS total
    FROM matches WHERE is_visible = TRUE
    GROUP BY stage
  `);

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
        predByDateLabel={predByDateLabel}
        predByStage={predByStage}
        matchCountsByLabel={matchCountsByLabel}
        matchCountsByStage={matchCountsByStage}
        specialBets={specialBets}
        dateLabels={DATE_LABELS}
      />
    </div>
  );
}