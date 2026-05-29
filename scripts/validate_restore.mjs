/**
 * validate_restore.mjs
 * Validación completa post-restauración usando solo la publishable key.
 * Verifica: tablas, policies, funciones, realtime, auth flow.
 *
 * USO (después de ejecutar restore_complete.sql):
 *   node scripts/validate_restore.mjs
 *
 * O con token para validación profunda de schema:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/validate_restore.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hngymqusifirjurlyacv.supabase.co'
const SUPABASE_KEY = 'sb_publishable_kMkzEUFMiBIfEcTJ12x7Ag_rThzpPLt'
const PROJECT_REF  = 'hngymqusifirjurlyacv'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

let passed = 0
let failed = 0
const issues = []
const log = []

function ok(label, detail = '') {
  passed++
  const msg = `  ✅ ${label}${detail ? ` — ${detail}` : ''}`
  console.log(msg)
  log.push({ status: 'PASS', label, detail })
}

function fail(label, detail = '') {
  failed++
  const msg = `  ❌ ${label}${detail ? ` — ${detail}` : ''}`
  console.error(msg)
  issues.push({ label, detail })
  log.push({ status: 'FAIL', label, detail })
}

function warn(label, detail = '') {
  const msg = `  ⚠️  ${label}${detail ? ` — ${detail}` : ''}`
  console.warn(msg)
  log.push({ status: 'WARN', label, detail })
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(60))
  log.push({ section: title })
}

// ── Management API helper (only if token provided) ──────────
async function mgmtQuery(sql) {
  if (!ACCESS_TOKEN) return null
  const resp = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  if (!resp.ok) return null
  return resp.json()
}

// ── Generate test credentials ───────────────────────────────
const ts   = Date.now()
const email1 = `test_user1_${ts}@albumtest.dev`
const email2 = `test_user2_${ts}@albumtest.dev`
const pass   = 'TestPass_2026!'
const name1  = `TestUser1_${ts}`
const name2  = `TestUser2_${ts}`

async function main() {
  console.log('🔍 Album Mundial 2026 — Validación de restauración')
  console.log(`   Proyecto: ${PROJECT_REF}`)
  console.log(`   Fecha: ${new Date().toISOString()}`)
  if (ACCESS_TOKEN) console.log('   Modo: Schema + Funcional (con access token)')
  else              console.log('   Modo: Funcional solo (sin access token)')

  // ── 1. Schema validation via Management API ─────────────
  if (ACCESS_TOKEN) {
    section('1. Validación de schema (Management API)')

    const tables = await mgmtQuery(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('profiles','sticker_states','trade_requests','pack_items')
      ORDER BY table_name
    `)
    const tableNames = (tables ?? []).map(r => r.table_name)
    for (const t of ['pack_items', 'profiles', 'sticker_states', 'trade_requests']) {
      if (tableNames.includes(t)) ok(`Tabla ${t} existe`)
      else fail(`Tabla ${t} NO existe`)
    }

    const policies = await mgmtQuery(`
      SELECT tablename, COUNT(*) AS cnt FROM pg_policies
      WHERE schemaname = 'public' GROUP BY tablename ORDER BY tablename
    `)
    const policyMap = Object.fromEntries((policies ?? []).map(r => [r.tablename, Number(r.cnt)]))
    const expected = { profiles: 2, sticker_states: 4, trade_requests: 3, pack_items: 3 }
    for (const [t, n] of Object.entries(expected)) {
      const actual = policyMap[t] ?? 0
      if (actual === n) ok(`${t}: ${n} RLS policies`)
      else fail(`${t}: esperadas ${n} policies, encontradas ${actual}`)
    }

    const triggers = await mgmtQuery(`
      SELECT trigger_name FROM information_schema.triggers
      WHERE trigger_schema IN ('public') OR event_object_schema = 'auth'
      ORDER BY trigger_name
    `)
    const trigNames = (triggers ?? []).map(r => r.trigger_name)
    const expectedTriggers = [
      'on_auth_user_created',
      'trg_profiles_updated_at',
      'trg_sticker_states_updated_at',
      'trg_trade_requests_updated_at',
    ]
    for (const t of expectedTriggers) {
      if (trigNames.includes(t)) ok(`Trigger ${t}`)
      else fail(`Trigger ${t} NO encontrado`)
    }

    const fns = await mgmtQuery(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `)
    const fnNames = (fns ?? []).map(r => r.routine_name)
    const expectedFns = [
      'accept_trade', 'counter_trade',
      'dashboard_available_stickers', 'dashboard_user_counts', 'dashboard_wanted_stickers',
      'handle_new_user', 'update_updated_at_column',
    ]
    for (const f of expectedFns) {
      if (fnNames.includes(f)) ok(`Función ${f}()`)
      else fail(`Función ${f}() NO encontrada`)
    }

    const rt = await mgmtQuery(`
      SELECT tablename FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' ORDER BY tablename
    `)
    const rtNames = (rt ?? []).map(r => r.tablename)
    for (const t of ['pack_items', 'sticker_states', 'trade_requests']) {
      if (rtNames.includes(t)) ok(`Realtime habilitado en ${t}`)
      else fail(`Realtime NO habilitado en ${t}`)
    }

    // Column check on trade_requests (v3 columns)
    const cols = await mgmtQuery(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'trade_requests' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    const colNames = (cols ?? []).map(r => r.column_name)
    for (const c of ['requested_sticker_keys','offered_sticker_keys','counter_requested_keys','counter_offered_keys','counter_by']) {
      if (colNames.includes(c)) ok(`trade_requests.${c} existe`)
      else fail(`trade_requests.${c} NO existe`)
    }
  }

  // ── 2. Connectivity test ────────────────────────────────
  section('2. Conectividad básica con publishable key')

  const tables = ['profiles', 'sticker_states', 'trade_requests', 'pack_items']
  for (const t of tables) {
    const { error } = await supabase.from(t).select('count').limit(1).single()
    if (!error || error.code === 'PGRST116') {
      ok(`Tabla ${t} accesible vía REST`)
    } else if (error.code === 'PGRST205') {
      fail(`Tabla ${t} NO existe aún`)
    } else {
      warn(`Tabla ${t}: respuesta inesperada — ${error.message}`)
    }
  }

  // ── 3. Auth: registrar usuarios de prueba ───────────────
  section('3. Auth — Registro y login')

  let user1Id, user2Id, session1, session2

  const { data: reg1, error: regErr1 } = await supabase.auth.signUp({
    email: email1, password: pass,
    options: { data: { display_name: name1 } },
  })
  if (!regErr1 && reg1.user) {
    ok(`Registro usuario 1 (${email1})`)
    user1Id = reg1.user.id
    session1 = reg1.session
  } else {
    fail(`Registro usuario 1`, regErr1?.message ?? 'sin usuario devuelto')
  }

  const { data: reg2, error: regErr2 } = await supabase.auth.signUp({
    email: email2, password: pass,
    options: { data: { display_name: name2 } },
  })
  if (!regErr2 && reg2.user) {
    ok(`Registro usuario 2 (${email2})`)
    user2Id = reg2.user.id
    session2 = reg2.session
  } else {
    fail(`Registro usuario 2`, regErr2?.message ?? 'sin usuario devuelto')
  }

  // ── 4. Trigger: perfil automático ─────────────────────
  section('4. Trigger — Creación automática de perfil')

  if (user1Id) {
    await new Promise(r => setTimeout(r, 800))
    const { data: prof1, error: profErr1 } = await supabase
      .from('profiles').select('id, display_name').eq('id', user1Id).single()
    if (!profErr1 && prof1) {
      ok(`Perfil usuario 1 creado automáticamente`)
      if (prof1.display_name === name1) ok(`display_name correcto: "${prof1.display_name}"`)
      else warn(`display_name inesperado: "${prof1.display_name}" (esperado "${name1}")`)
    } else {
      fail(`Perfil usuario 1 NO creado`, profErr1?.message)
    }
  }

  if (user2Id) {
    const { data: prof2, error: profErr2 } = await supabase
      .from('profiles').select('id, display_name').eq('id', user2Id).single()
    if (!profErr2 && prof2) ok(`Perfil usuario 2 creado automáticamente`)
    else fail(`Perfil usuario 2 NO creado`, profErr2?.message)
  }

  // ── 5. Sticker states ─────────────────────────────────
  section('5. Sticker states — CRUD')

  if (session1 && user1Id) {
    const client1 = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${session1.access_token}` } }
    })

    const { error: insErr } = await client1.from('sticker_states')
      .upsert([{ user_id: user1Id, sticker_key: 'ARG-01', status: 'owned', repeat_count: 0 }],
               { onConflict: 'user_id,sticker_key' })
    if (!insErr) ok('INSERT sticker_state (ARG-01 = owned)')
    else fail('INSERT sticker_state', insErr.message)

    const { error: updErr } = await client1.from('sticker_states')
      .update({ status: 'repeated', repeat_count: 2 })
      .eq('user_id', user1Id).eq('sticker_key', 'ARG-01')
    if (!updErr) ok('UPDATE sticker_state (repeated, repeat_count=2)')
    else fail('UPDATE sticker_state', updErr.message)

    const { data: ss, error: selErr } = await client1.from('sticker_states')
      .select().eq('user_id', user1Id).eq('sticker_key', 'ARG-01').single()
    if (!selErr && ss?.status === 'repeated' && ss?.repeat_count === 2)
      ok('SELECT sticker_state — datos correctos')
    else
      fail('SELECT sticker_state', selErr?.message ?? `status=${ss?.status}`)
  } else {
    warn('Sticker tests omitidos — sin sesión de usuario 1')
  }

  // ── 6. Trade requests ────────────────────────────────
  section('6. Trade requests — Creación y RPC accept_trade')

  let tradeId
  if (session1 && session2 && user1Id && user2Id) {
    const client1 = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${session1.access_token}` } }
    })
    const client2 = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${session2.access_token}` } }
    })

    // user2 tiene figurita que user1 quiere, user1 tiene figurita que user2 quiere
    await client2.from('sticker_states')
      .upsert([{ user_id: user2Id, sticker_key: 'BRA-01', status: 'repeated', repeat_count: 1 }],
               { onConflict: 'user_id,sticker_key' })
    await client1.from('sticker_states')
      .upsert([{ user_id: user1Id, sticker_key: 'GER-01', status: 'repeated', repeat_count: 1 }],
               { onConflict: 'user_id,sticker_key' })

    // user1 solicita BRA-01 de user2, ofrece GER-01
    const { data: trade, error: tradeErr } = await client1.from('trade_requests').insert({
      requester_id: user1Id,
      owner_id: user2Id,
      requested_sticker_key: 'BRA-01',
      offered_sticker_key: 'GER-01',
      requested_sticker_keys: ['BRA-01'],
      offered_sticker_keys: ['GER-01'],
    }).select().single()

    if (!tradeErr && trade) {
      ok(`Trade request creado (id: ${trade.id.slice(0,8)}...)`)
      tradeId = trade.id

      // user2 acepta el trade (RPC accept_trade)
      const { error: acceptErr } = await client2.rpc('accept_trade', { p_trade_id: tradeId })
      if (!acceptErr) {
        ok('RPC accept_trade() ejecutada correctamente')

        // Verificar que el trade quedó accepted
        const { data: updatedTrade } = await client1.from('trade_requests')
          .select('status').eq('id', tradeId).single()
        if (updatedTrade?.status === 'accepted') ok('Trade status = accepted')
        else fail('Trade status no cambió a accepted', `actual: ${updatedTrade?.status}`)
      } else {
        fail('RPC accept_trade()', acceptErr.message)
      }
    } else {
      fail('Crear trade request', tradeErr?.message)
    }

    // counter_trade test
    section('7. Counter-offer — RPC counter_trade')
    const { data: trade2, error: trade2Err } = await client1.from('trade_requests').insert({
      requester_id: user1Id,
      owner_id: user2Id,
      requested_sticker_key: 'FRA-01',
      offered_sticker_key: 'ESP-01',
      requested_sticker_keys: ['FRA-01'],
      offered_sticker_keys: ['ESP-01'],
    }).select().single()

    if (!trade2Err && trade2) {
      const { error: counterErr } = await client2.rpc('counter_trade', {
        p_trade_id: trade2.id,
        p_counter_requested_keys: ['FRA-01'],
        p_counter_offered_keys: ['ITA-01'],
      })
      if (!counterErr) ok('RPC counter_trade() ejecutada correctamente')
      else fail('RPC counter_trade()', counterErr.message)

      const { data: ct } = await client1.from('trade_requests')
        .select('status, counter_by').eq('id', trade2.id).single()
      if (ct?.status === 'countered') ok('Trade status = countered')
      else fail('Trade status no cambió a countered', `actual: ${ct?.status}`)
    } else {
      warn('Counter-offer test omitido', trade2Err?.message)
    }
  } else {
    warn('Trade tests omitidos — sin sesiones de usuarios')
  }

  // ── 7. Pack items ────────────────────────────────────
  section('8. Pack items')

  if (session1 && user1Id && tradeId) {
    const client1 = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${session1.access_token}` } }
    })

    const { error: packErr } = await client1.from('pack_items').insert({
      owner_id: user1Id,
      sticker_key: 'BRA-01',
      trade_id: tradeId,
    })
    if (!packErr) ok('INSERT pack_item creado correctamente')
    else fail('INSERT pack_item', packErr.message)

    const { data: packs } = await client1.from('pack_items')
      .select().eq('owner_id', user1Id).is('opened_at', null)
    if (packs?.length > 0) ok(`SELECT pack_items sin abrir: ${packs.length}`)
    else fail('No se encontraron pack_items sin abrir')

    const { error: openErr } = await client1.from('pack_items')
      .update({ opened_at: new Date().toISOString() }).eq('owner_id', user1Id)
    if (!openErr) ok('UPDATE pack_item.opened_at (marcar como abierto)')
    else fail('UPDATE pack_item', openErr.message)
  } else {
    warn('Pack items test omitido — sin sesión o trade_id')
  }

  // ── 8. Dashboard RPCs ────────────────────────────────
  section('9. Dashboard RPCs')

  if (session1) {
    const client1 = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${session1.access_token}` } }
    })

    const { data: counts, error: cErr } = await client1.rpc('dashboard_user_counts')
    if (!cErr) ok(`dashboard_user_counts() → ${counts?.length ?? 0} filas`)
    else fail('dashboard_user_counts()', cErr.message)

    const { data: wanted, error: wErr } = await client1.rpc('dashboard_wanted_stickers', { lmt: 3 })
    if (!wErr) ok(`dashboard_wanted_stickers(3) → ${wanted?.length ?? 0} filas`)
    else fail('dashboard_wanted_stickers()', wErr.message)

    const { data: avail, error: aErr } = await client1.rpc('dashboard_available_stickers', { lmt: 3 })
    if (!aErr) ok(`dashboard_available_stickers(3) → ${avail?.length ?? 0} filas`)
    else fail('dashboard_available_stickers()', aErr.message)
  } else {
    warn('Dashboard RPC tests omitidos — sin sesión')
  }

  // ── Summary ──────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log(`  RESULTADO FINAL`)
  console.log('═'.repeat(60))
  console.log(`  ✅ Pasaron: ${passed}`)
  console.log(`  ❌ Fallaron: ${failed}`)
  if (issues.length > 0) {
    console.log('\n  Problemas encontrados:')
    issues.forEach(i => console.log(`    • ${i.label}${i.detail ? ': ' + i.detail : ''}`))
  }
  console.log('═'.repeat(60))

  // Write report data for RESTORATION_REPORT.md
  const reportData = {
    timestamp: new Date().toISOString(),
    project: PROJECT_REF,
    passed,
    failed,
    issues,
    log,
  }
  const { writeFileSync } = await import('fs')
  writeFileSync(
    new URL('../validation_results.json', import.meta.url),
    JSON.stringify(reportData, null, 2)
  )
  console.log('\n  📄 Resultados guardados en: validation_results.json')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('❌ Error inesperado en validación:', err.message)
  process.exit(1)
})
