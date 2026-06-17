import { requireAuth } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";

export const revalidate = 30;

function serializeDate(val: any): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

export default async function LeaderboardPage() {
  const session = await requireAuth();
  const currentUserId = (session.user as any).id;

  const rows = await query(`
    SELECT
      u.id AS user_id,
      u.display_name,
      COALESCE(lc.total_points, 0) AS total_points,
      COALESCE(sb_pts.special_points, 0) AS special_points,
      COUNT(p.id) FILTER (WHERE p.points IS NOT NULL) AS matches_predicted,
      -- Aciertos exactos: 3 pts base (con o sin CO2)
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL AND (
          CASE WHEN cu.match_id IS NOT NULL THEN p.points / 2 ELSE p.points END
        ) = 3
      ) AS exact_results,
      -- Aciertos dif gol: 2 pts base
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL AND (
          CASE WHEN cu.match_id IS NOT NULL THEN p.points / 2 ELSE p.points END
        ) = 2
      ) AS diff_results,
      -- Aciertos simples: 1 pt base
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL AND (
          CASE WHEN cu.match_id IS NOT NULL THEN p.points / 2 ELSE p.points END
        ) = 1
      ) AS simple_results,
      -- Puntos CO2: suma de bonus (pts - pts_base)
      COALESCE(SUM(
        CASE WHEN cu.match_id IS NOT NULL AND p.points IS NOT NULL
        THEN p.points - (p.points / 2) ELSE 0 END
      ), 0) AS co2_points
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN comodin_usage cu ON cu.user_id = u.id AND cu.match_id = p.match_id AND cu.comodin_type = 'CO2'
    LEFT JOIN leaderboard_cache lc ON lc.user_id = u.id
    LEFT JOIN (
      SELECT user_id,
        COALESCE(champion_points,0) + COALESCE(scorer_points,0) + COALESCE(lago_bonus,0) + COALESCE(water_points,0) AS special_points
      FROM special_bets
    ) sb_pts ON sb_pts.user_id = u.id
    WHERE u.is_admin = FALSE
    GROUP BY u.id, u.display_name, lc.total_points, sb_pts.special_points
    ORDER BY total_points DESC, exact_results DESC, u.display_name ASC
  `);

const snapshots = await query(`
    SELECT DISTINCT (match_date AT TIME ZONE 'America/New_York')::date AS snapshot_date
    FROM matches
    WHERE home_score IS NOT NULL
    ORDER BY snapshot_date ASC
  `);

  const serializedRows = rows.map((r: any) => ({
    ...r,
    total_points: Number(r.total_points),
    special_points: Number(r.special_points),
    matches_predicted: Number(r.matches_predicted),
    exact_results: Number(r.exact_results),
    diff_results: Number(r.diff_results),
    simple_results: Number(r.simple_results),
    co2_points: Number(r.co2_points),
  }));

  const serializedSnapshots = snapshots.map((s: any) => ({
    ...s,
    snapshot_date: serializeDate(s.snapshot_date),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display">TABLA DE POSICIONES</h1>
        <p className="text-muted-foreground mt-1">Se actualiza automaticamente</p>
      </div>
      <LeaderboardClient rows={serializedRows} currentUserId={currentUserId} snapshots={serializedSnapshots} />
    </div>
  );
}