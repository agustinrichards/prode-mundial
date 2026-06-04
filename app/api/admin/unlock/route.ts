import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, matchId, unlockAll, dateLabel } = await req.json();

  if (unlockAll && userId) {
    // Unlock all predictions for a user
    await query("UPDATE predictions SET locked=FALSE WHERE user_id=$1", [userId]);
    return NextResponse.json({ ok: true });
  }

  if (matchId && userId) {
    // Unlock specific prediction
    await query("UPDATE predictions SET locked=FALSE WHERE user_id=$1 AND match_id=$2", [userId, matchId]);
    return NextResponse.json({ ok: true });
  }

  if (dateLabel && userId) {
    // Unlock all predictions for a date label
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
