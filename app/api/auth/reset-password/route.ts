import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Mínimo 6 caracteres" }, { status: 400 });

  const record = await queryOne(
    "SELECT * FROM password_reset_tokens WHERE token=$1 AND used_at IS NULL AND expires_at > NOW()",
    [token]
  );
  if (!record) return NextResponse.json({ error: "Link inválido o expirado" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  await query("UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2", [hash, record.user_id]);
  await query("UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1", [record.id]);

  return NextResponse.json({ ok: true });
}