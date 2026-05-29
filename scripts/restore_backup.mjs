/**
 * scripts/restore_backup.mjs
 * Album Mundial 2026 — Restore data from a local JSON backup into a Supabase DB.
 *
 * SAFE: uses UPSERT (merge-duplicates) — never truncates or drops data.
 * Respects FK insertion order: profiles → sticker_states → trade_requests → pack_items.
 *
 * Usage (via npm):
 *   npm run restore -- --list
 *   npm run restore -- --backup 2026-05-29_145440 --dry-run
 *   npm run restore -- --backup 2026-05-29_145440
 *   npm run restore -- --backup 2026-05-29_145440 --table sticker_states
 *
 * Requires .env.restore with TARGET database credentials:
 *   SUPABASE_URL=https://target-project.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
 *
 * To restore to the SAME project, run:
 *   node --env-file=.env.backup scripts/restore_backup.mjs --backup <dir>
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { join, resolve } from 'path'

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const BACKUPS_DIR       = resolve(process.cwd(), 'backups')
const BATCH_SIZE        = 200    // rows per UPSERT request
const MAX_RETRIES       = 3

// FK insertion order — must be preserved for referential integrity
const TABLE_ORDER = ['profiles', 'sticker_states', 'trade_requests', 'pack_items']

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }

const BACKUP_DIR  = getArg('--backup')
const ONLY_TABLE  = getArg('--table')
const DRY_RUN     = args.includes('--dry-run')
const LIST_MODE   = args.includes('--list')
const FORCE       = args.includes('--force')   // skip FK error warnings

// ── Logging ──────────────────────────────────────────────────────────────────

const log   = (m) => console.log(`  ${m}`)
const ok    = (m) => console.log(`  ✓  ${m}`)
const warn  = (m) => console.warn(`  ⚠  ${m}`)
const error = (m) => console.error(`  ✗  ${m}`)
const section = (t) => console.log(`\n${'─'.repeat(58)}\n  ${t}\n${'─'.repeat(58)}`)

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(2)} MB`
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function parseBackupTimestamp(dir) {
  // "2026-05-29_145440" → "29 May 2026 at 14:54:40"
  const m = dir.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})$/)
  if (!m) return dir
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${m[3]} ${months[parseInt(m[2])-1]} ${m[1]} at ${m[4]}:${m[5]}:${m[6]}`
}

// ── List backups ──────────────────────────────────────────────────────────────

function listBackups() {
  section('Available backups')

  if (!existsSync(BACKUPS_DIR)) {
    warn('No backups/ directory found. Run: npm run backup')
    return
  }

  const dirs = readdirSync(BACKUPS_DIR)
    .filter(d => {
      try { return statSync(join(BACKUPS_DIR, d)).isDirectory() } catch { return false }
    })
    .sort()
    .reverse()

  if (dirs.length === 0) {
    warn('No backups found. Run: npm run backup')
    return
  }

  for (const dir of dirs) {
    const manifestPath = join(BACKUPS_DIR, dir, 'manifest.json')
    if (!existsSync(manifestPath)) { log(`  ${dir}  (no manifest — incomplete backup)`); continue }

    const m = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const tables = Object.entries(m.tables)
      .map(([t, d]) => `${t}: ${d.rows}`)
      .join('  |  ')

    log(`  ${dir}  —  ${parseBackupTimestamp(dir)}`)
    log(`    ${tables}`)
    log(`    Validation: ${m.validation.passed ? '✓ passed' : '✗ failed'}  |  Total: ${m.total_rows} rows`)
    console.log('')
  }

  log(`To restore: npm run restore -- --backup <dir-name> [--dry-run]`)
}

// ── Get exact DB count ────────────────────────────────────────────────────────

async function getDbCount(tableName) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`, {
    method: 'HEAD',
    headers: {
      apikey:        SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer:        'count=exact',
    },
  })
  const range = resp.headers.get('content-range')
  const match = range?.match(/\/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

// ── UPSERT one batch with retry ───────────────────────────────────────────────

async function upsertBatch(tableName, rows, attempt = 1) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
    method: 'POST',
    headers: {
      apikey:        SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer:        'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  })

  if (resp.ok) return { ok: true, count: rows.length }

  const body = await resp.text()

  // FK violation — referenced auth.users don't exist in target DB
  if (resp.status === 409 || body.includes('foreign key') || body.includes('violates')) {
    return { ok: false, fkError: true, status: resp.status, body }
  }

  // Retry on 5xx
  if (resp.status >= 500 && attempt < MAX_RETRIES) {
    await new Promise(r => setTimeout(r, 500 * attempt))
    return upsertBatch(tableName, rows, attempt + 1)
  }

  return { ok: false, fkError: false, status: resp.status, body }
}

// ── Restore one table ─────────────────────────────────────────────────────────

async function restoreTable(tableName, rows, dryRun) {
  if (rows.length === 0) {
    ok(`${tableName}: 0 rows — skipped (empty backup)`)
    return { imported: 0, skipped: 0, fkErrors: 0, failed: 0 }
  }

  const batches = chunk(rows, BATCH_SIZE)
  let imported = 0, fkErrors = 0, failed = 0

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const progress = `batch ${i + 1}/${batches.length} (${batch.length} rows)`

    if (dryRun) {
      log(`  [DRY-RUN] ${tableName}: would UPSERT ${progress}`)
      imported += batch.length
      continue
    }

    const result = await upsertBatch(tableName, batch)

    if (result.ok) {
      imported += result.count
      process.stdout.write(`\r    ${tableName}: ${imported}/${rows.length} rows imported...`)
    } else if (result.fkError) {
      fkErrors += batch.length
      warn(`\n  ${tableName} ${progress}: FK error — referenced auth.users missing in target DB`)
      if (!FORCE) {
        warn(`    Run with --force to skip FK errors and continue`)
        throw new Error(`FK error on ${tableName}. Aborting. Use --force to skip.`)
      }
    } else {
      failed += batch.length
      error(`\n  ${tableName} ${progress}: HTTP ${result.status} — ${result.body.slice(0, 200)}`)
    }
  }

  if (!dryRun && imported > 0) process.stdout.write('\n')
  return { imported, skipped: 0, fkErrors, failed }
}

// ── Main restore ──────────────────────────────────────────────────────────────

async function runRestore() {
  const started = Date.now()
  const backupPath = join(BACKUPS_DIR, BACKUP_DIR)

  section(`${DRY_RUN ? '[DRY-RUN] ' : ''}Restore — ${new Date().toISOString()}`)
  log(`Source backup : backups/${BACKUP_DIR}/`)
  log(`Target DB     : ${SUPABASE_URL}`)
  log(`Mode          : ${DRY_RUN ? 'DRY-RUN (read-only validation)' : 'LIVE (will write to DB)'}`)
  if (ONLY_TABLE) log(`Table filter  : ${ONLY_TABLE} only`)

  // Validate backup directory
  if (!existsSync(backupPath)) {
    error(`Backup not found: backups/${BACKUP_DIR}/`)
    error(`Run 'npm run restore -- --list' to see available backups`)
    process.exit(1)
  }

  const manifestPath = join(backupPath, 'manifest.json')
  if (!existsSync(manifestPath)) {
    error(`No manifest.json in backups/${BACKUP_DIR}/ — backup may be incomplete`)
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  log(`Backup date   : ${manifest.backup_timestamp}`)
  log(`Backup valid  : ${manifest.validation.passed ? '✓ yes' : '✗ no (warnings during export)'}`)
  log(`Total rows    : ${manifest.total_rows}`)
  console.log('')

  // Validate all table files exist before starting
  const tablesToRestore = ONLY_TABLE
    ? TABLE_ORDER.filter(t => t === ONLY_TABLE)
    : TABLE_ORDER

  if (ONLY_TABLE && !TABLE_ORDER.includes(ONLY_TABLE)) {
    error(`Unknown table: ${ONLY_TABLE}. Valid: ${TABLE_ORDER.join(', ')}`)
    process.exit(1)
  }

  for (const tableName of tablesToRestore) {
    const filePath = join(backupPath, `${tableName}.json`)
    if (!existsSync(filePath)) {
      error(`Missing file: backups/${BACKUP_DIR}/${tableName}.json`)
      process.exit(1)
    }
  }
  ok('All backup files found')

  // Get pre-restore counts
  const preCounts = {}
  for (const t of tablesToRestore) {
    preCounts[t] = await getDbCount(t)
  }

  // Restore each table in FK order
  const results = {}

  for (const tableName of tablesToRestore) {
    const filePath = join(backupPath, `${tableName}.json`)
    const rows     = JSON.parse(readFileSync(filePath, 'utf8'))
    const fileSize = formatBytes(statSync(filePath).size)

    console.log('')
    log(`Restoring ${tableName} — ${rows.length} rows (${fileSize})`)
    log(`  Pre-restore DB count: ${preCounts[tableName] ?? 'unknown'}`)

    const r = await restoreTable(tableName, rows, DRY_RUN)
    results[tableName] = r

    const statusLine = DRY_RUN
      ? `[DRY-RUN] would import ${r.imported} rows`
      : `imported ${r.imported}${r.fkErrors > 0 ? ` | fk-skipped ${r.fkErrors}` : ''}${r.failed > 0 ? ` | failed ${r.failed}` : ''}`

    ok(`${tableName}: ${statusLine}`)
  }

  // Post-restore validation
  if (!DRY_RUN) {
    section('Post-restore validation')
    let allOk = true

    for (const tableName of tablesToRestore) {
      const postCount  = await getDbCount(tableName)
      const backupRows = manifest.tables[tableName]?.rows ?? 0
      const pre        = preCounts[tableName] ?? 0
      const r          = results[tableName]

      const delta = (postCount ?? 0) - pre
      const match = postCount !== null && postCount >= Math.min(backupRows, pre + r.imported)

      if (match) {
        ok(`${tableName}: ${pre} → ${postCount} rows (+${delta})`)
      } else {
        error(`${tableName}: expected ≥${pre + r.imported} rows, got ${postCount}`)
        allOk = false
      }
    }

    if (!allOk) {
      warn('Some tables may not have been fully restored. Verify manually.')
    }
  }

  // Summary
  section(`${DRY_RUN ? '[DRY-RUN] ' : ''}Summary`)
  const totalImported = Object.values(results).reduce((s, r) => s + r.imported, 0)
  const totalFkErrors = Object.values(results).reduce((s, r) => s + r.fkErrors, 0)
  const totalFailed   = Object.values(results).reduce((s, r) => s + r.failed, 0)
  const duration      = Date.now() - started

  log(`Backup source  : backups/${BACKUP_DIR}/`)
  log(`Target DB      : ${SUPABASE_URL}`)
  log(`Rows processed : ${totalImported}`)
  if (totalFkErrors > 0) warn(`FK-skipped rows : ${totalFkErrors} (auth.users missing in target DB)`)
  if (totalFailed   > 0) error(`Failed rows     : ${totalFailed}`)
  log(`Duration       : ${duration}ms`)
  log(`Mode           : ${DRY_RUN ? 'DRY-RUN — no data was written' : 'LIVE — data written to DB'}`)
  console.log('')

  if (totalFailed > 0) {
    error('Restore completed with errors.')
    process.exit(1)
  }

  ok(`Restore ${DRY_RUN ? 'dry-run' : ''} completed successfully.`)

  if (DRY_RUN) {
    console.log('')
    log('No data was written. To perform the actual restore:')
    log(`  npm run restore -- --backup ${BACKUP_DIR}`)
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

if (LIST_MODE) {
  listBackups()
  process.exit(0)
}

if (!BACKUP_DIR && !LIST_MODE) {
  console.error('')
  console.error('  Usage:')
  console.error('    npm run restore -- --list')
  console.error('    npm run restore -- --backup <dir> --dry-run')
  console.error('    npm run restore -- --backup <dir>')
  console.error('    npm run restore -- --backup <dir> --table sticker_states')
  console.error('')
  console.error('  Requires .env.restore with TARGET DB credentials.')
  console.error('  See .env.restore.example for the template.')
  console.error('')
  process.exit(1)
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('')
  console.error('  ERROR: Missing target DB credentials.')
  console.error('')
  console.error('  Create .env.restore with:')
  console.error('    SUPABASE_URL=https://target-project.supabase.co')
  console.error('    SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...')
  console.error('')
  console.error('  Then run: npm run restore -- --backup <dir>')
  console.error('')
  process.exit(1)
}

runRestore().catch(err => { error(err.message); process.exit(1) })
