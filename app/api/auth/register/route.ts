import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { displayName, email, password } = await req.json();
  if (!displayName || !email || !password)
    return NextResponse.json({ error: "Completa todos los campos" }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Minimo 6 caracteres" }, { status: 400 });

  const existing = await query("SELECT id FROM users WHERE email=$1", [email.toLowerCase()]);
  if (existing.length > 0)
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  const rows = await query(
    "INSERT INTO users (display_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name",
    [displayName, email.toLowerCase(), hash]
  );
  await query(
    "INSERT INTO leaderboard_cache (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
    [rows[0].id]
  );
  return NextResponse.json({ ok: true });
}