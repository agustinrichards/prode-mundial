import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const user = await queryOne("SELECT id, email FROM users WHERE email=$1", [email.toLowerCase()]);
  
  // Always return success to avoid email enumeration
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [user.id, token, expires]
  );

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (e) {
    console.error("Email send failed:", e);
  }

  return NextResponse.json({ ok: true });
}
