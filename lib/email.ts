import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT ?? "587"),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "⚽ Prode 2026 — Recuperar contraseña",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>⚽ Prode Mundial 2026</h2>
        <p>Alguien solicitó restablecer tu contraseña.</p>
        <p>
          <a href="${url}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#888;font-size:12px;">Este link expira en 1 hora. Si no lo pediste, ignorá este email.</p>
      </div>
    `,
  });
}
