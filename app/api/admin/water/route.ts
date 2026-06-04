import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { weekNumber, weekDate, weeklyNet, cumulative, notes } = await req.json();
  const rows = await query(
    "INSERT INTO water_updates (week_number,week_date,weekly_net,cumulative,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [weekNumber, weekDate, weeklyNet, cumulative, notes ?? null]
  );
  return NextResponse.json({ update: rows[0] });
}
