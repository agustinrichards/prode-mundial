import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query, queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { matchId } = await req.json();

const match = await queryOne("SELECT manually_locked FROM matches WHERE id=$1", [matchId]);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.manually_locked) {
    return NextResponse.json({ error: "Predictions already closed" }, { status: 403 });
  }

  await query(
    "UPDATE predictions SET locked=TRUE WHERE user_id=$1 AND match_id=$2",
    [userId, matchId]
  );

  return NextResponse.json({ ok: true });
}
