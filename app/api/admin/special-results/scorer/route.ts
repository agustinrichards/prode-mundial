import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { updates } = await req.json();

  for (const { userId, pts } of updates) {
    await query(
      `INSERT INTO special_bets (user_id, scorer_points)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET scorer_points = $2, updated_at = NOW()`,
      [userId, pts]
    );
  }

  return NextResponse.json({ ok: true });
}