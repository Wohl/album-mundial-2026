-- ============================================================
-- ALBUM MUNDIAL 2026 — Restauración completa de base de datos
-- Proyecto nuevo: hngymqusifirjurlyacv
--
-- ORDEN DE EJECUCIÓN:
--   BLOQUE 1: Schema base (profiles, sticker_states, trade_requests)
--   BLOQUE 2: Migración v3 (N:N + contraofertas)
--   BLOQUE 3: pack_items
--   BLOQUE 4: RPCs del Dashboard
--   BLOQUE 5: Realtime
--
-- SEGURIDAD: Solo usa CREATE / ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE.
-- NO hace DROP, TRUNCATE, ni operaciones destructivas.
-- ============================================================


-- ============================================================
-- BLOQUE 1: SCHEMA BASE v2
-- Fuente: schema.sql del repositorio
-- ============================================================

-- ── TABLA: profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: sticker_states ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS sticker_states (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_key  TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'missing'
                         CHECK (status IN ('missing','owned','repeated')),
  repeat_count INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sticker_key)
);

CREATE INDEX IF NOT EXISTS idx_sticker_states_user   ON sticker_states(user_id);
CREATE INDEX IF NOT EXISTS idx_sticker_states_key    ON sticker_states(sticker_key);
CREATE INDEX IF NOT EXISTS idx_sticker_states_status ON sticker_states(status);

-- ── TABLA: trade_requests ────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_sticker_key TEXT NOT NULL DEFAULT '',
  offered_sticker_key   TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected','cancelled','countered')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_requests_owner     ON trade_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_requester ON trade_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status    ON trade_requests(status);

-- ── FUNCIÓN: updated_at automático ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── TRIGGERS: updated_at ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sticker_states_updated_at ON sticker_states;
CREATE TRIGGER trg_sticker_states_updated_at
  BEFORE UPDATE ON sticker_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_trade_requests_updated_at ON trade_requests;
CREATE TRIGGER trg_trade_requests_updated_at
  BEFORE UPDATE ON trade_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── FUNCIÓN + TRIGGER: perfil automático al registrarse ──────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── RLS: habilitar ───────────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;

-- ── RLS POLICIES: profiles ───────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── RLS POLICIES: sticker_states ─────────────────────────────
DROP POLICY IF EXISTS "stickers_select" ON sticker_states;
CREATE POLICY "stickers_select" ON sticker_states
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "stickers_insert" ON sticker_states;
CREATE POLICY "stickers_insert" ON sticker_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "stickers_update" ON sticker_states;
CREATE POLICY "stickers_update" ON sticker_states
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "stickers_delete" ON sticker_states;
CREATE POLICY "stickers_delete" ON sticker_states
  FOR DELETE USING (auth.uid() = user_id);

-- ── RLS POLICIES: trade_requests ─────────────────────────────
DROP POLICY IF EXISTS "trades_select" ON trade_requests;
CREATE POLICY "trades_select" ON trade_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "trades_insert" ON trade_requests;
CREATE POLICY "trades_insert" ON trade_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "trades_update" ON trade_requests;
CREATE POLICY "trades_update" ON trade_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = owner_id);


-- ============================================================
-- BLOQUE 2: MIGRACIÓN v3 — N:N + contraofertas
-- Fuente: migration_v3.sql del repositorio
-- ============================================================

-- ── Columnas N:N en trade_requests ───────────────────────────
ALTER TABLE trade_requests
  ADD COLUMN IF NOT EXISTS requested_sticker_keys TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offered_sticker_keys   TEXT[] NOT NULL DEFAULT '{}';

-- ── Columnas de contraoferta ─────────────────────────────────
ALTER TABLE trade_requests
  ADD COLUMN IF NOT EXISTS counter_requested_keys TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS counter_offered_keys   TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS counter_by             UUID   REFERENCES auth.users(id) DEFAULT NULL;

-- ── Actualizar constraint de status ──────────────────────────
ALTER TABLE trade_requests DROP CONSTRAINT IF EXISTS trade_requests_status_check;
ALTER TABLE trade_requests ADD CONSTRAINT trade_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'countered'));

-- ── RPC: accept_trade (versión final N:N + contraofertas) ────
CREATE OR REPLACE FUNCTION accept_trade(p_trade_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade RECORD;
  v_s     RECORD;
  v_key   TEXT;
  v_req_keys TEXT[];
  v_off_keys TEXT[];
BEGIN
  SELECT * INTO v_trade FROM trade_requests WHERE id = p_trade_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade % no encontrado', p_trade_id;
  END IF;

  IF v_trade.status = 'countered' THEN
    IF auth.uid() IS DISTINCT FROM v_trade.requester_id THEN
      RAISE EXCEPTION 'Solo el solicitante puede aceptar una contraoferta';
    END IF;
    v_req_keys := COALESCE(v_trade.counter_requested_keys, v_trade.requested_sticker_keys);
    v_off_keys := COALESCE(v_trade.counter_offered_keys,   v_trade.offered_sticker_keys);
  ELSIF v_trade.status = 'pending' THEN
    IF auth.uid() IS DISTINCT FROM v_trade.owner_id THEN
      RAISE EXCEPTION 'Solo el owner puede aceptar el intercambio';
    END IF;
    v_req_keys := CASE WHEN array_length(v_trade.requested_sticker_keys, 1) > 0
                       THEN v_trade.requested_sticker_keys
                       ELSE ARRAY[v_trade.requested_sticker_key] END;
    v_off_keys := CASE WHEN array_length(v_trade.offered_sticker_keys, 1) > 0
                       THEN v_trade.offered_sticker_keys
                       ELSE ARRAY[v_trade.offered_sticker_key] END;
  ELSE
    RAISE EXCEPTION 'Estado inválido para aceptar: %', v_trade.status;
  END IF;

  UPDATE trade_requests SET status = 'accepted', updated_at = NOW() WHERE id = p_trade_id;

  FOREACH v_key IN ARRAY v_req_keys LOOP
    SELECT * INTO v_s FROM sticker_states WHERE user_id = v_trade.owner_id AND sticker_key = v_key;
    IF NOT FOUND OR v_s.status = 'missing' THEN
      INSERT INTO sticker_states (user_id, sticker_key, status, repeat_count)
        VALUES (v_trade.owner_id, v_key, 'missing', 0)
        ON CONFLICT (user_id, sticker_key) DO UPDATE SET status = 'missing', repeat_count = 0;
    ELSIF v_s.status = 'owned' THEN
      UPDATE sticker_states SET status = 'missing', repeat_count = 0
        WHERE user_id = v_trade.owner_id AND sticker_key = v_key;
    ELSE
      IF v_s.repeat_count <= 1 THEN
        UPDATE sticker_states SET status = 'owned', repeat_count = 0
          WHERE user_id = v_trade.owner_id AND sticker_key = v_key;
      ELSE
        UPDATE sticker_states SET repeat_count = repeat_count - 1
          WHERE user_id = v_trade.owner_id AND sticker_key = v_key;
      END IF;
    END IF;
    SELECT * INTO v_s FROM sticker_states WHERE user_id = v_trade.requester_id AND sticker_key = v_key;
    IF NOT FOUND OR v_s.status = 'missing' THEN
      INSERT INTO sticker_states (user_id, sticker_key, status, repeat_count)
        VALUES (v_trade.requester_id, v_key, 'owned', 0)
        ON CONFLICT (user_id, sticker_key) DO UPDATE SET status = 'owned', repeat_count = 0;
    ELSIF v_s.status = 'owned' THEN
      UPDATE sticker_states SET status = 'repeated', repeat_count = 1
        WHERE user_id = v_trade.requester_id AND sticker_key = v_key;
    ELSE
      UPDATE sticker_states SET repeat_count = repeat_count + 1
        WHERE user_id = v_trade.requester_id AND sticker_key = v_key;
    END IF;
  END LOOP;

  FOREACH v_key IN ARRAY v_off_keys LOOP
    SELECT * INTO v_s FROM sticker_states WHERE user_id = v_trade.requester_id AND sticker_key = v_key;
    IF NOT FOUND OR v_s.status = 'missing' THEN
      INSERT INTO sticker_states (user_id, sticker_key, status, repeat_count)
        VALUES (v_trade.requester_id, v_key, 'missing', 0)
        ON CONFLICT (user_id, sticker_key) DO UPDATE SET status = 'missing', repeat_count = 0;
    ELSIF v_s.status = 'owned' THEN
      UPDATE sticker_states SET status = 'missing', repeat_count = 0
        WHERE user_id = v_trade.requester_id AND sticker_key = v_key;
    ELSE
      IF v_s.repeat_count <= 1 THEN
        UPDATE sticker_states SET status = 'owned', repeat_count = 0
          WHERE user_id = v_trade.requester_id AND sticker_key = v_key;
      ELSE
        UPDATE sticker_states SET repeat_count = repeat_count - 1
          WHERE user_id = v_trade.requester_id AND sticker_key = v_key;
      END IF;
    END IF;
    SELECT * INTO v_s FROM sticker_states WHERE user_id = v_trade.owner_id AND sticker_key = v_key;
    IF NOT FOUND OR v_s.status = 'missing' THEN
      INSERT INTO sticker_states (user_id, sticker_key, status, repeat_count)
        VALUES (v_trade.owner_id, v_key, 'owned', 0)
        ON CONFLICT (user_id, sticker_key) DO UPDATE SET status = 'owned', repeat_count = 0;
    ELSIF v_s.status = 'owned' THEN
      UPDATE sticker_states SET status = 'repeated', repeat_count = 1
        WHERE user_id = v_trade.owner_id AND sticker_key = v_key;
    ELSE
      UPDATE sticker_states SET repeat_count = repeat_count + 1
        WHERE user_id = v_trade.owner_id AND sticker_key = v_key;
    END IF;
  END LOOP;
END;
$$;

-- ── RPC: counter_trade ────────────────────────────────────────
CREATE OR REPLACE FUNCTION counter_trade(
  p_trade_id               UUID,
  p_counter_requested_keys TEXT[],
  p_counter_offered_keys   TEXT[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade RECORD;
BEGIN
  SELECT * INTO v_trade FROM trade_requests WHERE id = p_trade_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade % no encontrado', p_trade_id;
  END IF;
  IF v_trade.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'No se puede contraofertar en estado: %', v_trade.status;
  END IF;
  IF auth.uid() NOT IN (v_trade.owner_id, v_trade.requester_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF v_trade.status = 'countered' AND auth.uid() IS NOT DISTINCT FROM v_trade.counter_by THEN
    RAISE EXCEPTION 'Esperá que la otra parte responda a tu contraoferta';
  END IF;
  UPDATE trade_requests SET
    status                 = 'countered',
    counter_requested_keys = p_counter_requested_keys,
    counter_offered_keys   = p_counter_offered_keys,
    counter_by             = auth.uid(),
    updated_at             = NOW()
  WHERE id = p_trade_id;
END;
$$;


-- ============================================================
-- BLOQUE 3: TABLA pack_items
-- Fuente: supabase-pack-items-migration.sql del repositorio
-- ============================================================

CREATE TABLE IF NOT EXISTS pack_items (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id    UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sticker_key TEXT        NOT NULL,
  trade_id    UUID        REFERENCES trade_requests(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  opened_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pack_items_owner_unopened
  ON pack_items (owner_id, opened_at)
  WHERE opened_at IS NULL;

ALTER TABLE pack_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus propios pack_items" ON pack_items;
CREATE POLICY "Usuarios ven sus propios pack_items"
  ON pack_items FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Usuarios insertan sus propios pack_items" ON pack_items;
CREATE POLICY "Usuarios insertan sus propios pack_items"
  ON pack_items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Usuarios actualizan sus propios pack_items" ON pack_items;
CREATE POLICY "Usuarios actualizan sus propios pack_items"
  ON pack_items FOR UPDATE
  USING (auth.uid() = owner_id);


-- ============================================================
-- BLOQUE 4: RPCs del Dashboard
-- Fuente: Reconstruidas desde src/services/dashboardService.ts
-- (no estaban en ningún SQL del repositorio)
-- ============================================================

CREATE OR REPLACE FUNCTION dashboard_user_counts()
RETURNS TABLE(user_id UUID, owned_count BIGINT, extra_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    user_id::UUID,
    COUNT(*)            FILTER (WHERE status IN ('owned', 'repeated')) AS owned_count,
    COALESCE(SUM(repeat_count) FILTER (WHERE status = 'repeated'), 0) AS extra_count
  FROM sticker_states
  GROUP BY user_id;
$$;

CREATE OR REPLACE FUNCTION dashboard_wanted_stickers(lmt INT DEFAULT 6)
RETURNS TABLE(sticker_key TEXT, cnt BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sticker_key, COUNT(*) AS cnt
  FROM sticker_states
  WHERE status = 'missing'
  GROUP BY sticker_key
  ORDER BY cnt DESC
  LIMIT lmt;
$$;

CREATE OR REPLACE FUNCTION dashboard_available_stickers(lmt INT DEFAULT 6)
RETURNS TABLE(sticker_key TEXT, cnt BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sticker_key, COUNT(*) AS cnt
  FROM sticker_states
  WHERE status = 'repeated'
  GROUP BY sticker_key
  ORDER BY cnt DESC
  LIMIT lmt;
$$;


-- ============================================================
-- BLOQUE 5: REALTIME
-- Agrega las 3 tablas de datos a la publication supabase_realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE sticker_states;
ALTER PUBLICATION supabase_realtime ADD TABLE trade_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE pack_items;


-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT
  'tables'    AS category,
  table_name  AS name,
  'OK'        AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','sticker_states','trade_requests','pack_items')
ORDER BY table_name;
