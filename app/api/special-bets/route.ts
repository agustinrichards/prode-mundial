import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  const firstMatch = await query(
    "SELECT predictions_close_at FROM matches WHERE date_label='fecha_1' ORDER BY predictions_close_at ASC LIMIT 1"
  );
  if (firstMatch[0] && new Date(firstMatch[0].predictions_close_at) < new Date()) {
    return NextResponse.json({ error: "Plazo cerrado" }, { status: 403 });
  }

  const { championTeam, topScorerName, lagoDay, waterInstallations } = body;

  await query(
    `INSERT INTO special_bets (user_id, champion_team, top_scorer_name, lago_day, water_installations)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       champion_team = COALESCE($2, special_bets.champion_team),
       top_scorer_name = COALESCE($3, special_bets.top_scorer_name),
       lago_day = COALESCE($4, special_bets.lago_day),
       water_installations = COALESCE($5, special_bets.water_installations),
       updated_at = NOW()`,
    [userId, championTeam ?? null, topScorerName ?? null, lagoDay ?? null, waterInstallations ?? null]
  );

  return NextResponse.json({ ok: true });
}
