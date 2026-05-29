/**
 * execute_restore.mjs
 * Ejecuta restore_complete.sql contra el nuevo proyecto Supabase
 * usando la Management API de Supabase.
 *
 * USO:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxxx node scripts/execute_restore.mjs
 *
 * El token se obtiene en: https://supabase.com/dashboard/account/tokens
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'hngymqusifirjurlyacv'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!ACCESS_TOKEN) {
  console.error('❌ Falta SUPABASE_ACCESS_TOKEN')
  console.error('   Obtenelo en: https://supabase.com/dashboard/account/tokens')
  console.error('   Luego ejecuta: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/execute_restore.mjs')
  process.exit(1)
}

const SQL_FILE = join(__dir, '..', 'restore_complete.sql')
const fullSql = readFileSync(SQL_FILE, 'utf8')

// Split en bloques separados por comentario de bloque para ejecución incremental
const BLOCK_MARKERS = [
  { name: 'BLOQUE 1 — Schema base (profiles, sticker_states, trade_requests, triggers, RLS)', marker: '-- BLOQUE 1:' },
  { name: 'BLOQUE 2 — Migración v3 (N:N + contraofertas + RPCs)', marker: '-- BLOQUE 2:' },
  { name: 'BLOQUE 3 — pack_items', marker: '-- BLOQUE 3:' },
  { name: 'BLOQUE 4 — RPCs del Dashboard', marker: '-- BLOQUE 4:' },
  { name: 'BLOQUE 5 — Realtime publication', marker: '-- BLOQUE 5:' },
  { name: 'VERIFICACIÓN FINAL', marker: '-- VERIFICACIÓN FINAL' },
]

async function execSQL(sql, label) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await resp.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }

  return { ok: resp.ok, status: resp.status, body }
}

function splitBlocks(sql) {
  // Execute the full SQL as one transaction for atomicity
  // But we also want per-block feedback, so split on the BLOQUE markers
  const blocks = []
  const lines = sql.split('\n')
  let current = { name: 'Pre-amble', lines: [] }

  for (const line of lines) {
    const marker = BLOCK_MARKERS.find(b => line.includes(b.marker))
    if (marker) {
      if (current.lines.some(l => l.trim() && !l.startsWith('--'))) {
        blocks.push(current)
      }
      current = { name: marker.name, lines: [line] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.some(l => l.trim() && !l.startsWith('--'))) {
    blocks.push(current)
  }
  return blocks
}

async function main() {
  console.log('🚀 Album Mundial 2026 — Restauración de base de datos')
  console.log(`   Proyecto: ${PROJECT_REF}`)
  console.log('')

  // First, verify token is valid
  const ping = await execSQL('SELECT current_database(), current_user', 'connectivity test')
  if (!ping.ok) {
    console.error('❌ No se pudo conectar a Supabase Management API')
    console.error(`   Status: ${ping.status}`)
    console.error(`   Error: ${JSON.stringify(ping.body)}`)
    if (ping.status === 401) {
      console.error('   El token es inválido o expiró. Genero uno nuevo en:')
      console.error('   https://supabase.com/dashboard/account/tokens')
    }
    process.exit(1)
  }
  console.log('✅ Conectado a Supabase Management API')
  console.log(`   DB: ${ping.body?.[0]?.current_database ?? 'postgres'}`)
  console.log('')

  // Execute the full SQL in one go for atomicity
  console.log('⏳ Ejecutando restore_complete.sql...')
  const result = await execSQL(fullSql, 'restore_complete.sql')

  if (!result.ok) {
    console.error('❌ ERROR durante la ejecución')
    console.error(`   Status HTTP: ${result.status}`)
    const err = result.body
    if (err?.message) console.error(`   Mensaje: ${err.message}`)
    if (err?.code)    console.error(`   Código: ${err.code}`)
    if (err?.hint)    console.error(`   Hint: ${err.hint}`)
    if (err?.detail)  console.error(`   Detalle: ${err.detail}`)
    console.error('')
    console.error('⚠️  La ejecución fue detenida. No se realizaron cambios destructivos.')
    console.error('   Revisa el error, corrige si es necesario, y vuelve a ejecutar.')
    process.exit(1)
  }

  console.log('✅ SQL ejecutado exitosamente')
  console.log('')

  // Show verification results
  const verifySQL = `
    SELECT
      t.table_name,
      (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.table_name) AS policy_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_name IN ('profiles','sticker_states','trade_requests','pack_items')
    ORDER BY t.table_name;
  `
  const verify = await execSQL(verifySQL, 'verification')
  if (verify.ok && Array.isArray(verify.body)) {
    console.log('📋 Tablas creadas:')
    verify.body.forEach(row => {
      console.log(`   ✅ ${row.table_name} (${row.policy_count} policies)`)
    })

    if (verify.body.length < 4) {
      const found = verify.body.map(r => r.table_name)
      const expected = ['profiles', 'sticker_states', 'trade_requests', 'pack_items']
      const missing = expected.filter(t => !found.includes(t))
      console.error(`\n⚠️  Faltan tablas: ${missing.join(', ')}`)
    }
  }
  console.log('')

  // Verify functions
  const fnSQL = `
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    ORDER BY routine_name;
  `
  const fns = await execSQL(fnSQL, 'functions check')
  if (fns.ok && Array.isArray(fns.body)) {
    console.log('⚙️  Funciones/RPCs creadas:')
    fns.body.forEach(row => console.log(`   ✅ ${row.routine_name}()`))
  }
  console.log('')

  // Verify realtime
  const rtSQL = `
    SELECT tablename FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    ORDER BY tablename;
  `
  const rt = await execSQL(rtSQL, 'realtime check')
  if (rt.ok && Array.isArray(rt.body)) {
    console.log('📡 Realtime habilitado en:')
    rt.body.forEach(row => console.log(`   ✅ ${row.tablename}`))
  }
  console.log('')
  console.log('🎉 Restauración completada. Ejecuta validate_restore.mjs para validación funcional.')
}

main().catch(err => {
  console.error('❌ Error inesperado:', err.message)
  process.exit(1)
})
