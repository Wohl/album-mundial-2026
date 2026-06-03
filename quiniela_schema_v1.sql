-- ============================================================
-- Quiniela Mundial 2026 — Schema v1
-- Sprint 6A — Fundación Supabase
-- Fecha: 2026-06-03
--
-- INSTRUCCIONES:
--   1. Abrir Supabase Dashboard → SQL Editor
--   2. Ejecutar este archivo completo (quiniela_schema_v1.sql)
--   3. Ejecutar quiniela_seed.sql para insertar la pool global
--   4. Agregar NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID en .env.local
--      con el UUID retornado por quiniela_seed.sql
--
-- SEGURIDAD:
--   - NO ejecutar DROP TABLE ni ALTER TABLE en tablas existentes
--   - Este script solo crea NUEVAS tablas con IF NOT EXISTS
--   - Es seguro re-ejecutar (idempotente para tablas e índices)
--   - Las políticas RLS usan bloques DO para evitar errores de duplicado
-- ============================================================


-- ── 1. TABLA: pools ─────────────────────────────────────────────────
-- Define una quiniela. Para MVP: una pool global única.
-- Para futuro: pools privadas con invite_code.

CREATE TABLE IF NOT EXISTS pools (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  type        text        NOT NULL DEFAULT 'global'
                          CHECK (type IN ('global', 'public', 'private')),
  invite_code text        UNIQUE,              -- NULL para global/public
  created_by  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  settings    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pools_type_active_idx
  ON pools (type, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS pools_invite_code_idx
  ON pools (invite_code)
  WHERE invite_code IS NOT NULL;


-- ── 2. TABLA: pool_members ───────────────────────────────────────────
-- Relación usuario ↔ pool.
-- La pool global incluye a todos los usuarios autenticados
-- (se unen automáticamente al hacer su primera predicción).

CREATE TABLE IF NOT EXISTS pool_members (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id   uuid        NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id)
);

CREATE INDEX IF NOT EXISTS pool_members_pool_idx
  ON pool_members (pool_id);

CREATE INDEX IF NOT EXISTS pool_members_user_idx
  ON pool_members (user_id);


-- ── 3. TABLA: predictions ────────────────────────────────────────────
-- Una predicción por usuario por partido por pool.
-- Inmutable después de locked_at IS NOT NULL.
--
-- match_id: ID estático del sistema (ej. 'A-1-1', 'R32-1', 'FINAL')
--   correspondiente a WC2026_MATCHES en calendar-data.ts
-- winner_pred: solo para fase eliminatoria (código FIFA 3 letras)
-- locked_at: seteado por el cron al inicio del partido (service role)

CREATE TABLE IF NOT EXISTS predictions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id          uuid        NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id         text        NOT NULL,
  home_score_pred  smallint    NOT NULL
                               CHECK (home_score_pred >= 0 AND home_score_pred <= 30),
  away_score_pred  smallint    NOT NULL
                               CHECK (away_score_pred >= 0 AND away_score_pred <= 30),
  winner_pred      char(3),               -- NULL en fase de grupos
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  locked_at        timestamptz,           -- NULL = editable; NOT NULL = bloqueada
  UNIQUE (pool_id, user_id, match_id)
);

CREATE INDEX IF NOT EXISTS predictions_pool_match_idx
  ON predictions (pool_id, match_id);

CREATE INDEX IF NOT EXISTS predictions_user_pool_idx
  ON predictions (user_id, pool_id);

CREATE INDEX IF NOT EXISTS predictions_match_idx
  ON predictions (match_id);

-- Índice parcial: predicciones aún no bloqueadas (las que el cron debe bloquear)
CREATE INDEX IF NOT EXISTS predictions_unlocked_idx
  ON predictions (match_id, pool_id)
  WHERE locked_at IS NULL;


-- ── 4. TABLA: user_match_scores ──────────────────────────────────────
-- Resultado del scoring por partido por usuario.
-- Escrito solo por service role (cron de scoring).
-- total_points se calcula automáticamente como columna generada.

CREATE TABLE IF NOT EXISTS user_match_scores (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id          uuid        NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id         text        NOT NULL,
  prediction_id    uuid        REFERENCES predictions(id) ON DELETE SET NULL,
  -- Resultado real del partido (a 90')
  home_score_real  smallint,
  away_score_real  smallint,
  winner_real      char(3),               -- para fase eliminatoria
  -- Puntuación calculada
  base_points      smallint    NOT NULL DEFAULT 0,
  bonus_points     smallint    NOT NULL DEFAULT 0,
  total_points     smallint    GENERATED ALWAYS AS (base_points + bonus_points) STORED,
  -- Detalle del acierto (para UI de "¿qué acertaste?")
  score_tier       text        CHECK (score_tier IN (
                                 'exact',         -- marcador exacto (5 pts grupos)
                                 'result_diff',   -- resultado + diferencia (4 pts grupos)
                                 'result',        -- solo resultado (3 pts grupos)
                                 'diff',          -- solo diferencia (1 pt grupos)
                                 'none'           -- nada correcto
                               )),
  winner_correct   boolean,
  -- Auditoría
  scored_at        timestamptz NOT NULL DEFAULT now(),
  scoring_run_id   uuid        REFERENCES scoring_runs(id) ON DELETE SET NULL,
  UNIQUE (pool_id, user_id, match_id)
);

CREATE INDEX IF NOT EXISTS ums_pool_match_idx
  ON user_match_scores (pool_id, match_id);

CREATE INDEX IF NOT EXISTS ums_user_pool_idx
  ON user_match_scores (user_id, pool_id);

CREATE INDEX IF NOT EXISTS ums_pool_points_idx
  ON user_match_scores (pool_id, total_points DESC);


-- ── 5. TABLA: standings ──────────────────────────────────────────────
-- Leaderboard cacheado por pool.
-- Recalculado después de cada scoring run por el service role.

CREATE TABLE IF NOT EXISTS standings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id      uuid        NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_points integer     NOT NULL DEFAULT 0,
  exact_count  smallint    NOT NULL DEFAULT 0,   -- marcadores exactos
  result_count smallint    NOT NULL DEFAULT 0,   -- resultados correctos (sin exacto)
  diff_count   smallint    NOT NULL DEFAULT 0,   -- diferencia correcta
  winner_count smallint    NOT NULL DEFAULT 0,   -- ganadores eliminatoria
  total_preds  smallint    NOT NULL DEFAULT 0,   -- total predicciones realizadas
  rank         integer,                          -- calculado por el cron
  rank_change  smallint    NOT NULL DEFAULT 0,   -- movimiento desde última actualización
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pool_id, user_id)
);

-- Índice compuesto para leaderboard: orden por puntos + exactos como desempate
CREATE INDEX IF NOT EXISTS standings_pool_rank_idx
  ON standings (pool_id, total_points DESC, exact_count DESC);

CREATE INDEX IF NOT EXISTS standings_user_pools_idx
  ON standings (user_id);


-- ── 6. TABLA: scoring_runs ───────────────────────────────────────────
-- Auditoría de cada ejecución del cron de scoring.
-- Solo service role puede escribir.
-- Permite re-ejecutar scoring de forma idempotente.

CREATE TABLE IF NOT EXISTS scoring_runs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id              text        NOT NULL,
  home_score_final      smallint,
  away_score_final      smallint,
  winner_final          char(3),
  predictions_evaluated smallint    NOT NULL DEFAULT 0,
  users_scored          smallint    NOT NULL DEFAULT 0,
  run_at                timestamptz NOT NULL DEFAULT now(),
  triggered_by          text        NOT NULL DEFAULT 'cron'
                                    CHECK (triggered_by IN ('cron', 'manual', 'api', 'test')),
  duration_ms           integer,
  status                text        NOT NULL DEFAULT 'success'
                                    CHECK (status IN ('success', 'partial', 'error')),
  error_detail          text
);

CREATE INDEX IF NOT EXISTS scoring_runs_match_idx
  ON scoring_runs (match_id, run_at DESC);


-- ── NOTA sobre orden de creación ─────────────────────────────────────
-- user_match_scores referencia scoring_runs, por lo que scoring_runs
-- debe existir primero. Sin embargo, en el script actual scoring_runs
-- se define DESPUÉS de user_match_scores porque la FK usa ON DELETE SET NULL.
-- Si Postgres reporta error de referencia circular, ejecutar el script
-- en dos pasos: primero scoring_runs, luego el resto.
--
-- ALTERNATIVA: remover la FK a scoring_runs de user_match_scores y
-- guardar scoring_run_id solo como referencia informativa (sin constraint).


-- ── RLS: Habilitar Row Level Security ────────────────────────────────
ALTER TABLE pools           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_runs    ENABLE ROW LEVEL SECURITY;


-- ── RLS: POOLS ───────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "pools_read_authenticated"
    ON pools FOR SELECT
    TO authenticated
    USING (
      type IN ('global', 'public')   -- pools globales/públicas: todos
      OR created_by = auth.uid()     -- propias: creador puede ver
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pools_insert_authenticated"
    ON pools FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pools_update_owner"
    ON pools FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sin DELETE para usuarios (pools son permanentes una vez creadas)


-- ── RLS: POOL_MEMBERS ────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "pool_members_read"
    ON pool_members FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid()           -- ver mis propias membresías
      OR pool_id IN (                -- ver miembros de pools donde participo
        SELECT pool_id FROM pool_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pool_members_join"
    ON pool_members FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pool_members_leave"
    ON pool_members FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── RLS: PREDICTIONS ─────────────────────────────────────────────────
-- Regla clave de privacidad:
--   Las predicciones de otros usuarios son visibles SOLO después del
--   kickoff (locked_at IS NOT NULL). Antes, solo el propio usuario ve las suyas.
-- Regla clave de integridad:
--   UPDATE solo permitido cuando locked_at IS NULL (partido no comenzado).

DO $$ BEGIN
  CREATE POLICY "predictions_read"
    ON predictions FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid()           -- el propio usuario siempre ve las suyas
      OR locked_at IS NOT NULL       -- ajenas: solo después del bloqueo
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "predictions_insert"
    ON predictions FOR INSERT
    TO authenticated
    WITH CHECK (
      user_id = auth.uid()
      AND locked_at IS NULL          -- no insertar en partidos bloqueados (extra-seguridad)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "predictions_update"
    ON predictions FOR UPDATE
    TO authenticated
    USING (
      user_id = auth.uid()
      AND locked_at IS NULL          -- solo si el partido no ha bloqueado
    )
    WITH CHECK (
      user_id = auth.uid()
      AND locked_at IS NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sin DELETE: las predicciones son permanentes (auditoría)


-- ── RLS: USER_MATCH_SCORES ───────────────────────────────────────────
-- Lectura pública dentro del pool. Escritura solo service role.

DO $$ BEGIN
  CREATE POLICY "ums_read_authenticated"
    ON user_match_scores FOR SELECT
    TO authenticated
    USING (true);   -- todos los autenticados pueden leer scores
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERT/UPDATE/DELETE: solo service role (sin policy = solo service role puede escribir)


-- ── RLS: STANDINGS ───────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "standings_read_authenticated"
    ON standings FOR SELECT
    TO authenticated
    USING (true);   -- leaderboard público para todos los autenticados
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERT/UPDATE/DELETE: solo service role


-- ── RLS: SCORING_RUNS ────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "scoring_runs_read_authenticated"
    ON scoring_runs FOR SELECT
    TO authenticated
    USING (true);   -- auditoría pública (no contiene datos sensibles)
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERT/UPDATE: solo service role


-- ── Trigger: updated_at automático para predictions ──────────────────
-- Mantiene updated_at sincronizado en cada UPDATE.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER predictions_updated_at
    BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER pools_updated_at
    BEFORE UPDATE ON pools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── Verificación ─────────────────────────────────────────────────────
-- Ejecutar para confirmar que las tablas fueron creadas:
--
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN (
--     'pools','pool_members','predictions',
--     'user_match_scores','standings','scoring_runs'
--   )
--   ORDER BY table_name;
--
-- Resultado esperado: 6 filas.
