-- ============================================================
-- ALBUM MUNDIAL 2026 - Schema de base de datos
-- Ejecuta este SQL en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Sesiones de usuario (sin auth real)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Estado de cada figurita por sesión
CREATE TABLE IF NOT EXISTS sticker_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  sticker_key TEXT NOT NULL,           -- e.g. "ARG_0", "FWC1"
  status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('missing','owned','repeated')),
  repeat_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, sticker_key)
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_sticker_states_session ON sticker_states(session_id);
CREATE INDEX IF NOT EXISTS idx_sticker_states_key ON sticker_states(sticker_key);
CREATE INDEX IF NOT EXISTS idx_sticker_states_status ON sticker_states(status);
CREATE INDEX IF NOT EXISTS idx_sticker_states_key_status ON sticker_states(sticker_key, status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_states ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer todas las sesiones (para ver comunidad)
CREATE POLICY "sessions_read_all" ON sessions
  FOR SELECT USING (true);

-- Todos pueden crear su sesión
CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (true);

-- Actualizar solo la propia sesión (por session_id en cookie)
CREATE POLICY "sessions_update_own" ON sessions
  FOR UPDATE USING (true);

-- Todos pueden leer estados (para intercambios sociales)
CREATE POLICY "sticker_states_read_all" ON sticker_states
  FOR SELECT USING (true);

-- Insertar solo para sesión propia
CREATE POLICY "sticker_states_insert" ON sticker_states
  FOR INSERT WITH CHECK (true);

-- Actualizar solo propios
CREATE POLICY "sticker_states_update_own" ON sticker_states
  FOR UPDATE USING (true);

-- Eliminar solo propios
CREATE POLICY "sticker_states_delete_own" ON sticker_states
  FOR DELETE USING (true);

-- ============================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sticker_states_updated_at
  BEFORE UPDATE ON sticker_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- REALTIME: Habilitar para sincronización en vivo
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sticker_states;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- ============================================================
-- MERCADO DE INTERCAMBIO
-- ============================================================

CREATE TABLE IF NOT EXISTS trade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  owner_id     UUID REFERENCES sessions(id) ON DELETE CASCADE,
  requested_sticker_key TEXT NOT NULL,
  offered_sticker_key   TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_requests_owner     ON trade_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_requester ON trade_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status    ON trade_requests(status);

ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_read_all"   ON trade_requests FOR SELECT USING (true);
CREATE POLICY "trade_insert"     ON trade_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "trade_update_own" ON trade_requests FOR UPDATE USING (true);

CREATE OR REPLACE TRIGGER trigger_trade_requests_updated_at
  BEFORE UPDATE ON trade_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE trade_requests;
