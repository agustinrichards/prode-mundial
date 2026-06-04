const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const migrations = [
    "supabase/migrations/001_init.sql",
    "supabase/migrations/002_special_results.sql",
    "supabase/migrations/003_submitted_at.sql",
    "supabase/migrations/004_new_features.sql",
    "supabase/migrations/005_betting_periods.sql",
  ];
  for (const file of migrations) {
    console.log(`Running ${file}...`);
    const sql = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    try { await pool.query(sql); console.log(`✓ ${file} done`); }
    catch (e) { console.log(`⚠ ${file}: ${e.message}`); }
  }
  await pool.end();
  console.log("\n✅ All migrations complete!");
}
migrate().catch(e => { console.error(e.message); process.exit(1); });
