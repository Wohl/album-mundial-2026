-- ============================================================
-- Quiniela Mundial 2026 — Seed Data
-- Sprint 6A — Pool Global Inicial
--
-- INSTRUCCIONES:
--   1. Ejecutar DESPUÉS de quiniela_schema_v1.sql
--   2. El UUID generado por este INSERT es el GLOBAL_POOL_ID.
--   3. Copiar el UUID y agregarlo en:
--      - .env.local:  NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID=<uuid>
--      - Vercel:      NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID=<uuid>
--
-- IDEMPOTENCIA:
--   ON CONFLICT DO NOTHING — seguro re-ejecutar sin duplicados.
-- ============================================================


-- ── Insertar pool global ─────────────────────────────────────────────
-- Si ya existe una pool global activa, no hace nada.

INSERT INTO pools (name, type, invite_code, created_by, is_active, settings)
SELECT
  'Mundial 2026 Global',
  'global',
  NULL,          -- sin invite_code (pool abierta)
  NULL,          -- sin propietario (sistema)
  true,
  jsonb_build_object(
    'scoring_variant', 'balanced',   -- Sistema B del QUINIELA_SCORING_PROPOSAL.md
    'season',          '2026',
    'created_by',      'system'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM pools WHERE type = 'global' AND is_active = true
);

-- ── Verificar creación y obtener el UUID ─────────────────────────────
-- Copiar el valor de la columna 'id' para usar como GLOBAL_POOL_ID

SELECT id, name, type, is_active, created_at
FROM pools
WHERE type = 'global' AND is_active = true
ORDER BY created_at ASC
LIMIT 1;

-- ── Instrucciones post-ejecución ─────────────────────────────────────
-- El resultado de la query anterior muestra el UUID de la pool global.
-- Ejemplo de salida:
--   id                                   | name                  | type   | is_active
--   -------------------------------------+-----------------------+--------+----------
--   a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Mundial 2026 Global   | global | true
--
-- Agregar en .env.local:
--   NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
--
-- Agregar en Vercel (Production + Preview):
--   NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
