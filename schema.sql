-- ============================================================
-- ALBUM MUNDIAL 2026 — Schema v2 (Supabase Auth)
--
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en el SQL Editor de Supabase.
-- 2. En Supabase Dashboard → Authentication → Settings:
--    Desactivar "Enable email confirmations" para registro inmediato.
-- ============================================================

-- ============================================================
-- RESET: Eliminar tablas existentes y datos anteriores
-- ============================================================
DROP TABLE IF EXISTS trade_requests  CASCADE;
DROP TABLE IF EXISTS sticker_states  CASCADE;
DROP TABLE IF EXISTS sessions        CASCADE;
DROP TABLE IF EXISTS profiles        CASCADE;

-- ============================================================
-- PROFILES: un registro por usuario autenticado
-- ============================================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STICKER STATES: vinculado al usuario de auth
-- ============================================================
CREATE TABLE sticker_states (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_key  TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'missing'
                         CHECK (status IN ('missing','owned','repeated')),
  repeat_count INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sticker_key)
);

CREATE INDEX idx_sticker_states_user   ON sticker_states(user_id);
CREATE INDEX idx_sticker_states_key    ON sticker_states(sticker_key);
CREATE INDEX idx_sticker_states_status ON sticker_states(status);

-- ============================================================
-- TRADE REQUESTS: mercado de intercambio
-- ============================================================
CREATE TABLE trade_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_sticker_key TEXT NOT NULL,
  offered_sticker_key   TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trade_requests_owner     ON trade_requests(owner_id);
CREATE INDEX idx_trade_requests_requester ON trade_requests(requester_id);
CREATE INDEX idx_trade_requests_status    ON trade_requests(status);

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sticker_states_updated_at
  BEFORE UPDATE ON sticker_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_trade_requests_updated_at
  BEFORE UPDATE ON trade_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: crear perfil automáticamente al registrarse
-- ============================================================
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: todos los autenticados pueden leer; solo propio para escribir
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Sticker states: todos los autenticados pueden leer (necesario para mercado)
CREATE POLICY "stickers_select" ON sticker_states
  FOR SELECT USING (auth.role() = 'authenticated');
-- Solo propio para escribir
CREATE POLICY "stickers_insert" ON sticker_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stickers_update" ON sticker_states
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stickers_delete" ON sticker_states
  FOR DELETE USING (auth.uid() = user_id);

-- Trade requests: solo las propias (como requester u owner)
CREATE POLICY "trades_select" ON trade_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);
-- Solo puede crear si es el requester
CREATE POLICY "trades_insert" ON trade_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
-- Ambas partes pueden actualizar estado (rechazar, cancelar; aceptar usa RPC)
CREATE POLICY "trades_update" ON trade_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- ============================================================
-- RPC: accept_trade — intercambio atómico (SECURITY DEFINER)
-- Ejecuta el swap de figuritas de ambos usuarios en una sola
-- transacción, bypasseando RLS. Solo el owner puede llamarla.
-- ============================================================
CREATE OR REPLACE FUNCTION accept_trade(p_trade_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade RECORD;
  v_s     RECORD;
BEGIN
  SELECT * INTO v_trade
    FROM trade_requests
   WHERE id = p_trade_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade % no encontrado o no está pendiente', p_trade_id;
  END IF;

  IF auth.uid() IS DISTINCT FROM v_trade.owner_id THEN
    RAISE EXCEPTION 'Solo el owner puede aceptar el intercambio';
  END IF;

  -- Marcar como aceptado
  UPDATE trade_requests SET status = 'accepted' WHERE id = p_trade_id;

  -- Owner pierde requested_sticker_key
  SELECT * INTO v_s FROM sticker_states
    WHERE user_id = v_trade.owner_id AND sticker_key = v_trade.requested_sticker_key;
  IF NOT FOUND OR v_s.status = 'missing' THEN
    INSERT INTO sticker_states (user_id, sticker_key, status, repeat_count)
      VALUES (v_trade.owner_id, v_trade.requested_sticker_key, 'missing', 0)
      ON CONFLICT (user_id, sticker_key) DO UPDATE SET status = 'missing', repeat_count = 0;
  ELSIF v_s.status = 'owned' THEN
    UPDATE sticker_states SET status = 'missing', repeat_count = 0
      WHERE user_id = v_trade.owner_id AND sticker_key = v_trade.requested_sticker_key;
  ELSE
    IF v_s.repeat_count <= 1 THEN
      UPDATE sticker_states SET status = 'owned', repeat_count = 0
        WHERE user_id = v_trade.owner_id AND sticker_key = v_trade.requested_sticker_key;
    ELSE
      UPDATE sticker_states SET repeat_count = repeat_count - 1
        WHERE user_id = v_trade.owner_id AND sticker_key = v_trade.requested_sticker_key;
    END IF;
  END IF;

  -- Requester gana requested_sticker_key
  SELECT * INTO v_s FROM sticker_states
    WHERE user_id = v_trade.requester_id AND sticker_key = v_trade.requested_sticker_key;
  IF NOT FOUND OR v_s.status = 'missing' THEN
    INSERT INTO sticker_states (user_id, sticker_key, status, repeat_count)
      VALUES (v_trade.requester_id, v_trade.requested_sticker_key, 'owned', 0)
      ON CONFLICT (user_id, sticker_key) DO UPDATE SET status = 'owned', repeat_count = 0;
  ELSIF v_s.status = 'owned' THEN
    UPDATE sticker_states SET status = 'repeated', repeat_count = 1
      WHERE user_id = v_trade.requester_id AND sticker_key = v_trade.requested_sticker_key;
  ELSE
    UPDATE sticker_states SET repeat_count = repeat_count + 1
      WHERE user_id = v_trade.requester_id AND sticker_key = v_trade.requested_sticker_key;
  END IF;

  -- Requester pierde offered_sticker_key
  SELECT * INTO v_s FROM sticker_states
    WHERE user_id = v_trade.requester_id AND sticker_key = v_trade.offered_sticker_key;
  IF NOT FOUND OR v_s.status = 'missing' THEN
    INSERT INTO sticker_states (user_id, sticker_key, status, repeat_count)
      VALUES (v_trade.requester_id, v_trade.offered_sticker_key, 'missing', 0)
      ON CONFLICT (user_id, sticker_key) DO UPDATE SET status = 'missing', repeat_count = 0;
  ELSIF v_s.status = 'owned' THEN
    UPDATE sticker_states SET status = 'missing', repeat_count = 0
      WHERE user_id = v_trade.requester_id AND sticker_key = v_trade.offered_sticker_key;
  ELSE
    IF v_s.repeat_count <= 1 THEN
      UPDATE sticker_states SET status = 'owned', repeat_count = 0
        WHERE user_id = v_trade.requester_id AND sticker_key = v_trade.offered_sticker_key;
    ELSE
      UPDATE sticker_states SET repeat_count = repeat_count - 1
        WHERE user_id = v_trade.requester_id AND sticker_key = v_trade.offered_sticker_key;
    END IF;
  END IF;

  -- Owner gana offered_sticker_key
  SELECT * INTO v_s FROM sticker_states
    WHERE user_id = v_trade.owner_id AND sticker_key = v_trade.offered_sticker_key;
  IF NOT FOUND OR v_s.status = 'missing' THEN
    INSERT INTO sticker_states (user_id, sticker_key, status, repeat_count)
      VALUES (v_trade.owner_id, v_trade.offered_sticker_key, 'owned', 0)
      ON CONFLICT (user_id, sticker_key) DO UPDATE SET status = 'owned', repeat_count = 0;
  ELSIF v_s.status = 'owned' THEN
    UPDATE sticker_states SET status = 'repeated', repeat_count = 1
      WHERE user_id = v_trade.owner_id AND sticker_key = v_trade.offered_sticker_key;
  ELSE
    UPDATE sticker_states SET repeat_count = repeat_count + 1
      WHERE user_id = v_trade.owner_id AND sticker_key = v_trade.offered_sticker_key;
  END IF;
END;
$$;

-- ============================================================
-- REALTIME: sincronización en tiempo real
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sticker_states;
ALTER PUBLICATION supabase_realtime ADD TABLE trade_requests;
