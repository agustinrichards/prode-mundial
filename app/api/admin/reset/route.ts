import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, dateLabel, resetSpecials } = await req.json();

  if (resetSpecials && userId) {
    await query("DELETE FROM special_bets WHERE user_id=$1", [userId]);
    return NextResponse.json({ ok: true });
  }

  if (dateLabel && userId) {
    const stageMap: Record<string, string[]> = {
      fecha_1: ["fecha_1"], fecha_2: ["fecha_2"], fecha_3: ["fecha_3"],
      round_of_32: ["r32_1","r32_2","r32_3","r32_4"],
      round_of_16: ["r16_1","r16_2","r16_3","r16_4"],
      quarterfinal: ["qf_1","qf_2"],
      semifinal: ["sf_1"],
      third_place: ["3rd_place"],
      final: ["final"],
    };
    const labels = stageMap[dateLabel] ?? [dateLabel];
    const ph = labels.map((_, i) => `$${i + 2}`).join(",");
    await query(
      `DELETE FROM predictions WHERE user_id=$1 AND match_id IN (SELECT id FROM matches WHERE date_label IN (${ph}))`,
      [userId, ...labels]
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
}
