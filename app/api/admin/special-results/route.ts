import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  await query(
    `INSERT INTO special_results (champion_team,runner_up_team,third_place_team,top_scorer_1,top_scorer_2,top_scorer_3)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT DO NOTHING`,
    [body.champion_team||null, body.runner_up_team||null, body.third_place_team||null,
     body.top_scorer_1||null, body.top_scorer_2||null, body.top_scorer_3||null]
  );
  await query(
    `UPDATE special_results SET champion_team=$1,runner_up_team=$2,third_place_team=$3,top_scorer_1=$4,top_scorer_2=$5,top_scorer_3=$6,updated_at=NOW()`,
    [body.champion_team||null, body.runner_up_team||null, body.third_place_team||null,
     body.top_scorer_1||null, body.top_scorer_2||null, body.top_scorer_3||null]
  );
  return NextResponse.json({ ok: true });
}
