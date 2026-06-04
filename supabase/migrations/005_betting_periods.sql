-- Períodos de apuestas controlados por el admin
CREATE TABLE IF NOT EXISTS betting_periods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label  TEXT NOT NULL UNIQUE,
  is_open     BOOLEAN NOT NULL DEFAULT FALSE,
  opened_at   TIMESTAMPTZ,
  closed_at   TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar períodos para todas las fechas
INSERT INTO betting_periods (date_label, is_open) VALUES
('fecha_1', TRUE),
('fecha_2', FALSE),
('fecha_3', FALSE),
('round_of_32', FALSE),
('round_of_16', FALSE),
('quarterfinal', FALSE),
('semifinal', FALSE),
('third_place', FALSE),
('final', FALSE),
('especiales', TRUE)
ON CONFLICT (date_label) DO NOTHING;
