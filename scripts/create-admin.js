const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.argv[2];

  if (!email || !password) {
    console.error("Uso: node scripts/create-admin.js <contraseña>");
    console.error("El email se lee de ADMIN_EMAIL en .env.local");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const res = await pool.query(
    `INSERT INTO users (email, display_name, password_hash, is_admin)
     VALUES ($1, 'Admin', $2, TRUE)
     ON CONFLICT (email) DO UPDATE SET password_hash = $2, is_admin = TRUE
     RETURNING id, email`,
    [email.toLowerCase(), hash]
  );

  await pool.query(
    "INSERT INTO leaderboard_cache (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
    [res.rows[0].id]
  );

  console.log(`✅ Admin creado: ${res.rows[0].email}`);
  await pool.end();
}

createAdmin().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
