import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query, queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { matchId, homePred, awayPred, isRio } = body;

  // Check if match is still open
  const match = await queryOne(
    "SELECT id, predictions_close_at FROM matches WHERE id = $1",
    [matchId]
  );
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (new Date(match.predictions_close_at) < new Date()) {
    return NextResponse.json({ error: "Predictions closed" }, { status: 403 });
  }

  const table = isRio ? "rio_predictions" : "predictions";
  await query(
    `INSERT INTO ${table} (user_id, match_id, home_score_pred, away_score_pred)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, match_id)
     DO UPDATE SET home_score_pred = $3, away_score_pred = $4, updated_at = NOW()`,
    [userId, matchId, homePred, awayPred]
  );

  return NextResponse.json({ ok: true });
}
