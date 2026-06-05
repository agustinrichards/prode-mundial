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
    SELECT lc.user_id, u.display_name, lc.total_points, lc.special_points,
           lc.matches_predicted, lc.correct_results, lc.updated_at
    FROM leaderboard_cache lc
    JOIN users u ON u.id=lc.user_id
    ORDER BY lc.total_points DESC, lc.correct_results DESC, u.display_name ASC
  `);

  const snapshots = await query(`
    SELECT DISTINCT snapshot_date FROM leaderboard_snapshots
    ORDER BY snapshot_date ASC
  `);

  const serializedRows = rows.map((r: any) => ({
    ...r,
    updated_at: serializeDate(r.updated_at),
  }));

  const serializedSnapshots = snapshots.map((s: any) => ({
    ...s,
    snapshot_date: serializeDate(s.snapshot_date),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display">TABLA DE POSICIONES</h1>
        <p className="text-muted-foreground mt-1">Se actualiza automáticamente</p>
      </div>
      <LeaderboardClient rows={serializedRows} currentUserId={currentUserId} snapshots={serializedSnapshots} />
    </div>
  );
}