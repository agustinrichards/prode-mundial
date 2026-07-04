import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query, queryOne } from "@/lib/db";

const LIMITS: Record<string, Record<string, number>> = {
  CO2: { group: 6, round_of_32: 2, round_of_16: 1 },
  RIO: { group: 6, round_of_32: 2, quarterfinal: 1 },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { matchId, type, remove } = await req.json();

const match = await queryOne(
    "SELECT id, stage, manually_locked FROM matches WHERE id = $1",
    [matchId]
  );
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.manually_locked) {
    return NextResponse.json({ error: "Predictions closed" }, { status: 403 });
  }

  if (remove) {
    await query(
      "DELETE FROM comodin_usage WHERE user_id = $1 AND match_id = $2 AND comodin_type = $3",
      [userId, matchId, type]
    );
    return NextResponse.json({ ok: true });
  }

  // Block CO2 + RIO together
  const otherType = type === "CO2" ? "RIO" : "CO2";
  const otherUsage = await queryOne(
    "SELECT 1 FROM comodin_usage WHERE user_id=$1 AND match_id=$2 AND comodin_type=$3",
    [userId, matchId, otherType]
  );
  if (otherUsage) {
    return NextResponse.json({ error: `No se puede usar ${type} y ${otherType} en el mismo partido` }, { status: 403 });
  }

  // Check limit
  const limit = LIMITS[type]?.[match.stage] ?? 0;
  if (limit === 0) {
    return NextResponse.json({ error: "Comodin not available for this stage" }, { status: 403 });
  }
  const usageRes = await query(
    `SELECT COUNT(*) AS cnt FROM comodin_usage cu
     JOIN matches m ON m.id = cu.match_id
     WHERE cu.user_id = $1 AND cu.comodin_type = $2 AND m.stage = $3`,
    [userId, type, match.stage]
  );
  const used = parseInt(usageRes[0]?.cnt ?? "0");
  if (used >= limit) {
    return NextResponse.json({ error: `Limite de ${type} alcanzado para esta etapa` }, { status: 403 });
  }

  await query(
    `INSERT INTO comodin_usage (user_id, match_id, comodin_type)
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [userId, matchId, type]
  );
  return NextResponse.json({ ok: true });
}