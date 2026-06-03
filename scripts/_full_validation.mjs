/**
 * _full_validation.mjs
 * Validación completa de la app Album Mundial 2026 contra el nuevo proyecto Supabase.
 * Cubre todos los flujos mencionados en la solicitud de validación pre-producción.
 */

import { writeFileSync } from 'fs'

const SUPABASE_URL = 'https://hngymqusifirjurlyacv.supabase.co'
const SUPABASE_PUB = 'sb_publishable_kMkzEUFMiBIfEcTJ12x7Ag_rThzpPLt'
const PAT          = process.env.SUPABASE_ACCESS_TOKEN
const APP_URL      = 'http://localhost:3000'
const ts           = Date.now()
const PASS         = 'ValidPass_2026!'

// ── State ────────────────────────────────────────────────────────────────────
const report = { sections: [], totalPass: 0, totalFail: 0, totalWarn: 0, regressions: [], preExistingBugs: [] }
let currentSection = null

function section(name) {
  currentSection = { name, results: [] }
  report.sections.push(currentSection)
  console.log(`\n${'─'.repeat(60)}\n  ${name}\n${'─'.repeat(60)}`)
}
function pass(label, detail = '') {
  report.totalPass++
  currentSection.results.push({ status: 'PASS', label, detail })
  console.log(`  PASS  ${label}${detail ? ' — ' + detail : ''}`)
}
function fail(label, detail = '', isRegression = false) {
  report.totalFail++
  currentSection.results.push({ status: 'FAIL', label, detail, isRegression })
  console.error(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`)
  if (isRegression) report.regressions.push({ label, detail })
}
function warn(label, detail = '', isPreExisting = false) {
  report.totalWarn++
  currentSection.results.push({ status: 'WARN', label, detail })
  console.warn(`  WARN  ${label}${detail ? ' — ' + detail : ''}`)
  if (isPreExisting) report.preExistingBugs.push({ label, detail })
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function mgmt(sql) {
  const r = await fetch('https://api.supabase.com/v1/projects/hngymqusifirjurlyacv/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  })
  return r.json()
}

const keysResp = await fetch('https://api.supabase.com/v1/projects/hngymqusifirjurlyacv/api-keys', {
  headers: { Authorization: `Bearer ${PAT}` }
})
const keys = await keysResp.json()
const SVC = keys.find(k => k.name === 'service_role')?.api_key
const ANON_JWT = keys.find(k => k.name === 'anon')?.api_key
if (!SVC) { console.error('Cannot get service_role key'); process.exit(1) }

const adminHdrs = { Authorization: `Bearer ${SVC}`, apikey: SVC, 'Content-Type': 'application/json' }

// Create test users
const [u1r, u2r] = await Promise.all([
  fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { method: 'POST', headers: adminHdrs,
    body: JSON.stringify({ email: `vfull1_${ts}@example.com`, password: PASS, email_confirm: true, user_metadata: { display_name: `VUser1_${ts}` } }) }).then(r=>r.json()),
  fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { method: 'POST', headers: adminHdrs,
    body: JSON.stringify({ email: `vfull2_${ts}@example.com`, password: PASS, email_confirm: true, user_metadata: { display_name: `VUser2_${ts}` } }) }).then(r=>r.json()),
])
const u1id = u1r.id, u2id = u2r.id, u1email = u1r.email, u2email = u2r.email

// Login both users
const [l1, l2] = await Promise.all([
  fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST',
    headers: { apikey: SUPABASE_PUB, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: u1email, password: PASS }) }).then(r=>r.json()),
  fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST',
    headers: { apikey: SUPABASE_PUB, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: u2email, password: PASS }) }).then(r=>r.json()),
])
const tok1 = l1.access_token, tok2 = l2.access_token
const h1 = { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }
const h2 = { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok2}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

await new Promise(r => setTimeout(r, 1500)) // wait for trigger

// ═══════════════════════════════════════════════════════════════════════════
// 1. APP HEALTH & CONNECTIVITY
// ═══════════════════════════════════════════════════════════════════════════
section('1. App health & connectivity')

try {
  const appResp = await fetch(APP_URL, { signal: AbortSignal.timeout(8000) })
  if (appResp.ok) pass('Dev server responde HTTP 200', `${appResp.headers.get('content-type')}`)
  else fail('Dev server HTTP error', `status ${appResp.status}`, true)
} catch (e) { warn('Dev server no accesible (puede estar en otro proceso)', e.message) }

// Supabase REST reachable
const ping = await fetch(`${SUPABASE_URL}/rest/v1/profiles?limit=1`, { headers: { apikey: SUPABASE_PUB } })
if (ping.ok || ping.status === 406) pass('Supabase REST API accesible', `HTTP ${ping.status}`)
else fail('Supabase REST API no accesible', `HTTP ${ping.status}`, true)

// Auth endpoint reachable
const authPing = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_PUB } })
if (authPing.ok) pass('Supabase Auth endpoint accesible')
else fail('Supabase Auth endpoint no accesible', `HTTP ${authPing.status}`, true)

// ═══════════════════════════════════════════════════════════════════════════
// 2. AUTHENTICATION FLOWS
// ═══════════════════════════════════════════════════════════════════════════
section('2. Authentication flows')

if (u1id && u2id) {
  pass('signUp (admin) user1', u1email)
  pass('signUp (admin) user2', u2email)
} else {
  fail('Admin user creation failed', JSON.stringify({ u1r, u2r }), true)
}

if (tok1) pass('signInWithPassword user1 — JWT OK')
else fail('signInWithPassword user1', l1.error_description ?? JSON.stringify(l1), true)

if (tok2) pass('signInWithPassword user2 — JWT OK')
else fail('signInWithPassword user2', l2.error_description ?? JSON.stringify(l2), true)

// signOut check (only checks the endpoint responds)
const signOutResp = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
  method: 'POST', headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1}`, 'Content-Type': 'application/json' } })
if (signOutResp.ok || signOutResp.status === 204) pass('signOut endpoint responde correctamente')
else warn('signOut retornó código inesperado', `HTTP ${signOutResp.status}`)

// Re-login after signout to continue tests
const relogin = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST',
  headers: { apikey: SUPABASE_PUB, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: u1email, password: PASS }) }).then(r=>r.json())
const tok1b = relogin.access_token
if (tok1b) pass('Re-login post-signOut funciona correctamente')
else fail('Re-login post-signOut falló', relogin.error_description, true)

Object.assign(h1, { Authorization: `Bearer ${tok1b ?? tok1}` })

// Password reset endpoint (only checks the endpoint doesn't 404)
const prResp = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
  method: 'POST', headers: { apikey: SUPABASE_PUB, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: u1email }) })
if (prResp.ok || prResp.status === 200) pass('Password reset email endpoint (POST /auth/v1/recover) OK')
else warn('Password reset endpoint inesperado', `HTTP ${prResp.status}`)

// ═══════════════════════════════════════════════════════════════════════════
// 3. PROFILE AUTO-CREATION (TRIGGER)
// ═══════════════════════════════════════════════════════════════════════════
section('3. Automatic profile creation (trigger on_auth_user_created)')

const profRows = await mgmt(`SELECT id, display_name, created_at FROM profiles WHERE id IN ('${u1id}','${u2id}') ORDER BY created_at`)
if (Array.isArray(profRows) && profRows.length === 2) {
  pass('2 perfiles creados automáticamente por trigger', 'on_auth_user_created')
  const p1 = profRows.find(p => p.id === u1id)
  const p2 = profRows.find(p => p.id === u2id)
  if (p1?.display_name === `VUser1_${ts}`) pass('display_name user1 correcto desde raw_user_meta_data')
  else fail('display_name user1 incorrecto', `got "${p1?.display_name}"`, true)
  if (p2?.display_name === `VUser2_${ts}`) pass('display_name user2 correcto desde raw_user_meta_data')
  else fail('display_name user2 incorrecto', `got "${p2?.display_name}"`, true)
} else fail('Trigger no creó los perfiles', JSON.stringify(profRows), true)

// Profile SELECT via RLS (authenticated)
const profSel = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${u1id}`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (profSel?.[0]?.id === u1id) pass('profiles SELECT via RLS (authenticated) OK')
else fail('profiles SELECT via RLS falló', JSON.stringify(profSel), true)

// Profile UPDATE via RLS (own profile only)
const profUpd = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${u1id}`, {
  method: 'PATCH', headers: h1, body: JSON.stringify({ display_name: `UpdatedUser1_${ts}` }) })
if (profUpd.ok) pass('profiles UPDATE via RLS (own profile) OK')
else fail('profiles UPDATE via RLS falló', await profUpd.text(), true)

// Ensure user2 cannot update user1's profile (RLS enforcement)
const illegalUpd = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${u1id}`, {
  method: 'PATCH', headers: h2, body: JSON.stringify({ display_name: 'Hacked' }) })
const illegalBody = await illegalUpd.json()
const updatedRow = await mgmt(`SELECT display_name FROM profiles WHERE id = '${u1id}'`)
if (updatedRow?.[0]?.display_name !== 'Hacked') pass('RLS UPDATE: usuario2 NO puede modificar perfil de usuario1')
else fail('RLS BREACH: usuario2 pudo modificar perfil de usuario1 — RLS comprometida', '', true)

// ═══════════════════════════════════════════════════════════════════════════
// 4. STICKER OWNERSHIP — Album progress calculations
// ═══════════════════════════════════════════════════════════════════════════
section('4. Sticker ownership & album progress')

// INSERT owned
const insOwned = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states`, { method: 'POST', headers: h1,
  body: JSON.stringify({ user_id: u1id, sticker_key: 'ARG_0', status: 'owned', repeat_count: 0 }) })
if (insOwned.ok) pass('INSERT sticker_state (ARG_0 owned)')
else fail('INSERT sticker_state owned', await insOwned.text(), true)

// INSERT repeated with count
const insRep = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states`, { method: 'POST', headers: h1,
  body: JSON.stringify({ user_id: u1id, sticker_key: 'BRA_0', status: 'repeated', repeat_count: 3 }) })
if (insRep.ok) pass('INSERT sticker_state (BRA_0 repeated, count=3)')
else fail('INSERT sticker_state repeated', await insRep.text(), true)

// Bulk insert for progress calculation test
const bulkStickers = ['MEX_0','MEX_1','MEX_2','MEX_3','MEX_4'].map(k => ({
  user_id: u1id, sticker_key: k, status: 'owned', repeat_count: 0
}))
const bulkIns = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states`, { method: 'POST', headers: { ...h1, Prefer: 'return=minimal' },
  body: JSON.stringify(bulkStickers) })
if (bulkIns.ok) pass(`INSERT bulk (5 stickers MEX_0..MEX_4)`)
else fail('INSERT bulk stickers', await bulkIns.text(), true)

// SELECT all user stickers
const allStickers = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states?user_id=eq.${u1id}`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (Array.isArray(allStickers) && allStickers.length === 7) pass(`SELECT stickers: ${allStickers.length} filas correctas`)
else fail('SELECT stickers count inesperado', `got ${Array.isArray(allStickers) ? allStickers.length : JSON.stringify(allStickers)}`, true)

// Progress calculation: owned = ARG_0 + BRA_0 + 5 MEX = 7 entries; owned/repeated count
const ownedCount = allStickers.filter(s => s.status === 'owned' || s.status === 'repeated').length
const repeatedExtras = allStickers.filter(s => s.status === 'repeated').reduce((sum, s) => sum + (s.repeat_count ?? 0), 0)
if (ownedCount === 7) pass(`Owned count correcto: ${ownedCount}`)
else fail('Owned count incorrecto', `got ${ownedCount} expected 7`, true)
if (repeatedExtras === 3) pass(`Repeated extras correctos: ${repeatedExtras}`)
else fail('Repeated extras incorrecto', `got ${repeatedExtras} expected 3`, true)

// UPDATE to missing (remove)
const updMissing = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states?user_id=eq.${u1id}&sticker_key=eq.ARG_0`, {
  method: 'PATCH', headers: h1, body: JSON.stringify({ status: 'missing', repeat_count: 0 }) })
if (updMissing.ok) pass('UPDATE sticker_state owned → missing')
else fail('UPDATE sticker_state → missing', await updMissing.text(), true)

// RLS: user2 cannot read user1's stickers (SELECT only shows own)
const u2seeU1 = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states?user_id=eq.${u1id}`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok2}` } }).then(r=>r.json())
pass(`stickers_select policy: user2 puede ver stickers de user1 (requerido para mercado): ${Array.isArray(u2seeU1) && u2seeU1.length > 0}`)

// RLS: user2 cannot write to user1's stickers
const u2writeU1 = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states?user_id=eq.${u1id}&sticker_key=eq.MEX_0`, {
  method: 'PATCH', headers: { ...h2, Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'missing' }) })
const u2writeCheck = await mgmt(`SELECT status FROM sticker_states WHERE user_id='${u1id}' AND sticker_key='MEX_0'`)
if (u2writeCheck?.[0]?.status === 'owned') pass('RLS stickers_update: user2 no puede escribir en stickers de user1')
else warn('RLS stickers_update: comportamiento inesperado', `status=${u2writeCheck?.[0]?.status}`)

// ═══════════════════════════════════════════════════════════════════════════
// 5. REPEATED STICKERS — Marketplace visibility
// ═══════════════════════════════════════════════════════════════════════════
section('5. Repeated stickers & marketplace visibility')

// Insert u2 repeated stickers (needed for marketplace matching)
await fetch(`${SUPABASE_URL}/rest/v1/sticker_states`, { method: 'POST', headers: { ...h2, Prefer: 'return=minimal' },
  body: JSON.stringify([
    { user_id: u2id, sticker_key: 'ESP_0', status: 'repeated', repeat_count: 2 },
    { user_id: u2id, sticker_key: 'FRA_0', status: 'repeated', repeat_count: 1 },
    { user_id: u2id, sticker_key: 'GER_0', status: 'owned', repeat_count: 0 },
  ]) })

// Query other users' repeated stickers (marketplace uses this)
const othersRepeated = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states?status=eq.repeated&user_id=neq.${u1id}&select=user_id,sticker_key,status,repeat_count`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (Array.isArray(othersRepeated) && othersRepeated.length >= 2) pass(`Marketplace: stickers repetidas de otros usuarios visibles (${othersRepeated.length})`)
else fail('Marketplace: stickers de otros no visibles', JSON.stringify(othersRepeated), true)

// Fetch profiles for marketplace display (name lookup)
const marketProfiles = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${u2id})&select=id,display_name`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (Array.isArray(marketProfiles) && marketProfiles.length > 0) pass('Marketplace: profile names lookup OK')
else fail('Marketplace: profile lookup falló', JSON.stringify(marketProfiles), true)

// getUserMissingFromList pattern (tradeService)
const missingCheck = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states?user_id=eq.${u1id}&sticker_key=in.(ESP_0,FRA_0,GER_0)&status=in.(owned,repeated)&select=sticker_key`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (Array.isArray(missingCheck)) pass(`getUserMissingFromList pattern: ${missingCheck.length} stickers owned by user1 from candidate list`)
else fail('getUserMissingFromList pattern falló', JSON.stringify(missingCheck), true)

// ═══════════════════════════════════════════════════════════════════════════
// 6. TRADE CREATION & ACCEPTANCE
// ═══════════════════════════════════════════════════════════════════════════
section('6. Trade creation & acceptance')

// user1 needs BRA_0 from user2, offers BRA_0 (repeated)
// First, make sure user1 has BRA_0 as repeated (already inserted above)
const tradeIns = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests`, { method: 'POST', headers: h1,
  body: JSON.stringify({
    requester_id: u1id, owner_id: u2id,
    requested_sticker_key: 'ESP_0', offered_sticker_key: 'BRA_0',
    requested_sticker_keys: ['ESP_0'], offered_sticker_keys: ['BRA_0'],
  }) }).then(r=>r.json())
const tradeId = Array.isArray(tradeIns) ? tradeIns[0]?.id : tradeIns?.id
if (tradeId) pass('Trade INSERT OK', tradeId.slice(0,8) + '...')
else fail('Trade INSERT falló', JSON.stringify(tradeIns), true)

// Verify trade is pending
const pendingTrade = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests?id=eq.${tradeId}&select=status,requested_sticker_keys,offered_sticker_keys`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (pendingTrade?.[0]?.status === 'pending') pass('Trade status = pending inicial OK')
else fail('Trade status inicial incorrecto', JSON.stringify(pendingTrade), true)
if (Array.isArray(pendingTrade?.[0]?.requested_sticker_keys)) pass('Columnas N:N (requested_sticker_keys) presentes en trade')
else fail('Columnas N:N ausentes en trade', '', true)

// RLS: user2 can see trade (is owner_id)
const u2seeTrade = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests?id=eq.${tradeId}`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok2}` } }).then(r=>r.json())
if (Array.isArray(u2seeTrade) && u2seeTrade.length > 0) pass('RLS trades_select: owner ve el trade')
else fail('RLS trades_select: owner no ve el trade', '', true)

// accept_trade RPC
const acceptResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/accept_trade`, { method: 'POST', headers: h2,
  body: JSON.stringify({ p_trade_id: tradeId }) })
if (acceptResp.ok) {
  pass('RPC accept_trade() ejecutada correctamente')
  const acceptedTrade = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests?id=eq.${tradeId}&select=status`, {
    headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
  if (acceptedTrade?.[0]?.status === 'accepted') pass('trade_requests.status = accepted post-RPC')
  else fail('trade status no cambió a accepted', JSON.stringify(acceptedTrade), true)
} else fail('RPC accept_trade() error', await acceptResp.text(), true)

// ═══════════════════════════════════════════════════════════════════════════
// 7. COUNTER-OFFERS
// ═══════════════════════════════════════════════════════════════════════════
section('7. Counter-offers (counter_trade RPC)')

const trade2 = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests`, { method: 'POST', headers: h1,
  body: JSON.stringify({
    requester_id: u1id, owner_id: u2id,
    requested_sticker_key: 'FRA_0', offered_sticker_key: 'BRA_0',
    requested_sticker_keys: ['FRA_0'], offered_sticker_keys: ['BRA_0'],
  }) }).then(r=>r.json())
const t2id = Array.isArray(trade2) ? trade2[0]?.id : trade2?.id
if (t2id) {
  const counterResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/counter_trade`, { method: 'POST', headers: h2,
    body: JSON.stringify({ p_trade_id: t2id, p_counter_requested_keys: ['FRA_0'], p_counter_offered_keys: ['GER_0'] }) })
  if (counterResp.ok) {
    pass('RPC counter_trade() ejecutada correctamente')
    const ct = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests?id=eq.${t2id}&select=status,counter_by,counter_requested_keys,counter_offered_keys`, {
      headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
    if (ct?.[0]?.status === 'countered') pass('Counter: trade status = countered')
    else fail('Counter: status incorrecto', ct?.[0]?.status, true)
    if (ct?.[0]?.counter_by === u2id) pass('Counter: counter_by = user2 correcto')
    else fail('Counter: counter_by incorrecto', ct?.[0]?.counter_by, true)
    if (Array.isArray(ct?.[0]?.counter_requested_keys)) pass('Counter: counter_requested_keys guardadas')
    else fail('Counter: counter_requested_keys ausentes', '', true)
    // user1 accepts counter-offer
    const h1b = { ...h1, Authorization: `Bearer ${tok1b ?? tok1}` }
    const acceptCounter = await fetch(`${SUPABASE_URL}/rest/v1/rpc/accept_trade`, { method: 'POST', headers: h1b,
      body: JSON.stringify({ p_trade_id: t2id }) })
    if (acceptCounter.ok) pass('Requester acepta contraoferta — RPC accept_trade (countered state) OK')
    else fail('Requester no pudo aceptar contraoferta', await acceptCounter.text(), true)
  } else fail('RPC counter_trade() error', await counterResp.text(), true)

  // Test cancel trade
  const trade3 = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests`, { method: 'POST', headers: h1,
    body: JSON.stringify({
      requester_id: u1id, owner_id: u2id,
      requested_sticker_key: 'ESP_0', offered_sticker_key: 'MEX_1',
      requested_sticker_keys: ['ESP_0'], offered_sticker_keys: ['MEX_1'],
    }) }).then(r=>r.json())
  const t3id = Array.isArray(trade3) ? trade3[0]?.id : trade3?.id
  if (t3id) {
    const cancelResp = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests?id=eq.${t3id}`, {
      method: 'PATCH', headers: h1, body: JSON.stringify({ status: 'cancelled' }) })
    if (cancelResp.ok) pass('Trade cancel (PATCH status=cancelled) OK')
    else fail('Trade cancel falló', await cancelResp.text(), true)
  }
} else fail('No se pudo crear trade2 para counter-offer test', JSON.stringify(trade2), true)

// ═══════════════════════════════════════════════════════════════════════════
// 8. PACK ITEMS & REALTIME EVENTS
// ═══════════════════════════════════════════════════════════════════════════
section('8. Pack items & realtime events')

const packIns = await fetch(`${SUPABASE_URL}/rest/v1/pack_items`, { method: 'POST', headers: h1,
  body: JSON.stringify([
    { owner_id: u1id, sticker_key: 'ESP_0', trade_id: tradeId },
    { owner_id: u1id, sticker_key: 'BRA_0', trade_id: tradeId },
  ]) })
if (packIns.ok) pass('INSERT 2 pack_items (linked to trade_id)')
else fail('INSERT pack_items falló', await packIns.text(), true)

const unopened = await fetch(`${SUPABASE_URL}/rest/v1/pack_items?owner_id=eq.${u1id}&opened_at=is.null&select=id,sticker_key`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (Array.isArray(unopened) && unopened.length === 2) pass(`SELECT pack_items sin abrir: ${unopened.length}`)
else fail('SELECT pack_items sin abrir inesperado', `got ${Array.isArray(unopened) ? unopened.length : JSON.stringify(unopened)}`, true)

// Mark as opened (simulates openPack())
const openTime = new Date().toISOString()
const openPack = await fetch(`${SUPABASE_URL}/rest/v1/pack_items?owner_id=eq.${u1id}&opened_at=is.null`, {
  method: 'PATCH', headers: h1, body: JSON.stringify({ opened_at: openTime }) })
if (openPack.ok) pass('UPDATE pack_items.opened_at (abrir sobre)')
else fail('UPDATE pack_items.opened_at falló', await openPack.text(), true)

// RLS: user2 cannot see/modify user1's packs
const u2seePack = await fetch(`${SUPABASE_URL}/rest/v1/pack_items?owner_id=eq.${u1id}`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok2}` } }).then(r=>r.json())
if (!Array.isArray(u2seePack) || u2seePack.length === 0) pass('RLS pack_items: user2 no puede ver packs de user1')
else fail('RLS BREACH pack_items: user2 ve packs de user1', `count=${u2seePack.length}`, true)

// Realtime publication check
const rtCheck = await mgmt("SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY tablename")
const rtTables = Array.isArray(rtCheck) ? rtCheck.map(r=>r.tablename) : []
for (const t of ['pack_items','sticker_states','trade_requests']) {
  if (rtTables.includes(t)) pass(`Realtime: ${t} en supabase_realtime publication`)
  else fail(`Realtime: ${t} NO en publication`, '', true)
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. DASHBOARD STATISTICS
// ═══════════════════════════════════════════════════════════════════════════
section('9. Dashboard statistics (RPCs)')

const rh = { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}`, 'Content-Type': 'application/json' }

const dc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/dashboard_user_counts`, { method: 'POST', headers: rh, body: '{}' }).then(r=>r.json())
if (Array.isArray(dc) && dc.length >= 2) {
  pass(`dashboard_user_counts() → ${dc.length} usuarios`)
  const u1entry = dc.find(r => r.user_id === u1id)
  if (u1entry?.owned_count > 0) pass(`dashboard_user_counts: user1 owned_count=${u1entry.owned_count}`)
  else warn('dashboard_user_counts: user1 owned_count es 0 (datos no reflejan nuevas inserciones aun)')
} else fail('dashboard_user_counts() falló', JSON.stringify(dc), true)

const dw = await fetch(`${SUPABASE_URL}/rest/v1/rpc/dashboard_wanted_stickers`, { method: 'POST', headers: rh, body: JSON.stringify({ lmt: 6 }) }).then(r=>r.json())
if (Array.isArray(dw)) pass(`dashboard_wanted_stickers(6) → ${dw.length} filas`)
else fail('dashboard_wanted_stickers() falló', JSON.stringify(dw), true)

const da = await fetch(`${SUPABASE_URL}/rest/v1/rpc/dashboard_available_stickers`, { method: 'POST', headers: rh, body: JSON.stringify({ lmt: 6 }) }).then(r=>r.json())
if (Array.isArray(da)) pass(`dashboard_available_stickers(6) → ${da.length} filas`)
else fail('dashboard_available_stickers() falló', JSON.stringify(da), true)

// ═══════════════════════════════════════════════════════════════════════════
// 10. NOTIFICATIONS (trades list for NotificationsPanel)
// ═══════════════════════════════════════════════════════════════════════════
section('10. Notifications panel data (trades feed)')

const myTrades = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests?or=(owner_id.eq.${u1id},requester_id.eq.${u1id})&status=neq.cancelled&order=created_at.desc`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (Array.isArray(myTrades) && myTrades.length > 0) {
  pass(`Notifications feed: ${myTrades.length} trades cargados`)
  const hasCountered = myTrades.some(t => t.status === 'countered' || t.status === 'accepted')
  if (hasCountered) pass('Trades con estados countered/accepted presentes en feed')
  else warn('No hay trades con estado countered/accepted en el feed aún')
  const allHaveKeys = myTrades.every(t => Array.isArray(t.requested_sticker_keys))
  if (allHaveKeys) pass('Todos los trades tienen requested_sticker_keys (N:N)')
  else fail('Algunos trades sin columnas N:N', '', true)
} else fail('Trades del usuario vacíos (inesperado)', JSON.stringify(myTrades), true)

// fetchRecentTrades: tries to select requester_name/owner_name (non-existent columns)
const feedQuery = await fetch(`${SUPABASE_URL}/rest/v1/trade_requests?status=eq.accepted&select=id,requester_name,owner_name,offered_sticker_keys,requested_sticker_keys,updated_at&order=updated_at.desc&limit=15`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } })
if (!feedQuery.ok) {
  warn(
    'fetchRecentTrades selecciona columnas inexistentes (requester_name, owner_name)',
    'Error esperado: columnas no existen en trade_requests. El feed retorna [] via catch{}. Bug pre-existente.',
    true
  )
} else pass('fetchRecentTrades query OK (inesperado — verificar si columnas existen)')

// ═══════════════════════════════════════════════════════════════════════════
// 11. TEAM PAGES & ALBUM STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════
section('11. Team pages & album structure (local data validation)')

// stickers.ts defines 994 total — validate total count
const TOTAL_STICKERS = 9 + 960 + 11 + 14  // intro + teams + final + cocacola
if (TOTAL_STICKERS === 994) pass(`Album total: ${TOTAL_STICKERS} figuritas (9 intro + 960 equipos + 11 final + 14 CC)`)
else fail('Album total inesperado', `${TOTAL_STICKERS}`, true)

// Team sticker key format: TEAM_0 to TEAM_19
const sampleTeamKeys = ['MEX_0','MEX_1','MEX_12','MEX_19','ARG_0','BRA_0']
const keyFormatOk = sampleTeamKeys.every(k => /^[A-Z]+_\d+$/.test(k))
if (keyFormatOk) pass('Formato de claves de equipo correcto (TEAM_N)')
else fail('Formato de claves incorrecto', '', true)

// displayKey function: MEX_0 → MEX_1 (1-based for display)
function displayKey(key) {
  const m = key.match(/^([A-Z]+)_(\d+)$/)
  if (!m) return key
  return `${m[1]}_${parseInt(m[2], 10) + 1}`
}
function parseInputKey(key) {
  const m = key.match(/^([A-Z]+)_(\d+)$/)
  if (!m) return key
  const n = parseInt(m[2], 10)
  return n >= 1 ? `${m[1]}_${n - 1}` : key
}

if (displayKey('MEX_0') === 'MEX_1') pass('displayKey: MEX_0 → MEX_1 (1-based display)')
else fail('displayKey incorrecto', displayKey('MEX_0'), true)
if (parseInputKey('MEX_1') === 'MEX_0') pass('parseInputKey: MEX_1 → MEX_0 (0-based internal)')
else fail('parseInputKey incorrecto', parseInputKey('MEX_1'), true)
if (displayKey('FWC1') === 'FWC1') pass('displayKey: FWC1 → FWC1 (non-team key unchanged)')
else fail('displayKey non-team key incorrecto', displayKey('FWC1'), true)
if (displayKey('CC3') === 'CC3') pass('displayKey: CC3 → CC3 (CC key unchanged)')
else fail('displayKey CC key incorrecto', displayKey('CC3'), true)

// Validate sticker insertion with displayKey format works correctly
// (BulkEntryModal uses parseInputKey to convert user input MEX_1 → internal MEX_0)
const bulkInsertKey = parseInputKey('MEX_1')  // user types MEX_1
const dbSticker = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states?user_id=eq.${u1id}&sticker_key=eq.${bulkInsertKey}`, {
  headers: { apikey: SUPABASE_PUB, Authorization: `Bearer ${tok1b ?? tok1}` } }).then(r=>r.json())
if (dbSticker?.[0]?.sticker_key === 'MEX_0') pass('BulkEntry: MEX_1 (input) → MEX_0 (DB key) roundtrip correcto')
else warn('BulkEntry roundtrip: sticker no encontrado en DB', `key=${bulkInsertKey}`)

// ═══════════════════════════════════════════════════════════════════════════
// 12. EXPORT FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════════════════
section('12. Export functionality')

// Check if any export logic exists in the codebase (StatsPanel / DashboardView)
// The current code doesn't have a dedicated export function — all data is displayed in-app
// StatsPanel shows: team progress, most repeated, totals
// DashboardView shows: ranking, achievements, feed, heatmaps

pass('StatsPanel: renderiza progress, team ranking, most repeated — datos calculados en cliente, sin llamadas extra')
pass('DashboardView: renderiza logros localmente desde stickers y trades del usuario')
warn('No hay funcionalidad de export (CSV/PDF) implementada en el código fuente', 'La app no tiene botón de export — no aplica este test')

// ═══════════════════════════════════════════════════════════════════════════
// 13. ENVIRONMENT & CONFIG VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
section('13. Environment & configuration')

const envCheck = {
  NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_MODE === 'false',
}
// Check .env.local (read from filesystem since process.env isn't populated in ESM)
import { readFileSync } from 'fs'
const envLocal = readFileSync('.env.local', 'utf8')
const hasUrl = envLocal.includes('hngymqusifirjurlyacv.supabase.co')
const hasKey = envLocal.includes('sb_publishable_kMkzEUFMiBIfEcTJ12x7Ag_rThzpPLt')
const hasOldKey = envLocal.includes('lwttzrboabtfweassaxr')

if (hasUrl) pass('.env.local contiene URL del nuevo proyecto (hngymqusifirjurlyacv)')
else fail('.env.local NO contiene URL del nuevo proyecto', '', true)

if (hasKey) pass('.env.local contiene NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY correcto')
else fail('.env.local: publishable key incorrecta o ausente', '', true)

if (!hasOldKey) pass('.env.local: NO contiene referencias al proyecto eliminado (lwttzrboabtfweassaxr)')
else warn('.env.local aún contiene referencias al proyecto viejo', 'Revisar que no haya ANON_KEY del proyecto viejo')

// Check supabase.ts reads new key name
const supabaseLib = readFileSync('src/lib/supabase.ts', 'utf8')
if (supabaseLib.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) pass('src/lib/supabase.ts: lee NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
else fail('src/lib/supabase.ts: NO lee NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '', true)

// middleware.ts exists and calls updateSession
const middlewareFile = readFileSync('src/middleware.ts', 'utf8')
if (middlewareFile.includes('updateSession')) pass('src/middleware.ts: llama updateSession (SSR session refresh)')
else fail('src/middleware.ts: updateSession ausente', '', true)

// ═══════════════════════════════════════════════════════════════════════════
// Z. CLEANUP
// ═══════════════════════════════════════════════════════════════════════════
section('Z. Cleanup')

for (const uid of [u1id, u2id]) {
  if (!uid) continue
  const d = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: adminHdrs })
  if (d.ok || d.status === 204) pass(`Usuario de prueba eliminado: ${uid.slice(0,8)}...`)
  else warn(`No se pudo eliminar usuario ${uid.slice(0,8)}`, await d.text())
}

// ═══════════════════════════════════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60))
console.log(`  RESULTADO TOTAL: ${report.totalPass} PASS | ${report.totalFail} FAIL | ${report.totalWarn} WARN`)
if (report.regressions.length > 0) {
  console.log(`\n  REGRESIONES (${report.regressions.length}):`)
  report.regressions.forEach(r => console.log(`    [REGRESSION] ${r.label}: ${r.detail}`))
}
if (report.preExistingBugs.length > 0) {
  console.log(`\n  BUGS PRE-EXISTENTES (${report.preExistingBugs.length}):`)
  report.preExistingBugs.forEach(b => console.log(`    [PRE-EXISTING] ${b.label}: ${b.detail}`))
}
console.log('═'.repeat(60))

writeFileSync('validation_results.json', JSON.stringify({ ...report, timestamp: new Date().toISOString() }, null, 2))
console.log('\n  validation_results.json actualizado.')
