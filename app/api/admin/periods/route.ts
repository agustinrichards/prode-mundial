import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { dateLabel, isOpen } = await req.json();
  await query(
    `INSERT INTO betting_periods (date_label, is_open, opened_at, updated_at)
     VALUES ($1, $2, CASE WHEN $2 THEN NOW() ELSE NULL END, NOW())
     ON CONFLICT (date_label) DO UPDATE SET
       is_open = $2,
       opened_at = CASE WHEN $2 THEN NOW() ELSE betting_periods.opened_at END,
       closed_at = CASE WHEN NOT $2 THEN NOW() ELSE NULL END,
       updated_at = NOW()`,
    [dateLabel, isOpen]
  );
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const periods = await query("SELECT * FROM betting_periods");
  return NextResponse.json({ periods });
}
