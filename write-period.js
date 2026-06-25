const fs = require('fs');
const dir = 'app/api/leaderboard/period';
fs.mkdirSync(dir, { recursive: true });

const content = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

const PERIODS: Record<string, { start: string; end: string }> = {
  fecha_1: { start: "2026-06-11", end: "2026-06-17" },
  fecha_2: { start: "2026-06-18", end: "2026-06-23" },
  fecha_3: { start: "2026-06-24", end: "2026-06-27" },
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const periodKey = req.nextUrl.searchParams.get("period");
  const period = periodKey ? PERIODS[periodKey] : null;
  if (!period) return NextResponse.json({ error: "Invalid period" }, { status: 400 });

  const rows = await query(\`
    SELECT
      u.id AS user_id,
      u.display_name,
      COALESCE(SUM(p.points) FILTER (
        WHERE p.points IS NOT NULL
        AND (m.match_date AT TIME ZONE 'America/New_York')::date BETWEEN $1::date AND $2::date
      ), 0) AS match_points,
      COALESCE((
        SELECT COALESCE(champion_points,0) + COALESCE(scorer_points,0) + COALESCE(water_points,0)
        + CASE WHEN lago_day BETWEEN $1::date AND $2::date THEN COALESCE(lago_bonus,0) ELSE 0 END
        FROM special_bets sb WHERE sb.user_id = u.id
      ), 0) AS special_points,
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL
        AND (m.match_date AT TIME ZONE 'America/New_York')::date BETWEEN $1::date AND $2::date
      ) AS matches_predicted,
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL
        AND (m.match_date AT TIME ZONE 'America/New_York')::date BETWEEN $1::date AND $2::date
        AND (CASE WHEN cu.match_id IS NOT NULL THEN p.points / 2 ELSE p.points END) = 3
      ) AS exact_results,
      COUNT(p.id) FILTER (
        WHERE p.points IS NOT NULL
        AND (m.match_date AT TIME ZONE 'America/New_York')::date BETWEEN $1::date AND $2::date
        AND (CASE WHEN cu.match_id IS NOT NULL THEN p.points / 2 ELSE p.points END) = 1
      ) AS simple_results,
      COALESCE(SUM(
        CASE WHEN cu.match_id IS NOT NULL AND p.points IS NOT NULL
        AND (m.match_date AT TIME ZONE 'America/New_York')::date BETWEEN $1::date AND $2::date
        THEN p.points - (p.points / 2) ELSE 0 END
      ), 0) AS co2_points
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN matches m ON m.id = p.match_id
    LEFT JOIN comodin_usage cu ON cu.user_id = u.id AND cu.match_id = p.match_id AND cu.comodin_type = 'CO2'
    WHERE u.is_admin = FALSE
    GROUP BY u.id, u.display_name
  \`, [period.start, period.end]);

  const serialized = rows.map((r: any) => ({
    user_id: r.user_id,
    display_name: r.display_name,
    total_points: Number(r.match_points) + Number(r.special_points),
    special_points: Number(r.special_points),
    matches_predicted: Number(r.matches_predicted),
    exact_results: Number(r.exact_results),
    diff_results: 0,
    simple_results: Number(r.simple_results),
    co2_points: Number(r.co2_points),
  })).sort((a: any, b: any) => b.total_points - a.total_points || b.exact_results - a.exact_results);

  return NextResponse.json({ rows: serialized });
}
`;

fs.writeFileSync(dir + '/route.ts', content);
console.log('OK');