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
    SELECT ls.user_id, u.display_name, ls.total_points, ls.rank,
           0 AS special_points, 0 AS matches_predicted, 0 AS correct_results
    FROM leaderboard_snapshots ls
    JOIN users u ON u.id=ls.user_id
    WHERE ls.snapshot_date=$1
    ORDER BY ls.rank ASC, ls.total_points DESC
  `, [date]);

  return NextResponse.json({ rows });
}
