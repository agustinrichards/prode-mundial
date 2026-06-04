import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const matches = await query(`
    SELECT id, home_team, away_team, match_date, stage, date_label, home_score, away_score
    FROM matches
    WHERE home_team ILIKE $1 OR away_team ILIKE $1 OR date_label ILIKE $1
    ORDER BY match_date ASC
    LIMIT 20
  `, [`%${q}%`]);
  return NextResponse.json({ matches });
}
