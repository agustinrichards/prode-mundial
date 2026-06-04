-- ============================================================
-- PRODE MUNDIAL 2026 — Schema principal (Neon/Postgres)
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PARTIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team            TEXT NOT NULL,
  away_team            TEXT NOT NULL,
  match_date           TIMESTAMPTZ NOT NULL,
  stage                TEXT NOT NULL DEFAULT 'group',
  group_name           TEXT,
  date_label           TEXT,
  venue                TEXT,
  home_score           INT,
  away_score           INT,
  home_score_aet       INT,
  away_score_aet       INT,
  home_penalties       INT,
  away_penalties       INT,
  is_visible           BOOLEAN NOT NULL DEFAULT TRUE,
  predictions_close_at TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_stage ON matches(stage);
CREATE INDEX IF NOT EXISTS idx_matches_date_label ON matches(date_label);

-- ============================================================
-- PREDICCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score_pred INT NOT NULL,
  away_score_pred INT NOT NULL,
  points          INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);

-- ============================================================
-- COMODINES
-- ============================================================
CREATE TABLE IF NOT EXISTS comodin_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  comodin_type TEXT NOT NULL CHECK (comodin_type IN ('CO2', 'RIO')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id, comodin_type)
);

-- RIO: segunda predicción
CREATE TABLE IF NOT EXISTS rio_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score_pred INT NOT NULL,
  away_score_pred INT NOT NULL,
  points          INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

-- ============================================================
-- APUESTAS ESPECIALES
-- ============================================================
CREATE TABLE IF NOT EXISTS special_bets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  champion_team    TEXT,
  top_scorer_name  TEXT,
  lago_day         DATE,
  champion_points  INT NOT NULL DEFAULT 0,
  scorer_points    INT NOT NULL DEFAULT 0,
  lago_bonus       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESULTADOS ESPECIALES (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS special_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  champion_team    TEXT,
  runner_up_team   TEXT,
  third_place_team TEXT,
  top_scorer_1     TEXT,
  top_scorer_2     TEXT,
  top_scorer_3     TEXT,
  results_locked   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEADERBOARD CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points      INT NOT NULL DEFAULT 0,
  special_points    INT NOT NULL DEFAULT 0,
  matches_predicted INT NOT NULL DEFAULT 0,
  correct_results   INT NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DAILY SCORES (para LAGO)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_date DATE NOT NULL,
  points     INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_date)
);

-- ============================================================
-- FUNCIÓN: calcular puntos de predicción
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_prediction_points(
  p_home_pred INT, p_away_pred INT,
  p_home_real INT, p_away_real INT
) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
  pred_result TEXT;
  real_result TEXT;
  pred_diff   INT;
  real_diff   INT;
BEGIN
  IF p_home_real IS NULL OR p_away_real IS NULL THEN RETURN NULL; END IF;

  pred_result := CASE
    WHEN p_home_pred > p_away_pred THEN 'H'
    WHEN p_home_pred < p_away_pred THEN 'A'
    ELSE 'D' END;

  real_result := CASE
    WHEN p_home_real > p_away_real THEN 'H'
    WHEN p_home_real < p_away_real THEN 'A'
    ELSE 'D' END;

  -- Exacto
  IF p_home_pred = p_home_real AND p_away_pred = p_away_real THEN RETURN 3; END IF;

  -- Diferencia correcta
  pred_diff := p_home_pred - p_away_pred;
  real_diff := p_home_real - p_away_real;
  IF pred_result = real_result AND pred_diff = real_diff THEN RETURN 2; END IF;

  -- Solo resultado
  IF pred_result = real_result THEN RETURN 1; END IF;

  RETURN 0;
END;
$$;

-- ============================================================
-- FIXTURE — Fase de Grupos
-- ============================================================
-- Fecha 1
INSERT INTO matches (home_team, away_team, match_date, stage, group_name, date_label, predictions_close_at) VALUES
('México','Sudáfrica','2026-06-11 21:00:00-03',      'group','A','fecha_1','2026-06-10 23:59:00-03'),
('Canadá','Bosnia y Herzegovina','2026-06-12 09:00:00-03','group','B','fecha_1','2026-06-11 23:59:00-03'),
('Brasil','Marruecos','2026-06-12 12:00:00-03',      'group','C','fecha_1','2026-06-11 23:59:00-03'),
('Estados Unidos','Paraguay','2026-06-12 15:00:00-03','group','D','fecha_1','2026-06-11 23:59:00-03'),
('Alemania','Curazao','2026-06-12 18:00:00-03',      'group','E','fecha_1','2026-06-11 23:59:00-03'),
('Países Bajos','Japón','2026-06-12 21:00:00-03',    'group','F','fecha_1','2026-06-11 23:59:00-03'),
('Bélgica','Egipto','2026-06-13 12:00:00-03',        'group','G','fecha_1','2026-06-12 23:59:00-03'),
('España','Cabo Verde','2026-06-13 15:00:00-03',     'group','H','fecha_1','2026-06-12 23:59:00-03'),
('Francia','Senegal','2026-06-13 18:00:00-03',       'group','I','fecha_1','2026-06-12 23:59:00-03'),
('Argentina','Argelia','2026-06-13 21:00:00-03',     'group','J','fecha_1','2026-06-12 23:59:00-03'),
('Portugal','RD Congo','2026-06-14 15:00:00-03',     'group','K','fecha_1','2026-06-13 23:59:00-03'),
('Inglaterra','Croacia','2026-06-14 21:00:00-03',    'group','L','fecha_1','2026-06-13 23:59:00-03'),
-- Fecha 1 continuación
('Corea del Sur','Chequia','2026-06-14 12:00:00-03', 'group','A','fecha_1','2026-06-13 23:59:00-03'),
('Qatar','Suiza','2026-06-14 09:00:00-03',           'group','B','fecha_1','2026-06-13 23:59:00-03'),
('Haití','Escocia','2026-06-15 12:00:00-03',         'group','C','fecha_1','2026-06-14 23:59:00-03'),
('Australia','Türkiye','2026-06-15 15:00:00-03',     'group','D','fecha_1','2026-06-14 23:59:00-03'),
('Costa de Marfil','Ecuador','2026-06-15 18:00:00-03','group','E','fecha_1','2026-06-14 23:59:00-03'),
('Suecia','Túnez','2026-06-15 21:00:00-03',          'group','F','fecha_1','2026-06-14 23:59:00-03'),
('Irán','Nueva Zelanda','2026-06-16 12:00:00-03',    'group','G','fecha_1','2026-06-15 23:59:00-03'),
('Arabia Saudita','Uruguay','2026-06-16 15:00:00-03','group','H','fecha_1','2026-06-15 23:59:00-03'),
('Iraq','Noruega','2026-06-16 18:00:00-03',          'group','I','fecha_1','2026-06-15 23:59:00-03'),
('Austria','Jordania','2026-06-16 21:00:00-03',      'group','J','fecha_1','2026-06-15 23:59:00-03'),
('Uzbekistán','Colombia','2026-06-17 15:00:00-03',   'group','K','fecha_1','2026-06-16 23:59:00-03'),
('Ghana','Panamá','2026-06-17 21:00:00-03',          'group','L','fecha_1','2026-06-16 23:59:00-03'),
-- Fecha 2
('Sudáfrica','Corea del Sur','2026-06-18 12:00:00-03','group','A','fecha_2','2026-06-17 23:59:00-03'),
('México','Chequia','2026-06-18 21:00:00-03',        'group','A','fecha_2','2026-06-17 23:59:00-03'),
('Bosnia y Herzegovina','Qatar','2026-06-18 15:00:00-03','group','B','fecha_2','2026-06-17 23:59:00-03'),
('Canadá','Suiza','2026-06-19 09:00:00-03',          'group','B','fecha_2','2026-06-18 23:59:00-03'),
('Brasil','Haití','2026-06-19 18:00:00-03',          'group','C','fecha_2','2026-06-18 23:59:00-03'),
('Marruecos','Escocia','2026-06-19 15:00:00-03',     'group','C','fecha_2','2026-06-18 23:59:00-03'),
('Estados Unidos','Australia','2026-06-19 21:00:00-03','group','D','fecha_2','2026-06-18 23:59:00-03'),
('Paraguay','Türkiye','2026-06-20 12:00:00-03',      'group','D','fecha_2','2026-06-19 23:59:00-03'),
('Alemania','Costa de Marfil','2026-06-20 15:00:00-03','group','E','fecha_2','2026-06-19 23:59:00-03'),
('Curazao','Ecuador','2026-06-20 18:00:00-03',       'group','E','fecha_2','2026-06-19 23:59:00-03'),
('Países Bajos','Suecia','2026-06-20 21:00:00-03',   'group','F','fecha_2','2026-06-19 23:59:00-03'),
('Japón','Túnez','2026-06-21 09:00:00-03',           'group','F','fecha_2','2026-06-20 23:59:00-03'),
('Bélgica','Irán','2026-06-21 12:00:00-03',          'group','G','fecha_2','2026-06-20 23:59:00-03'),
('Egipto','Nueva Zelanda','2026-06-21 15:00:00-03',  'group','G','fecha_2','2026-06-20 23:59:00-03'),
('España','Arabia Saudita','2026-06-21 18:00:00-03', 'group','H','fecha_2','2026-06-20 23:59:00-03'),
('Cabo Verde','Uruguay','2026-06-21 21:00:00-03',    'group','H','fecha_2','2026-06-20 23:59:00-03'),
('Francia','Iraq','2026-06-22 12:00:00-03',          'group','I','fecha_2','2026-06-21 23:59:00-03'),
('Senegal','Noruega','2026-06-22 15:00:00-03',       'group','I','fecha_2','2026-06-21 23:59:00-03'),
('Argentina','Austria','2026-06-22 18:00:00-03',     'group','J','fecha_2','2026-06-21 23:59:00-03'),
('Argelia','Jordania','2026-06-22 21:00:00-03',      'group','J','fecha_2','2026-06-21 23:59:00-03'),
('Portugal','Uzbekistán','2026-06-23 15:00:00-03',   'group','K','fecha_2','2026-06-22 23:59:00-03'),
('RD Congo','Colombia','2026-06-23 18:00:00-03',     'group','K','fecha_2','2026-06-22 23:59:00-03'),
('Inglaterra','Ghana','2026-06-23 15:00:00-03',      'group','L','fecha_2','2026-06-22 23:59:00-03'),
('Croacia','Panamá','2026-06-23 21:00:00-03',        'group','L','fecha_2','2026-06-22 23:59:00-03'),
-- Fecha 3 (simultáneos por grupo)
('Chequia','Sudáfrica','2026-06-26 17:00:00-03',     'group','A','fecha_3','2026-06-25 23:59:00-03'),
('Corea del Sur','México','2026-06-26 17:00:00-03',  'group','A','fecha_3','2026-06-25 23:59:00-03'),
('Suiza','Bosnia y Herzegovina','2026-06-26 21:00:00-03','group','B','fecha_3','2026-06-25 23:59:00-03'),
('Qatar','Canadá','2026-06-26 21:00:00-03',          'group','B','fecha_3','2026-06-25 23:59:00-03'),
('Escocia','Brasil','2026-06-27 17:00:00-03',        'group','C','fecha_3','2026-06-26 23:59:00-03'),
('Haití','Marruecos','2026-06-27 17:00:00-03',       'group','C','fecha_3','2026-06-26 23:59:00-03'),
('Türkiye','Estados Unidos','2026-06-27 21:00:00-03','group','D','fecha_3','2026-06-26 23:59:00-03'),
('Australia','Paraguay','2026-06-27 21:00:00-03',    'group','D','fecha_3','2026-06-26 23:59:00-03'),
('Ecuador','Alemania','2026-06-28 17:00:00-03',      'group','E','fecha_3','2026-06-27 23:59:00-03'),
('Costa de Marfil','Curazao','2026-06-28 17:00:00-03','group','E','fecha_3','2026-06-27 23:59:00-03'),
('Túnez','Países Bajos','2026-06-28 21:00:00-03',    'group','F','fecha_3','2026-06-27 23:59:00-03'),
('Suecia','Japón','2026-06-28 21:00:00-03',          'group','F','fecha_3','2026-06-27 23:59:00-03'),
('Nueva Zelanda','Bélgica','2026-06-29 17:00:00-03', 'group','G','fecha_3','2026-06-28 23:59:00-03'),
('Irán','Egipto','2026-06-29 17:00:00-03',           'group','G','fecha_3','2026-06-28 23:59:00-03'),
('Uruguay','España','2026-06-29 21:00:00-03',        'group','H','fecha_3','2026-06-28 23:59:00-03'),
('Cabo Verde','Arabia Saudita','2026-06-29 21:00:00-03','group','H','fecha_3','2026-06-28 23:59:00-03'),
('Noruega','Francia','2026-06-30 17:00:00-03',       'group','I','fecha_3','2026-06-29 23:59:00-03'),
('Iraq','Senegal','2026-06-30 17:00:00-03',          'group','I','fecha_3','2026-06-29 23:59:00-03'),
('Jordania','Argentina','2026-06-30 21:00:00-03',    'group','J','fecha_3','2026-06-29 23:59:00-03'),
('Austria','Argelia','2026-06-30 21:00:00-03',       'group','J','fecha_3','2026-06-29 23:59:00-03'),
('Colombia','Portugal','2026-07-01 17:00:00-03',     'group','K','fecha_3','2026-06-30 23:59:00-03'),
('Uzbekistán','RD Congo','2026-07-01 17:00:00-03',   'group','K','fecha_3','2026-06-30 23:59:00-03'),
('Panamá','Inglaterra','2026-07-01 21:00:00-03',     'group','L','fecha_3','2026-06-30 23:59:00-03'),
('Ghana','Croacia','2026-07-01 21:00:00-03',         'group','L','fecha_3','2026-06-30 23:59:00-03');

-- Inicializar leaderboard para todos los usuarios existentes
INSERT INTO leaderboard_cache (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
