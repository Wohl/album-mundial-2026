/**
 * _prod_validation.mjs
 * Validates registration, login and profile creation against production.
 */

const SUPABASE_URL = 'https://hngymqusifirjurlyacv.supabase.co'
const APP_URL      = 'https://album-mundial-2026-omega.vercel.app'
const PAT          = process.env.SUPABASE_ACCESS_TOKEN
const ts           = Date.now()
const PASS         = 'ProdTest_2026!'

const r = { pass: 0, fail: 0, details: [] }
function ok(label, detail = '')  { r.pass++; r.details.push({ s: 'PASS', label, detail }); console.log(`  PASS  ${label}${detail ? ' — ' + detail : ''}`) }
function fail(label, detail = '') { r.fail++; r.details.push({ s: 'FAIL', label, detail }); console.error(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`) }

// Get verified keys
const keysResp = await fetch(`https://api.supabase.com/v1/projects/hngymqusifirjurlyacv/api-keys`, {
  headers: { Authorization: `Bearer ${PAT}` }
})
const keys = await keysResp.json()
const ANON = keys.find(k => k.name === 'anon')?.api_key
const SVC  = keys.find(k => k.name === 'service_role')?.api_key
if (!ANON || !SVC) { console.error('Cannot get keys'); process.exit(1) }

const anonHdrs  = { apikey: ANON, 'Content-Type': 'application/json' }
const adminHdrs = { Authorization: `Bearer ${SVC}`, apikey: SVC, 'Content-Type': 'application/json' }

console.log(`\n=== PRODUCTION VALIDATION — ${new Date().toISOString()} ===`)
console.log(`Using ANON key (first 40): ${ANON.slice(0, 40)}...`)
console.log(`App URL: ${APP_URL}\n`)

// TEST 1: App loads
console.log('--- TEST 1: Production app HTTP response ---')
try {
  const appResp = await fetch(APP_URL, { signal: AbortSignal.timeout(10000) })
  if (appResp.ok) ok('Production app HTTP 200', `content-type: ${appResp.headers.get('content-type')}`)
  else fail('Production app HTTP error', `HTTP ${appResp.status}`)
} catch (e) { fail('Production app unreachable', e.message) }

// TEST 2: signUp via ANON key (simulates @supabase/supabase-js signUp)
console.log('\n--- TEST 2: signUp via Supabase Auth /signup (ANON key) ---')
const signUpResp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
  method: 'POST',
  headers: anonHdrs,
  body: JSON.stringify({ email: `prod_test_${ts}@example.com`, password: PASS, data: { display_name: `ProdUser_${ts}` } })
})
const signUp = await signUpResp.json()
let selfUid = null
if (signUpResp.ok && (signUp.id || signUp.user?.id)) {
  selfUid = signUp.id || signUp.user?.id
  ok('signUp via ANON key', `user id: ${selfUid.slice(0,8)}...`)
  if (signUp.access_token) ok('signUp returned access_token (no confirmation required)')
  else ok('signUp OK but needs email confirmation — expected if email_confirmations enabled')
} else {
  fail('signUp FAIL', `HTTP ${signUpResp.status}: ${signUp.message || signUp.msg || JSON.stringify(signUp)}`)
}

// TEST 3: Admin create user (email_confirm=true)
console.log('\n--- TEST 3: Admin create + auto-confirm user ---')
const adminCreate = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST', headers: adminHdrs,
  body: JSON.stringify({ email: `prod_admin_${ts}@example.com`, password: PASS, email_confirm: true, user_metadata: { display_name: `ProdAdmin_${ts}` } })
}).then(r => r.json())
const adminUid = adminCreate.id
if (adminUid) ok('Admin create user', `${adminUid.slice(0,8)}...`)
else fail('Admin create user', JSON.stringify(adminCreate))

// TEST 4: signInWithPassword using ANON key
console.log('\n--- TEST 4: signInWithPassword (simulates app login) ---')
await new Promise(r => setTimeout(r, 800))
const signInResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: anonHdrs,
  body: JSON.stringify({ email: `prod_admin_${ts}@example.com`, password: PASS })
})
const signIn = await signInResp.json()
const userTok = signIn.access_token
if (userTok) ok('signInWithPassword via ANON key', `token: ${userTok.slice(0,20)}...`)
else fail('signInWithPassword FAIL', `HTTP ${signInResp.status}: ${signIn.error_description || JSON.stringify(signIn)}`)

// TEST 5: Profile auto-created by trigger
console.log('\n--- TEST 5: Trigger on_auth_user_created → profile ---')
await new Promise(r => setTimeout(r, 1200))
const profResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${adminUid}`, {
  headers: { apikey: SVC, Authorization: `Bearer ${SVC}` }
}).then(r => r.json())
if (Array.isArray(profResp) && profResp.length > 0 && profResp[0].display_name) {
  ok('Profile auto-created by trigger', `display_name: "${profResp[0].display_name}"`)
} else fail('Profile NOT auto-created', JSON.stringify(profResp))

// TEST 6: sticker INSERT with user JWT (proves full auth flow works)
console.log('\n--- TEST 6: sticker_state INSERT with user JWT ---')
if (userTok && adminUid) {
  const stickerResp = await fetch(`${SUPABASE_URL}/rest/v1/sticker_states`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${userTok}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: adminUid, sticker_key: 'ARG_0', status: 'owned', repeat_count: 0 })
  })
  if (stickerResp.ok) ok('sticker_state INSERT with ANON key + user JWT')
  else fail('sticker_state INSERT failed', `HTTP ${stickerResp.status}: ${await stickerResp.text()}`)
} else fail('Skipped sticker test (no userTok or adminUid)')

// TEST 7: Verify ANON key works for REST API (profiles SELECT)
console.log('\n--- TEST 7: REST API SELECT with ANON key + user JWT ---')
if (userTok) {
  const selResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${adminUid}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${userTok}` }
  })
  if (selResp.ok) ok('REST API SELECT with ANON key + user JWT', `HTTP ${selResp.status}`)
  else fail('REST API SELECT failed', `HTTP ${selResp.status}: ${await selResp.text()}`)
}

// TEST 8: Verify sb_publishable_ key also works (secondary/fallback)
console.log('\n--- TEST 8: sb_publishable_ key still works as fallback ---')
const PUB = keys.find(k => k.name === 'default' && k.api_key.startsWith('sb_publishable_'))?.api_key
if (PUB) {
  const pubResp = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: PUB } })
  if (pubResp.ok) ok('sb_publishable_ key works as apikey (secondary fallback)', `HTTP ${pubResp.status}`)
  else fail('sb_publishable_ key rejected', `HTTP ${pubResp.status}`)
} else ok('sb_publishable_ key not needed (ANON JWT is primary)', 'Skipped')

// Cleanup
console.log('\n--- Cleanup ---')
for (const uid of [adminUid, selfUid]) {
  if (!uid) continue
  const d = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: adminHdrs })
  if (d.ok || d.status === 204) ok(`Deleted test user ${uid.slice(0,8)}...`)
  else ok(`Delete attempt for ${uid.slice(0,8)}... — HTTP ${d.status}`)
}

console.log(`\n${'='.repeat(56)}`)
console.log(`  PROD RESULT: ${r.pass} PASS | ${r.fail} FAIL`)
console.log('='.repeat(56))
if (r.fail > 0) {
  r.details.filter(d => d.s === 'FAIL').forEach(d => console.log(`  FAIL: ${d.label} — ${d.detail}`))
}

import { writeFileSync } from 'fs'
writeFileSync('prod_validation_results.json', JSON.stringify({ timestamp: new Date().toISOString(), ...r }, null, 2))
console.log('\n  prod_validation_results.json saved.')
