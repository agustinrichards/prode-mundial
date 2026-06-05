import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, matchId, unlockAll, dateLabel, unlockResult } = await req.json();

  if (unlockResult && matchId) {
    await query("UPDATE matches SET home_score=NULL, away_score=NULL, updated_at=NOW() WHERE id=$1", [matchId]);
    await query("UPDATE predictions SET points=NULL WHERE match_id=$1", [matchId]);
    await query("UPDATE rio_predictions SET points=NULL WHERE match_id=$1", [matchId]);
    return NextResponse.json({ ok: true });
  }

  if (unlockAll && userId) {
    await query("UPDATE predictions SET locked=FALSE WHERE user_id=$1", [userId]);
    return NextResponse.json({ ok: true });
  }

  if (matchId && userId) {
    await query("UPDATE predictions SET locked=FALSE WHERE user_id=$1 AND match_id=$2", [userId, matchId]);
    return NextResponse.json({ ok: true });
  }

  if (dateLabel && userId) {
    await query(`
      UPDATE predictions SET locked=FALSE
      WHERE user_id=$1 AND match_id IN (
        SELECT id FROM matches WHERE date_label=$2
      )
    `, [userId, dateLabel]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
}