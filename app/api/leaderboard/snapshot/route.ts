import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  const rows = await query(`
    SELECT
      u.id AS user_id,
      u.display_name,
      ls.total_points,
      COALESCE(sb_pts.special_points, 0) AS special_points,
      COUNT(p.id) FILTER (WHERE p.points IS NOT NULL AND m.match_date::date <= $1::date) AS matches_predicted,
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL AND m.match_date::date <= $1::date AND (
          CASE WHEN cu.match_id IS NOT NULL THEN p.points / 2 ELSE p.points END
        ) = 3
      ) AS exact_results,
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL AND m.match_date::date <= $1::date AND (
          CASE WHEN cu.match_id IS NOT NULL THEN p.points / 2 ELSE p.points END
        ) = 2
      ) AS diff_results,
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL AND m.match_date::date <= $1::date AND (
          CASE WHEN cu.match_id IS NOT NULL THEN p.points / 2 ELSE p.points END
        ) = 1
      ) AS simple_results,
      COALESCE(SUM(
        CASE WHEN cu.match_id IS NOT NULL AND p.points IS NOT NULL AND m.match_date::date <= $1::date
        THEN p.points - (p.points / 2) ELSE 0 END
      ), 0) AS co2_points
    FROM leaderboard_snapshots ls
    JOIN users u ON u.id = ls.user_id
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN matches m ON m.id = p.match_id
    LEFT JOIN comodin_usage cu ON cu.user_id = u.id AND cu.match_id = p.match_id AND cu.comodin_type = 'CO2'
    LEFT JOIN (
      SELECT user_id,
        COALESCE(champion_points,0) + COALESCE(scorer_points,0) + COALESCE(lago_bonus,0) + COALESCE(water_points,0) AS special_points
      FROM special_bets
    ) sb_pts ON sb_pts.user_id = u.id
    WHERE ls.snapshot_date = $1 AND u.is_admin = FALSE
    GROUP BY u.id, u.display_name, ls.total_points, ls.rank, sb_pts.special_points
    ORDER BY ls.rank ASC, ls.total_points DESC
  `, [date]);

  const serialized = rows.map((r: any) => ({
    ...r,
    total_points: Number(r.total_points),
    special_points: Number(r.special_points),
    matches_predicted: Number(r.matches_predicted),
    exact_results: Number(r.exact_results),
    diff_results: Number(r.diff_results),
    simple_results: Number(r.simple_results),
    co2_points: Number(r.co2_points),
  }));

  return NextResponse.json({ rows: serialized });
}