import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { waterReal } = await req.json();
  await query(
    "INSERT INTO special_results (water_real) VALUES ($1) ON CONFLICT DO NOTHING",
    [waterReal]
  );
  await query("UPDATE special_results SET water_real=$1, updated_at=NOW()", [waterReal]);
  return NextResponse.json({ ok: true });
}
