import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matchId, locked } = await req.json();

  await query(
    "UPDATE matches SET manually_locked = $1, updated_at = NOW() WHERE id = $2",
    [locked, matchId]
  );

  return NextResponse.json({ ok: true });
}