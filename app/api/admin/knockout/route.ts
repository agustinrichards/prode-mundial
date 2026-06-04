import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { matchId, homeTeam, awayTeam } = await req.json();
  await query(
    "UPDATE matches SET home_team=$1, away_team=$2, updated_at=NOW() WHERE id=$3",
    [homeTeam, awayTeam, matchId]
  );
  return NextResponse.json({ ok: true });
}
