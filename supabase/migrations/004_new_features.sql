-- ============================================================
-- 004_new_features.sql
-- - Eliminatorias fixture (genérico)
-- - Sedes en matches
-- - Predicciones bloqueadas (locked)
-- - Water installations bet
-- - Leaderboard daily snapshots
-- ============================================================

-- Agregar columnas a matches
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='venue') THEN
    ALTER TABLE matches ADD COLUMN venue TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='city') THEN
    ALTER TABLE matches ADD COLUMN city TEXT;
  END IF;
END $$;

-- Predicciones bloqueadas por el usuario
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='predictions' AND column_name='locked') THEN
    ALTER TABLE predictions ADD COLUMN locked BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Apuesta de instalaciones de agua
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='special_bets' AND column_name='water_installations') THEN
    ALTER TABLE special_bets ADD COLUMN water_installations INT;
    ALTER TABLE special_bets ADD COLUMN water_points INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Resultado real de instalaciones + actualizaciones semanales
CREATE TABLE IF NOT EXISTS water_updates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INT NOT NULL,
  week_date   DATE NOT NULL,
  weekly_net  INT NOT NULL,
  cumulative  INT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='special_results' AND column_name='water_real') THEN
    ALTER TABLE special_results ADD COLUMN water_real INT;
  END IF;
END $$;

-- Snapshot diario del leaderboard (para ver tabla por fecha)
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points INT NOT NULL DEFAULT 0,
  rank        INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (snapshot_date, user_id)
);

-- Fixture eliminatorias (genérico)

