# BACKUP_RESULT.md — Album Mundial 2026
## Resultado de implementación del sistema de backup

> **Fecha:** 2026-05-29  
> **Primer backup ejecutado:** `backups/2026-05-29_145440/`  
> **Estado:** Implementado, probado y verificado localmente — **listo para uso**

---

## Lo que se implementó

### Archivos nuevos

| Archivo | Propósito | ¿Se commitea? |
|---|---|---|
| `scripts/backup.mjs` | Script principal de backup (read-only) | ✅ Sí |
| `.env.backup.example` | Template de credenciales de backup | ✅ Sí |
| `.env.backup` | Credenciales reales (service_role key) | ❌ No (en .gitignore) |
| `BACKUP_PLAN.md` | Estrategia documentada | ✅ Sí |
| `BACKUP_RESULT.md` | Este documento | ✅ Sí |
| `backups/` | Directorio donde se guardan los exports | ❌ No (en .gitignore) |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `.gitignore` | Agregado `backups/` y `.env.backup` |
| `package.json` | Agregados scripts `backup` y `backup:verify` |

---

## Cómo ejecutar el backup

### Setup inicial (una sola vez)

1. Copiar el template:
   ```bash
   cp .env.backup.example .env.backup
   ```

2. Editar `.env.backup` y pegar la `service_role` key:
   - Ir a: https://supabase.com/dashboard/project/hngymqusifirjurlyacv/settings/api
   - Copiar el valor de **service_role** (debajo de "Project API Keys")
   - Pegarlo en `.env.backup` como `SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...`

3. Verificar que `.env.backup` NO está en git:
   ```bash
   git check-ignore .env.backup   # debe retornar ".env.backup"
   ```

### Backup completo
```bash
npm run backup
```

### Verificar backup existente
```bash
npm run backup:verify
```

---

## Archivos generados por ejecución

Cada `npm run backup` crea un directorio con timestamp:

```
backups/
└── 2026-05-29_145440/           ← formato: YYYY-MM-DD_HHmmss
    ├── manifest.json             ← metadata, row counts, validación
    ├── profiles.json             ← todas las filas de profiles
    ├── sticker_states.json       ← todas las filas de sticker_states
    ├── trade_requests.json       ← todas las filas de trade_requests
    └── pack_items.json           ← todas las filas de pack_items
```

### Contenido de `manifest.json`
```json
{
  "project_url": "https://hngymqusifirjurlyacv.supabase.co",
  "backup_timestamp": "2026-05-29T20:54:40.669Z",
  "backup_dir": "2026-05-29_145440",
  "tables": {
    "profiles":       { "rows": 3,   "db_count": 3,   "count_match": true, "size_human": "628 B"    },
    "sticker_states": { "rows": 934, "db_count": 934, "count_match": true, "size_human": "221.4 KB" },
    "trade_requests": { "rows": 0,   "db_count": 0,   "count_match": true, "size_human": "2 B"      },
    "pack_items":     { "rows": 0,   "db_count": 0,   "count_match": true, "size_human": "2 B"      }
  },
  "validation": { "passed": true, "errors": [] },
  "total_rows": 937,
  "duration_ms": 3650
}
```

### Formato de los datos JSON
Los archivos JSON preservan todos los tipos nativos de PostgreSQL:
- UUIDs como strings
- ARRAY (`TEXT[]`) como arrays JSON: `["ARG_0", "BRA_1"]`
- TIMESTAMPTZ con zona horaria: `"2026-05-29T20:36:52.932261+00:00"`
- Nulls como `null`

---

## Primer backup ejecutado — resultados reales

```
Backup — 2026-05-29T20:54:40.664Z
Target directory: backups/2026-05-29_145440/

✓ profiles       : 3 rows,   628 B,   count verified
✓ sticker_states : 934 rows, 221.4 KB, count verified
✓ trade_requests : 0 rows,   2 B,     count verified
✓ pack_items     : 0 rows,   2 B,     count verified

Total rows: 937
Duration: 3,650ms
Validation: PASSED
```

**Verificación posterior (`npm run backup:verify`):**
```
✓ profiles       : backup=3,   DB=3,   delta=+0
✓ sticker_states : backup=934, DB=934, delta=+0
✓ trade_requests : backup=0,   DB=0,   delta=+0
✓ pack_items     : backup=0,   DB=0,   delta=+0

✓ Backup verification passed. All files intact.
```

---

## Cómo verificar un backup manualmente

1. **Confirmar que los archivos existen:**
   ```bash
   ls backups/2026-05-29_145440/
   # debe mostrar: manifest.json, profiles.json, sticker_states.json, trade_requests.json, pack_items.json
   ```

2. **Leer el manifest:**
   ```bash
   cat backups/2026-05-29_145440/manifest.json
   # verificar: "passed": true, row counts correctos
   ```

3. **Inspeccionar un archivo de datos:**
   ```bash
   node -e "const d=require('./backups/2026-05-29_145440/sticker_states.json'); console.log('rows:', d.length, '| sample key:', d[0]?.sticker_key)"
   ```

4. **Ejecutar verificación automática:**
   ```bash
   npm run backup:verify
   # compara backup vs DB actual, detecta datos nuevos
   ```

---

## Seguridad del script

| Aspecto | Implementación |
|---|---|
| Credenciales | Leídas de `.env.backup` vía `--env-file` de Node.js 22 — nunca hardcodeadas |
| `.env.backup` en git | Bloqueado — `git check-ignore` confirmó que está ignorado |
| `backups/` en git | Bloqueado — confirmado en `.gitignore` |
| Operaciones Supabase | Solo `GET` / `HEAD` — read-only garantizado |
| RLS bypass | Necesario para ver datos de todos los usuarios (usa service_role) |
| Uso en producción | El script es solo para ejecución local manual |

---

## Limitaciones conocidas

1. **`auth.users` no se incluye** — no es accesible vía REST, solo el backup nativo de Supabase Dashboard incluye los usuarios de auth.

2. **Sin cifrado** — los archivos JSON están en texto plano. Si la máquina o el OneDrive se compromete, los datos de usuarios quedan expuestos.

3. **Sin almacenamiento offsite automático** — los backups quedan en el directorio local. Se recomienda subirlos manualmente a Google Drive o similar de forma periódica.

4. **Paginación:** El script maneja automáticamente tablas grandes (más de 1000 filas) con paginación de 1000 filas por request.

---

## Cómo restaurar desde un backup

En caso de pérdida de datos, para reimportar desde un backup JSON:

### Opción A — SQL manual en el SQL Editor de Supabase

Generar INSERTs desde el JSON (ejemplo para `sticker_states`):

```js
// Ejecutar en Node.js local
const rows = require('./backups/2026-05-29_145440/sticker_states.json')
const sql = rows.map(r =>
  `INSERT INTO sticker_states (id, user_id, sticker_key, status, repeat_count, updated_at)
   VALUES ('${r.id}', '${r.user_id}', '${r.sticker_key}', '${r.status}', ${r.repeat_count}, '${r.updated_at}')
   ON CONFLICT (user_id, sticker_key) DO NOTHING;`
).join('\n')
require('fs').writeFileSync('restore_sticker_states.sql', sql)
```

Luego ejecutar el `.sql` generado en el SQL Editor de Supabase.

### Opción B — Reimport vía REST API (futuro)

Crear un `scripts/restore_backup.mjs` que use la service_role key para hacer `UPSERT` en cada tabla desde los archivos JSON del backup.

---

## Frecuencia recomendada

| Situación | Cuándo hacer backup |
|---|---|
| Uso normal | Una vez al día (al final del día) |
| Antes de cambios en el esquema | Siempre |
| Antes de actualizaciones de Supabase | Siempre |
| Después de un volumen inusual de actividad | Inmediatamente |
| Antes de cualquier operación de mantenimiento | Siempre |
