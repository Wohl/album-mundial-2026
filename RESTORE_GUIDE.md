# RESTORE_GUIDE.md — Album Mundial 2026
## Guía completa de restauración desde backup

> Esta guía cubre todos los escenarios: desde recuperar una tabla borrada por accidente hasta
> migrar el proyecto completo a un nuevo proyecto Supabase desde cero.

---

## Cuándo usar esta guía

| Escenario | Guía a seguir |
|---|---|
| Se borró datos de una tabla (sticker_states, etc.) | Sección A — Restauración parcial |
| El proyecto Supabase fue eliminado | Sección B — Restauración completa a nuevo proyecto |
| Migración a un nuevo proyecto por cualquier razón | Sección B |
| Verificar integridad de un backup antes de necesitarlo | Sección C — Validación preventiva |

---

## Prerequisitos

1. **Backup disponible** — al menos un directorio en `backups/` con `manifest.json`
2. **Node.js ≥ 22** — para `--env-file` flag
3. **Schema recreado en destino** — si es un proyecto nuevo, ejecutar `restore_complete.sql` primero
4. **Credenciales del proyecto destino** — en `.env.restore` (nunca commiteado)

---

## Comandos disponibles

```bash
# Ver todos los backups disponibles con sus row counts
npm run backup:list

# Validar un backup sin escribir nada (siempre hacer esto primero)
npm run restore -- --backup 2026-05-29_145440 --dry-run

# Restaurar todas las tablas
npm run restore -- --backup 2026-05-29_145440

# Restaurar solo una tabla
npm run restore -- --backup 2026-05-29_145440 --table sticker_states

# Restaurar ignorando errores de FK (cuando auth.users no existen en destino)
npm run restore -- --backup 2026-05-29_145440 --force
```

---

## Sección A — Restauración parcial (tabla borrada accidentalmente)

**Situación:** Un usuario o proceso borró datos de `sticker_states`. El proyecto Supabase sigue activo, solo necesito reimportar datos.

### Paso 1 — Identificar el backup correcto

```bash
npm run backup:list
```

Salida esperada:
```
2026-05-29_145440  —  29 May 2026 at 14:54:40
  profiles: 3  |  sticker_states: 934  |  trade_requests: 0  |  pack_items: 0
  Validation: ✓ passed  |  Total: 937 rows
```

Elegir el backup **más reciente antes del incidente**.

### Paso 2 — Configurar credenciales del proyecto actual

```bash
# Para restaurar al mismo proyecto, copiar .env.backup → .env.restore
cp .env.backup .env.restore
```

O crear `.env.restore` con las credenciales del proyecto actual:
```
SUPABASE_URL=https://hngymqusifirjurlyacv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Paso 3 — Dry-run (validación sin escritura)

```bash
npm run restore -- --backup 2026-05-29_145440 --table sticker_states --dry-run
```

Salida esperada:
```
[DRY-RUN] Restore — 2026-05-30T09:00:00.000Z
Source backup : backups/2026-05-29_145440/
Target DB     : https://hngymqusifirjurlyacv.supabase.co
Mode          : DRY-RUN (read-only validation)

Restoring sticker_states — 934 rows (221.4 KB)
  Pre-restore DB count: 512
  [DRY-RUN] sticker_states: would UPSERT batch 1/5 (200 rows)
  ...
✓ sticker_states: [DRY-RUN] would import 934 rows

[DRY-RUN] Summary
  Rows processed : 934
  Mode           : DRY-RUN — no data was written
✓ Restore dry-run completed successfully.
```

### Paso 4 — Restaurar

```bash
npm run restore -- --backup 2026-05-29_145440 --table sticker_states
```

### Paso 5 — Verificar

```bash
npm run backup:verify
# Si el backup ya existía, comparará los counts con el DB actual
```

**Nota sobre UPSERT:** El script usa `resolution=merge-duplicates`. Los datos existentes NO se borran — solo se actualizan filas con el mismo `id`. Los datos nuevos que no estén en el backup se conservan.

---

## Sección B — Restauración completa a nuevo proyecto Supabase

**Situación:** El proyecto Supabase fue eliminado (como ocurrió con `lwttzrboabtfweassaxr`). Necesito migrar todo a un proyecto nuevo limpio.

### Importante: limitación de auth.users

> Los usuarios de Supabase Auth (`auth.users`) **no están en el backup JSON**. Son parte del sistema interno de Supabase y solo se pueden recuperar vía:
> - El backup nativo de Supabase Dashboard (si el proyecto aún existe), O
> - PITR (Point-in-Time Recovery) disponible en planes Pro+

**Si los usuarios de auth se perdieron:** Los usuarios deberán registrarse nuevamente. Solo `sticker_states`, `trade_requests` y `pack_items` son recuperables (pero las FKs apuntan a UUIDs de `auth.users` que ya no existen, por lo que los datos se importan pero no estarán vinculados a usuarios activos hasta que esos usuarios se re-registren con el mismo UUID, lo cual no es posible en Supabase).

**Escenario más común y viable:** El proyecto fue eliminado pero tienes el backup de datos. Recreas el schema, los usuarios se re-registran (obtienen nuevos UUIDs), y sus colecciones se pierden porque los UUIDs no coinciden.

**Escenario viable para restaurar datos:** Solo funciona si también tienes acceso al backup nativo de Supabase (que incluye `auth.users`) para restaurar primero los usuarios, y luego usar este script para restaurar los datos de aplicación.

---

### Paso B-1 — Crear y configurar el nuevo proyecto Supabase

1. Ir a https://supabase.com → New Project
2. Anotar el nuevo `project_ref`
3. Ir a Settings → API → copiar `service_role` key

### Paso B-2 — Recrear el schema

En el SQL Editor del nuevo proyecto, ejecutar `restore_complete.sql` (en la raíz del proyecto):

```sql
-- Pegar y ejecutar el contenido de restore_complete.sql en el SQL Editor
```

Este archivo crea las 4 tablas, todos los triggers, las 12 RLS policies, las 5 RPCs y las subscripciones de Realtime.

**Validar:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- Debe mostrar: pack_items, profiles, sticker_states, trade_requests
```

### Paso B-3 — (Solo si tienes backup nativo) Restaurar auth.users

Si tienes acceso al backup de Supabase Dashboard:
1. Supabase Dashboard → Settings → Backups
2. Restaurar el backup nativo **antes** de importar los datos de aplicación
3. Verificar que los usuarios aparecen en Authentication → Users

### Paso B-4 — Configurar credenciales del proyecto NUEVO

```bash
# Crear .env.restore con las credenciales del nuevo proyecto
cat > .env.restore << 'EOF'
SUPABASE_URL=https://NUEVO-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (del nuevo proyecto)
EOF
```

O en Windows:
```powershell
@"
SUPABASE_URL=https://NUEVO-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
"@ | Set-Content .env.restore -Encoding utf8
```

### Paso B-5 — Ver backups disponibles

```bash
npm run backup:list
```

### Paso B-6 — Dry-run completo

```bash
npm run restore -- --backup 2026-05-29_145440 --dry-run
```

Verificar que no hay errores en la salida antes de continuar.

### Paso B-7 — Restaurar todos los datos

```bash
npm run restore -- --backup 2026-05-29_145440
```

Si ves errores de FK porque `auth.users` no existe en el nuevo proyecto:
```bash
npm run restore -- --backup 2026-05-29_145440 --force
```

Con `--force`, los datos que referencien UUIDs inexistentes se saltean (warning), y los demás se importan.

### Paso B-8 — Validar restauración

```bash
npm run restore -- --backup 2026-05-29_145440 --dry-run
```

Verificar en el SQL Editor del nuevo proyecto:
```sql
SELECT 'profiles' t, COUNT(*) c FROM profiles
UNION ALL SELECT 'sticker_states', COUNT(*) FROM sticker_states
UNION ALL SELECT 'trade_requests', COUNT(*) FROM trade_requests
UNION ALL SELECT 'pack_items', COUNT(*) FROM pack_items;
```

### Paso B-9 — Actualizar variables de entorno

Actualizar las variables en Vercel con las del nuevo proyecto:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Ver `PRODUCTION_DEPLOY_CHECKLIST.md` para los pasos completos de Vercel.

---

## Sección C — Validación preventiva de backups

Hacer esto regularmente para confirmar que los backups son válidos:

```bash
# Verificar que el último backup tiene todos los datos correctos
npm run backup:verify
```

Salida esperada:
```
✓ profiles       : backup=3,   DB=3,   delta=+0
✓ sticker_states : backup=934, DB=934, delta=+0
✓ trade_requests : backup=0,   DB=0,   delta=+0
✓ pack_items     : backup=0,   DB=0,   delta=+0
✓ Backup verification passed. All files intact.
```

Si `delta` es positivo, hay datos nuevos desde el último backup:
```
⚠ sticker_states : backup=934, DB=1024, delta=+90
   90 new rows added since this backup — consider running a fresh backup
```
Esto significa que hay datos nuevos que no están respaldados. Hacer un nuevo backup:
```bash
npm run backup
```

---

## Automatización semanal

### Windows (Task Scheduler)

```powershell
# Instalar tarea semanal (domingo 02:00 AM)
npm run backup:schedule

# Personalizar día y hora
.\scripts\schedule_backup.ps1 -Hour 3 -DayOfWeek Monday

# Ver estado de la tarea
Get-ScheduledTask -TaskName "AlbumMundial2026-Backup" | Select-Object TaskName, State

# Ejecutar manualmente (para probar)
Start-ScheduledTask -TaskName "AlbumMundial2026-Backup"

# Ver el log de ejecuciones
Get-Content backups/scheduled_backup.log -Tail 50

# Desinstalar
npm run backup:unschedule
```

**Cómo funciona sin exponer secretos:**
- La tarea de Task Scheduler ejecuta `scripts/run_scheduled_backup.ps1` (auto-generado, en .gitignore)
- Ese script ejecuta `npm run backup` que carga `.env.backup` via `node --env-file`
- `.env.backup` contiene la `service_role` key — nunca está en Task Scheduler, nunca en git
- El flujo: Task Scheduler → wrapper.ps1 → npm run backup → Node.js lee .env.backup

### macOS / Linux (cron)

```bash
# Editar crontab
crontab -e

# Agregar línea (domingo 02:00, con log)
0 2 * * 0 cd /ruta/al/proyecto && npm run backup >> backups/scheduled_backup.log 2>&1
```

### GitHub Actions (para backup offsite)

Si el repo es privado y se quiere backup automático en GitHub:

```yaml
# .github/workflows/backup.yml
name: Weekly Backup
on:
  schedule:
    - cron: '0 2 * * 0'   # domingo 02:00 UTC
  workflow_dispatch:        # también manual

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - name: Run backup
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: node scripts/backup.mjs   # sin --env-file (vars vienen de GitHub Secrets)
      - name: Upload backup artifact
        uses: actions/upload-artifact@v4
        with:
          name: backup-${{ github.run_id }}
          path: backups/
          retention-days: 30
```

> **Nota:** Para GitHub Actions, modificar `scripts/backup.mjs` para leer directamente de `process.env` (ya lo hace), sin necesitar el `--env-file` flag. Los secretos van en GitHub → Settings → Secrets.

---

## Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| `Missing credentials` | `.env.restore` no existe o está vacío | Crear `.env.restore` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` |
| `HTTP 401` | `service_role` key incorrecta | Verificar key en Supabase Dashboard → Settings → API |
| `FK error — referenced auth.users missing` | Los UUIDs de usuarios no existen en destino | Usar `--force` para saltear; los datos quedarán huérfanos hasta que los usuarios se re-registren |
| `Backup not found` | El directorio en `--backup` no existe | Ejecutar `npm run backup:list` para ver los disponibles |
| `No manifest.json` | Backup incompleto o corrupto | Usar otro backup o generar uno nuevo |
| `HTTP 409` en upsert | Conflict no resuelto por merge-duplicates | Verificar que la tabla tiene constraint `UNIQUE` o `PRIMARY KEY` |
| `Task Scheduler falla silenciosamente` | `.env.backup` no existe o path incorrecto | Verificar `backups/scheduled_backup.log` para el error exacto |
