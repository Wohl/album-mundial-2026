import { writeFileSync } from 'fs'

const URL  = 'https://hngymqusifirjurlyacv.supabase.co'
const PAT  = process.env.SUPABASE_ACCESS_TOKEN
const PUB  = 'sb_publishable_kMkzEUFMiBIfEcTJ12x7Ag_rThzpPLt'
const ts   = Date.now()
const pass = 'TestPass_2026!'

const results = { pass: 0, fail: 0, details: [] }

function ok(label, info = '') {
  results.pass++
  results.details.push({ status: 'PASS', label, info })
  console.log(`  PASS: ${label}${info ? ' — ' + info : ''}`)
}
function fail(label, info = '') {
  results.fail++
  results.details.push({ status: 'FAIL', label, info })
  console.error(`  FAIL: ${label}${info ? ' — ' + info : ''}`)
}
function section(t) { console.log('\n--- ' + t + ' ---') }

async function mgmt(sql) {
  const r = await fetch('https://api.supabase.com/v1/projects/hngymqusifirjurlyacv/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  })
  return r.json()
}

// Get service_role key
const keysResp = await fetch('https://api.supabase.com/v1/projects/hngymqusifirjurlyacv/api-keys', {
  headers: { Authorization: `Bearer ${PAT}` }
})
const keys = await keysResp.json()
const SVC = keys.find(k => k.name === 'service_role')?.api_key
if (!SVC) { console.error('Cannot get service_role key'); process.exit(1) }

const adminHdrs = { Authorization: `Bearer ${SVC}`, apikey: SVC, 'Content-Type': 'application/json' }

// ── A. Create test users via admin ──────────────────────────
section('A. Crear usuarios de prueba (admin API, email_confirm=true)')
const [r1, r2] = await Promise.all([
  fetch(`${URL}/auth/v1/admin/users`, { method: 'POST', headers: adminHdrs,
    body: JSON.stringify({ email: `val1_${ts}@example.com`, password: pass, email_confirm: true, user_metadata: { display_name: `ValUser1_${ts}` } }) }).then(r => r.json()),
  fetch(`${URL}/auth/v1/admin/users`, { method: 'POST', headers: adminHdrs,
    body: JSON.stringify({ email: `val2_${ts}@example.com`, password: pass, email_confirm: true, user_metadata: { display_name: `ValUser2_${ts}` } }) }).then(r => r.json()),
])
const u1id = r1.id, u2id = r2.id
if (u1id) ok('Admin create user1', r1.email)
else fail('Admin create user1', JSON.stringify(r1))
if (u2id) ok('Admin create user2', r2.email)
else fail('Admin create user2', JSON.stringify(r2))

// ── B. Trigger: profile auto-created ────────────────────────
section('B. Trigger on_auth_user_created -> profile auto-creado')
await new Promise(r => setTimeout(r, 1500))
const profRows = await mgmt(`SELECT id, display_name FROM profiles WHERE id IN ('${u1id}','${u2id}') ORDER BY created_at`)
if (Array.isArray(profRows) && profRows.length === 2) {
  ok('2 perfiles creados automaticamente por trigger')
  for (const p of profRows) {
    const exp = p.id === u1id ? `ValUser1_${ts}` : `ValUser2_${ts}`
    if (p.display_name === exp) ok(`display_name correcto: "${p.display_name}"`)
    else fail(`display_name incorrecto: "${p.display_name}" (esperado "${exp}")`)
  }
} else fail('Perfiles auto-creados', `encontrados ${Array.isArray(profRows) ? profRows.length : JSON.stringify(profRows)}`)

// ── C. Login with password ───────────────────────────────────
section('C. Auth signInWithPassword')
const [l1, l2] = await Promise.all([
  fetch(`${URL}/auth/v1/token?grant_type=password`, { method: 'POST',
    headers: { apikey: PUB, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `val1_${ts}@example.com`, password: pass }) }).then(r => r.json()),
  fetch(`${URL}/auth/v1/token?grant_type=password`, { method: 'POST',
    headers: { apikey: PUB, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `val2_${ts}@example.com`, password: pass }) }).then(r => r.json()),
])
const tok1 = l1.access_token, tok2 = l2.access_token
if (tok1) ok('User1 signInWithPassword OK')
else fail('User1 login', l1.error_description ?? JSON.stringify(l1))
if (tok2) ok('User2 signInWithPassword OK')
else fail('User2 login', l2.error_description ?? JSON.stringify(l2))

// ── D. Sticker states CRUD ───────────────────────────────────
section('D. Sticker states - INSERT / UPDATE / SELECT')
if (tok1 && u1id) {
  const h1 = { apikey: PUB, Authorization: `Bearer ${tok1}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }
  const h2 = tok2 && u2id ? { apikey: PUB, Authorization: `Bearer ${tok2}`, 'Content-Type': 'application/json', Prefer: 'return=representation' } : null

  const ins = await fetch(`${URL}/rest/v1/sticker_states`, { method: 'POST', headers: h1,
    body: JSON.stringify({ user_id: u1id, sticker_key: 'ARG-01', status: 'owned', repeat_count: 0 }) })
  if (ins.ok) ok('INSERT sticker_state ARG-01 owned')
  else fail('INSERT sticker_state', await ins.text())

  const upd = await fetch(`${URL}/rest/v1/sticker_states?user_id=eq.${u1id}&sticker_key=eq.ARG-01`, {
    method: 'PATCH', headers: h1, body: JSON.stringify({ status: 'repeated', repeat_count: 2 }) })
  if (upd.ok) ok('UPDATE sticker_state -> repeated/repeat_count=2')
  else fail('UPDATE sticker_state', await upd.text())

  const sel = await fetch(`${URL}/rest/v1/sticker_states?user_id=eq.${u1id}&sticker_key=eq.ARG-01`, {
    headers: { apikey: PUB, Authorization: `Bearer ${tok1}` } }).then(r => r.json())
  if (sel?.[0]?.status === 'repeated' && sel?.[0]?.repeat_count === 2)
    ok('SELECT sticker_state datos correctos')
  else fail('SELECT sticker_state', JSON.stringify(sel?.[0]))

  if (h2) {
    await fetch(`${URL}/rest/v1/sticker_states`, { method: 'POST', headers: h2,
      body: JSON.stringify({ user_id: u2id, sticker_key: 'BRA-01', status: 'repeated', repeat_count: 1 }) })
    ok('INSERT sticker_state User2 BRA-01 repeated (para trade)')
  }
}

// ── E. Trade + accept_trade ──────────────────────────────────
section('E. Trade request + RPC accept_trade')
let tradeId = null
if (tok1 && tok2 && u1id && u2id) {
  const h1 = { apikey: PUB, Authorization: `Bearer ${tok1}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }
  const h2 = { apikey: PUB, Authorization: `Bearer ${tok2}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

  const tResp = await fetch(`${URL}/rest/v1/trade_requests`, { method: 'POST', headers: h1,
    body: JSON.stringify({
      requester_id: u1id, owner_id: u2id,
      requested_sticker_key: 'BRA-01', offered_sticker_key: 'ARG-01',
      requested_sticker_keys: ['BRA-01'], offered_sticker_keys: ['ARG-01'],
    }) }).then(r => r.json())
  tradeId = Array.isArray(tResp) ? tResp[0]?.id : tResp?.id
  if (tradeId) ok('Trade request INSERT', tradeId.slice(0, 8) + '...')
  else fail('INSERT trade_request', JSON.stringify(tResp))

  if (tradeId) {
    const acc = await fetch(`${URL}/rest/v1/rpc/accept_trade`, { method: 'POST', headers: h2,
      body: JSON.stringify({ p_trade_id: tradeId }) })
    if (acc.ok) {
      ok('RPC accept_trade() ejecutada sin error')
      const tc = await fetch(`${URL}/rest/v1/trade_requests?id=eq.${tradeId}&select=status`,
        { headers: { apikey: PUB, Authorization: `Bearer ${tok1}` } }).then(r => r.json())
      if (tc?.[0]?.status === 'accepted') ok('trade_requests.status = accepted')
      else fail('trade status post-accept', `actual: ${tc?.[0]?.status}`)
    } else fail('RPC accept_trade()', await acc.text())
  }
}

// ── F. counter_trade ─────────────────────────────────────────
section('F. RPC counter_trade')
if (tok1 && tok2 && u1id && u2id) {
  const h1 = { apikey: PUB, Authorization: `Bearer ${tok1}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }
  const h2 = { apikey: PUB, Authorization: `Bearer ${tok2}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

  const t2 = await fetch(`${URL}/rest/v1/trade_requests`, { method: 'POST', headers: h1,
    body: JSON.stringify({
      requester_id: u1id, owner_id: u2id,
      requested_sticker_key: 'FRA-01', offered_sticker_key: 'GER-01',
      requested_sticker_keys: ['FRA-01'], offered_sticker_keys: ['GER-01'],
    }) }).then(r => r.json())
  const t2id = Array.isArray(t2) ? t2[0]?.id : t2?.id
  if (t2id) {
    const cr = await fetch(`${URL}/rest/v1/rpc/counter_trade`, { method: 'POST', headers: h2,
      body: JSON.stringify({ p_trade_id: t2id, p_counter_requested_keys: ['FRA-01'], p_counter_offered_keys: ['ITA-01'] }) })
    if (cr.ok) {
      ok('RPC counter_trade() ejecutada sin error')
      const ct = await fetch(`${URL}/rest/v1/trade_requests?id=eq.${t2id}&select=status,counter_by`,
        { headers: { apikey: PUB, Authorization: `Bearer ${tok1}` } }).then(r => r.json())
      if (ct?.[0]?.status === 'countered') ok('trade_requests.status = countered')
      else fail('counter status', `actual: ${ct?.[0]?.status}`)
      if (ct?.[0]?.counter_by === u2id) ok('counter_by = user2 (correcto)')
      else fail('counter_by', `actual: ${ct?.[0]?.counter_by}`)
    } else fail('RPC counter_trade()', await cr.text())
  } else fail('INSERT trade para contraoferta', JSON.stringify(t2))
}

// ── G. Pack items ────────────────────────────────────────────
section('G. Pack items INSERT / SELECT / UPDATE opened_at')
if (tok1 && u1id && tradeId) {
  const h1 = { apikey: PUB, Authorization: `Bearer ${tok1}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

  const pi = await fetch(`${URL}/rest/v1/pack_items`, { method: 'POST', headers: h1,
    body: JSON.stringify({ owner_id: u1id, sticker_key: 'BRA-01', trade_id: tradeId }) })
  if (pi.ok) ok('INSERT pack_item (trade_id vinculado)')
  else fail('INSERT pack_item', await pi.text())

  const piSel = await fetch(`${URL}/rest/v1/pack_items?owner_id=eq.${u1id}&opened_at=is.null`,
    { headers: { apikey: PUB, Authorization: `Bearer ${tok1}` } }).then(r => r.json())
  if (Array.isArray(piSel) && piSel.length > 0) ok(`SELECT pack_items sin abrir: ${piSel.length}`)
  else fail('SELECT pack_items sin abrir', JSON.stringify(piSel))

  const piUpd = await fetch(`${URL}/rest/v1/pack_items?owner_id=eq.${u1id}`, { method: 'PATCH', headers: h1,
    body: JSON.stringify({ opened_at: new Date().toISOString() }) })
  if (piUpd.ok) ok('UPDATE pack_item.opened_at (marcar como abierto)')
  else fail('UPDATE pack_item', await piUpd.text())
}

// ── H. Dashboard RPCs ────────────────────────────────────────
section('H. Dashboard RPCs (SECURITY DEFINER)')
if (tok1) {
  const rh = { apikey: PUB, Authorization: `Bearer ${tok1}`, 'Content-Type': 'application/json' }
  const [dc, dw, da] = await Promise.all([
    fetch(`${URL}/rest/v1/rpc/dashboard_user_counts`, { method: 'POST', headers: rh, body: '{}' }).then(r => r.json()),
    fetch(`${URL}/rest/v1/rpc/dashboard_wanted_stickers`, { method: 'POST', headers: rh, body: JSON.stringify({ lmt: 3 }) }).then(r => r.json()),
    fetch(`${URL}/rest/v1/rpc/dashboard_available_stickers`, { method: 'POST', headers: rh, body: JSON.stringify({ lmt: 3 }) }).then(r => r.json()),
  ])
  if (Array.isArray(dc)) ok(`dashboard_user_counts() OK, ${dc.length} filas`)
  else fail('dashboard_user_counts()', JSON.stringify(dc))
  if (Array.isArray(dw)) ok(`dashboard_wanted_stickers(3) OK, ${dw.length} filas`)
  else fail('dashboard_wanted_stickers()', JSON.stringify(dw))
  if (Array.isArray(da)) ok(`dashboard_available_stickers(3) OK, ${da.length} filas`)
  else fail('dashboard_available_stickers()', JSON.stringify(da))
}

// ── I. Realtime subscription (connectivity check) ────────────
section('I. Realtime subscription channels (connectivity)')
const rtTables = ['sticker_states', 'trade_requests', 'pack_items']
const pubRows = await mgmt("SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY tablename")
for (const t of rtTables) {
  if (Array.isArray(pubRows) && pubRows.some(r => r.tablename === t))
    ok(`Realtime publication: ${t}`)
  else fail(`Realtime publication missing: ${t}`)
}

// ── Cleanup ───────────────────────────────────────────────────
section('Z. Limpieza - eliminar usuarios de prueba')
for (const uid of [u1id, u2id]) {
  if (!uid) continue
  const d = await fetch(`${URL}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: adminHdrs })
  if (d.ok || d.status === 204) ok(`Usuario eliminado: ${uid.slice(0, 8)}...`)
  else fail(`Eliminar usuario ${uid.slice(0, 8)}`, await d.text())
}

// ── Final summary ─────────────────────────────────────────────
console.log('\n' + '='.repeat(56))
console.log(`  RESULTADO FUNCIONAL: ${results.pass} PASS | ${results.fail} FAIL`)
console.log('='.repeat(56))
if (results.fail > 0) {
  console.log('  Fallos:')
  results.details.filter(d => d.status === 'FAIL').forEach(d => console.log(`    - ${d.label}: ${d.info}`))
}

writeFileSync('validation_results.json', JSON.stringify({ timestamp: new Date().toISOString(), ...results }, null, 2))
console.log('\n  validation_results.json guardado.')
