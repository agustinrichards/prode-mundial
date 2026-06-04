-- ============================================================
-- 002_special_results.sql
-- Tabla de resultados finales + función calculate_special_bet_points
-- ============================================================

-- Tabla para guardar los resultados oficiales del Mundial
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

-- daily_scores: puntos por usuario por día (para LAGO)
CREATE TABLE IF NOT EXISTS daily_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_date  DATE NOT NULL,
  points      INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_date)
);

-- Agregar columnas a special_bets si no existen
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='special_bets' AND column_name='champion_points'
  ) THEN
    ALTER TABLE special_bets
      ADD COLUMN champion_points INT NOT NULL DEFAULT 0,
      ADD COLUMN scorer_points   INT NOT NULL DEFAULT 0,
      ADD COLUMN lago_bonus      INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Agregar special_points a leaderboard_cache si no existe
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard_cache' AND column_name='special_points'
  ) THEN
    ALTER TABLE leaderboard_cache ADD COLUMN special_points INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Función: calcular puntos de apuestas especiales
CREATE OR REPLACE FUNCTION calculate_special_bet_points()
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_result   special_results%ROWTYPE;
  v_bet      special_bets%ROWTYPE;
  v_champ    INT;
  v_scorer   INT;
  v_lago     INT;
  v_best_day INT;
BEGIN
  SELECT * INTO v_result FROM special_results LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  FOR v_bet IN SELECT * FROM special_bets LOOP
    v_champ  := 0;
    v_scorer := 0;
    v_lago   := 0;

    IF v_bet.champion_team IS NOT NULL AND v_result.champion_team IS NOT NULL THEN
      IF v_bet.champion_team = v_result.champion_team THEN v_champ := 10;
      ELSIF v_bet.champion_team = v_result.runner_up_team THEN v_champ := 5;
      ELSIF v_bet.champion_team = v_result.third_place_team THEN v_champ := 2;
      END IF;
    END IF;

    IF v_bet.top_scorer_name IS NOT NULL AND v_result.top_scorer_1 IS NOT NULL THEN
      IF v_bet.top_scorer_name = v_result.top_scorer_1 THEN v_scorer := 6;
      ELSIF v_bet.top_scorer_name = v_result.top_scorer_2 THEN v_scorer := 3;
      ELSIF v_bet.top_scorer_name = v_result.top_scorer_3 THEN v_scorer := 1;
      END IF;
    END IF;

    IF v_bet.lago_day IS NOT NULL THEN
      SELECT COALESCE(MAX(points), 0) INTO v_best_day
      FROM daily_scores WHERE match_date = v_bet.lago_day;
      v_lago := v_best_day;
    END IF;

    UPDATE special_bets SET
      champion_points = v_champ,
      scorer_points   = v_scorer,
      lago_bonus      = v_lago,
      updated_at      = NOW()
    WHERE id = v_bet.id;

    INSERT INTO leaderboard_cache (user_id, total_points, special_points, updated_at)
    VALUES (v_bet.user_id, v_champ + v_scorer + v_lago, v_champ + v_scorer + v_lago, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_points   = leaderboard_cache.total_points
                       - COALESCE(leaderboard_cache.special_points, 0)
                       + (v_champ + v_scorer + v_lago),
      special_points = v_champ + v_scorer + v_lago,
      updated_at     = NOW();
  END LOOP;
END;
$$;
