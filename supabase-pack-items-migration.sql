-- ──────────────────────────────────────────────────────────────────
-- Migración: pack_items — sobres acumulativos de intercambios
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pack_items (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id    uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sticker_key text        NOT NULL,
  trade_id    uuid        REFERENCES trade_requests(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  opened_at   timestamptz
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS pack_items_owner_unopened
  ON pack_items (owner_id, opened_at)
  WHERE opened_at IS NULL;

-- Row Level Security
ALTER TABLE pack_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios pack_items"
  ON pack_items FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Usuarios insertan sus propios pack_items"
  ON pack_items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Usuarios actualizan sus propios pack_items"
  ON pack_items FOR UPDATE
  USING (auth.uid() = owner_id);

-- Verificar
SELECT 'pack_items creada correctamente' AS status;
