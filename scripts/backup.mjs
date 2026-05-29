/**
 * scripts/backup.mjs
 * Album Mundial 2026 — Supabase data backup
 *
 * READ-ONLY: never modifies or deletes Supabase data.
 * Exports all rows from critical tables to timestamped JSON files.
 *
 * Usage:
 *   npm run backup              — full export + validation
 *   npm run backup:verify       — verify latest backup against current DB
 *
 * Requires .env.backup with:
 *   SUPABASE_URL=https://hngymqusifirjurlyacv.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { join, resolve } from 'path'

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL       = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
const VERIFY_ONLY        = process.argv.includes('--verify-only')
const PAGE_SIZE          = 1000
const BACKUPS_DIR        = resolve(process.cwd(), 'backups')

// Table definitions: name + ordering column (sticker_states has no created_at)
const TABLES = [
  { name: 'profiles',        orderCol: 'created_at' },
  { name: 'sticker_states',  orderCol: 'id'          },
  { name: 'trade_requests',  orderCol: 'created_at' },
  { name: 'pack_items',      orderCol: 'created_at' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg)    { console.log(`  ${msg}`) }
function ok(msg)     { console.log(`  ✓  ${msg}`) }
function warn(msg)   { console.warn(`  ⚠  ${msg}`) }
function error(msg)  { console.error(`  ✗  ${msg}`) }
function section(t)  { console.log(`\n${'─'.repeat(56)}\n  ${t}\n${'─'.repeat(56)}`) }

function timestamp() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_` +
         `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ── Core fetch — paginated, read-only ────────────────────────────────────────

async function fetchAllRows(tableName, orderCol) {
  const rows = []
  let offset = 0
  let page = 0

  while (true) {
    page++
    const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`)
    url.searchParams.set('select', '*')
    url.searchParams.set('limit',  String(PAGE_SIZE))
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('order',  `${orderCol}.asc`)

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        apikey:        SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Accept:        'application/json',
        Prefer:        'count=exact',
      },
    })

    if (!resp.ok) {
      const body = await resp.text()
      throw new Error(`HTTP ${resp.status} fetching ${tableName} (page ${page}): ${body}`)
    }

    const data = await resp.json()
    if (!Array.isArray(data)) {
      throw new Error(`Unexpected response type for ${tableName}: ${typeof data}`)
    }

    rows.push(...data)
    log(`  ${tableName}: page ${page} fetched ${data.length} rows (total so far: ${rows.length})`)

    if (data.length < PAGE_SIZE) break   // last page
    offset += PAGE_SIZE
  }

  return rows
}

// Get exact count from DB (used for validation)
async function getDbCount(tableName) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`)
  url.searchParams.set('select', 'id')
  url.searchParams.set('limit', '1')

  const resp = await fetch(url.toString(), {
    method: 'HEAD',
    headers: {
      apikey:        SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer:        'count=exact',
    },
  })

  if (!resp.ok) throw new Error(`HEAD ${tableName}: HTTP ${resp.status}`)

  const range = resp.headers.get('content-range')   // e.g. "0-0/934"
  if (!range) {
    // Fallback: GET with count
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id`, {
      headers: {
        apikey:        SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer:        'count=exact',
      },
    })
    const hdr = r2.headers.get('content-range')
    if (hdr) {
      const m = hdr.match(/\/(\d+)$/)
      return m ? parseInt(m[1], 10) : null
    }
    return null
  }

  const match = range.match(/\/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

// ── FULL BACKUP ───────────────────────────────────────────────────────────────

async function runBackup() {
  const started = Date.now()
  const ts = timestamp()
  const backupDir = join(BACKUPS_DIR, ts)

  section(`Backup — ${new Date().toISOString()}`)
  log(`Target directory: backups/${ts}/`)
  log(`Tables: ${TABLES.map(t => t.name).join(', ')}`)
  console.log('')

  // Create backup directory
  mkdirSync(backupDir, { recursive: true })
  ok(`Directory created: backups/${ts}/`)

  const manifest = {
    project_url:     SUPABASE_URL,
    backup_timestamp: new Date().toISOString(),
    backup_dir:      ts,
    tables:          {},
    validation:      { passed: true, errors: [] },
    total_rows:      0,
    duration_ms:     0,
  }

  // Export each table
  for (const { name, orderCol } of TABLES) {
    console.log(`\n  Exporting ${name}...`)

    const dbCount = await getDbCount(name)
    log(`  DB reports ${dbCount ?? 'unknown'} rows in ${name}`)

    const tableStart = Date.now()
    const rows = await fetchAllRows(name, orderCol)
    const fetchMs = Date.now() - tableStart

    // Write JSON
    const filePath = join(backupDir, `${name}.json`)
    const content  = JSON.stringify(rows, null, 2)
    writeFileSync(filePath, content, 'utf8')
    const sizeByte = Buffer.byteLength(content, 'utf8')

    // Validate count
    const countMatch = dbCount === null || rows.length === dbCount
    if (!countMatch) {
      const msg = `${name}: fetched ${rows.length} but DB reports ${dbCount}`
      warn(msg)
      manifest.validation.errors.push(msg)
      manifest.validation.passed = false
    } else {
      ok(`${name}: ${rows.length} rows exported, count verified (${formatBytes(sizeByte)}, ${fetchMs}ms)`)
    }

    manifest.tables[name] = {
      rows:        rows.length,
      db_count:    dbCount,
      file:        `${name}.json`,
      size_bytes:  sizeByte,
      size_human:  formatBytes(sizeByte),
      fetch_ms:    fetchMs,
      count_match: countMatch,
    }
    manifest.total_rows += rows.length
  }

  // Finalize manifest
  manifest.duration_ms = Date.now() - started
  const manifestPath = join(backupDir, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  // Print summary
  section('Summary')
  log(`Backup directory : backups/${ts}/`)
  log(`Total rows       : ${manifest.total_rows}`)
  log(`Duration         : ${manifest.duration_ms}ms`)
  log(`Validation       : ${manifest.validation.passed ? 'PASSED' : 'FAILED'}`)
  if (manifest.validation.errors.length > 0) {
    manifest.validation.errors.forEach(e => error(e))
  }
  console.log('')
  log('Files created:')
  log(`  backups/${ts}/manifest.json`)
  for (const { name } of TABLES) {
    const t = manifest.tables[name]
    log(`  backups/${ts}/${name}.json  (${t.rows} rows, ${t.size_human})`)
  }

  if (!manifest.validation.passed) {
    console.log('')
    error('Backup completed with validation errors (see above)')
    process.exit(1)
  }

  console.log('')
  ok('Backup completed successfully.')
  return manifest
}

// ── VERIFY MODE ───────────────────────────────────────────────────────────────

async function runVerify() {
  section(`Verify latest backup — ${new Date().toISOString()}`)

  // Find latest backup directory
  if (!existsSync(BACKUPS_DIR)) {
    error('No backups/ directory found. Run npm run backup first.')
    process.exit(1)
  }

  const dirs = readdirSync(BACKUPS_DIR)
    .filter(d => {
      try { return statSync(join(BACKUPS_DIR, d)).isDirectory() } catch { return false }
    })
    .sort()
    .reverse()

  if (dirs.length === 0) {
    error('No backup directories found in backups/. Run npm run backup first.')
    process.exit(1)
  }

  const latestDir = dirs[0]
  const backupDir = join(BACKUPS_DIR, latestDir)
  log(`Latest backup: backups/${latestDir}/`)

  // Read manifest
  const manifestPath = join(backupDir, 'manifest.json')
  if (!existsSync(manifestPath)) {
    error(`No manifest.json in backups/${latestDir}/`)
    process.exit(1)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  log(`Backup timestamp: ${manifest.backup_timestamp}`)
  log(`Original total rows: ${manifest.total_rows}`)
  log(`Original validation: ${manifest.validation.passed ? 'PASSED' : 'FAILED'}`)
  console.log('')

  let allOk = true

  for (const { name } of TABLES) {
    const backupInfo = manifest.tables[name]
    const filePath   = join(backupDir, `${name}.json`)

    // Check file exists
    if (!existsSync(filePath)) {
      error(`MISSING FILE: backups/${latestDir}/${name}.json`)
      allOk = false
      continue
    }

    // Read and count backed-up rows
    const backedUpRows = JSON.parse(readFileSync(filePath, 'utf8'))
    const backupCount  = backedUpRows.length

    // Get current DB count
    const currentCount = await getDbCount(name)

    const delta = currentCount !== null ? currentCount - backupCount : 0
    const status = backupCount === (backupInfo?.rows ?? backupCount) ? '✓' : '✗'

    log(`${status} ${name}:`)
    log(`    Backup rows   : ${backupCount}`)
    log(`    DB rows now   : ${currentCount ?? 'unknown'}`)
    log(`    Delta (new)   : ${delta >= 0 ? '+' : ''}${delta}`)
    log(`    File size     : ${formatBytes(statSync(filePath).size)}`)

    if (backupCount !== (backupInfo?.rows ?? backupCount)) {
      error(`  File row count (${backupCount}) differs from manifest (${backupInfo?.rows})`)
      allOk = false
    }

    if (delta > 0) {
      warn(`  ${delta} new rows added to ${name} since this backup — consider running a fresh backup`)
    }
    console.log('')
  }

  if (allOk) {
    ok('Backup verification passed. All files intact.')
  } else {
    error('Backup verification failed. See errors above.')
    process.exit(1)
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

// Validate credentials
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('')
  console.error('  ERROR: Missing credentials.')
  console.error('')
  console.error('  Create .env.backup with:')
  console.error('    SUPABASE_URL=https://hngymqusifirjurlyacv.supabase.co')
  console.error('    SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...')
  console.error('')
  console.error('  Then run: npm run backup')
  console.error('  (Copy .env.backup.example as a starting point)')
  console.error('')
  process.exit(1)
}

if (VERIFY_ONLY) {
  runVerify().catch(err => { error(err.message); process.exit(1) })
} else {
  runBackup().catch(err => { error(err.message); process.exit(1) })
}
