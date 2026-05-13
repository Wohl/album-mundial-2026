-- ============================================================
-- ALBUM MUNDIAL 2026 — Migration v3: N:N Trades + Counter-offers
--
-- INSTRUCCIONES:
-- Ejecutá este script en el SQL Editor de Supabase.
-- NO borra datos — solo añade columnas y reemplaza las RPCs.
-- ============================================================

-- 1. Soporte N:N: arrays de figuritas por intercambio
ALTER TABLE trade_requests
  ADD COLUMN IF NOT EXISTS requested_sticker_keys TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offered_sticker_keys   TEXT[] NOT NULL DEFAULT '{}';

-- 2. Migrar intercambios existentes (campo individual → array)
UPDATE trade_requests
SET
  requested_sticker_keys = ARRAY[requested_sticker_key],
  offered_sticker_keys   = ARRAY[offered_sticker_key]
WHERE
  array_length(requested_sticker_keys, 1) IS NULL
  AND requested_sticker_key IS NOT NULL
  AND requested_sticker_key <> '';

-- 3. Soporte para contraofertas
ALTER TABLE trade_requests
  ADD COLUMN IF NOT EXISTS counter_requested_keys TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS counter_offered_keys   TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS counter_by             UUID   REFERENCES auth.users(id) DEFAULT NULL;

-- 4. Agregar 'countered' al constraint de status
ALTER TABLE trade_requests DROP CONSTRAINT IF EXISTS trade_requests_status_check;
ALTER TABLE trade_requests ADD CONSTRAINT trade_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'countered'));

-- 5. Reemplazar accept_trade para soportar N:N y contraofertas
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

  -- Determinar quién acepta y qué figuritas usar
  IF v_trade.status = 'countered' THEN
    -- El solicitante original acepta la contraoferta
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

  -- Marcar como aceptado
  UPDATE trade_requests SET status = 'accepted', updated_at = NOW() WHERE id = p_trade_id;

  -- Owner entrega stickers al requester
  FOREACH v_key IN ARRAY v_req_keys LOOP
    -- Owner pierde v_key
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
    -- Requester gana v_key
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

  -- Requester entrega stickers al owner
  FOREACH v_key IN ARRAY v_off_keys LOOP
    -- Requester pierde v_key
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
    -- Owner gana v_key
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

-- 6. Nueva RPC: contraofertar un intercambio
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
  -- No puede contraofertar quien hizo la última contraoferta
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
