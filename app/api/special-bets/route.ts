import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query, queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();

  // Verificar que el período fecha_1 esté abierto
  const period = await queryOne(
    "SELECT is_open FROM betting_periods WHERE date_label = 'especiales'"
  );
  if (!period?.is_open) {
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