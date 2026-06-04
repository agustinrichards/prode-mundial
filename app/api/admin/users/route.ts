import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { displayName, email, password } = await req.json();
  if (!displayName || !email || !password) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  const rows = await query(
    "INSERT INTO users (display_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name",
    [displayName, email.toLowerCase(), hash]
  );

  // Init leaderboard row
  await query(
    "INSERT INTO leaderboard_cache (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
    [rows[0].id]
  );

  return NextResponse.json({ user: rows[0] });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await query(
    "SELECT id, email, display_name, is_admin, created_at FROM users ORDER BY display_name ASC"
  );
  return NextResponse.json({ users });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId } = await req.json();
  await query("DELETE FROM users WHERE id=$1 AND is_admin=FALSE", [userId]);
  return NextResponse.json({ ok: true });
}
