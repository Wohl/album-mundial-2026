# BACKUP_PLAN.md — Album Mundial 2026
## Estrategia de backup post-recuperación Supabase

> **Fecha:** 2026-05-29  
> **Proyecto:** `hngymqusifirjurlyacv` (https://hngymqusifirjurlyacv.supabase.co)  
> **Contexto:** El proyecto anterior (`lwttzrboabtfweassaxr`) fue eliminado permanentemente sin backup. Este plan previene que eso vuelva a ocurrir.

---

## 1. Tablas críticas a proteger

| Tabla | Filas actuales | Columnas clave | Criticidad |
|---|---|---|---|
| `profiles` | ~3 | `id`, `display_name`, `created_at` | Alta — datos de usuario, vinculados a auth.users |
| `sticker_states` | ~934 | `user_id`, `sticker_key`, `status`, `repeat_count` | **Crítica** — toda la colección de los usuarios |
| `trade_requests` | ~0 | `requester_id`, `owner_id`, `status`, `*_sticker_keys[]` | Alta — historial de intercambios |
| `pack_items` | ~0 | `owner_id`, `sticker_key`, `trade_id`, `opened_at` | Media — sobres de intercambios |

**No se incluyen en backup:** `auth.users` (gestionado por Supabase internamente, no accesible vía REST), esquema, funciones, triggers, RLS (están documentados en `restore_complete.sql`).

---

## 2. Estrategia recomendada

### Capa 1 — Backup nativo de Supabase (gratuito)
- **Supabase Dashboard → Settings → Backups** provee backups diarios automáticos en el plan Hobby.
- Retención: 7 días.
- **Acción:** Verificar que los backups automáticos estén activos en el Dashboard.
- Limitación: Los backups son del proyecto completo (no selectivos por tabla).

### Capa 2 — Export local con `scripts/backup.mjs` (implementado en este plan)
- Export de datos en JSON por tabla, con paginación, validación de conteo de filas y timestamp.
- Ejecutable manualmente: `npm run backup`
- Almacenado en `backups/{timestamp}/` (no commiteado a git).
- Frecuencia recomendada: **diaria** (antes del cierre del día).

### Capa 3 — Export a Google Drive (opcional, futuro)
- Automatizar con un script que suba los archivos de `backups/` a Google Drive después de generarlos.
- Requiere configurar Google Drive API.

---

## 3. Backup script implementado

### Método
- Lectura vía Supabase REST API con `service_role` key (bypasea RLS, obtiene TODOS los datos).
- Paginación: 1000 filas por request hasta agotar cada tabla.
- Formato: JSON — preserva tipos nativos de PostgreSQL incluyendo arrays (`TEXT[]`).
- Validación: conteo de filas exportadas vs. conteo real en la DB.
- Operación: **estrictamente read-only** — nunca modifica ni elimina datos en Supabase.

### Archivos generados por ejecución
```
backups/
└── 2026-05-29_192031/
    ├── manifest.json          ← metadata: timestamp, row counts, duración, validación
    ├── profiles.json          ← todas las filas de profiles
    ├── sticker_states.json    ← todas las filas de sticker_states
    ├── trade_requests.json    ← todas las filas de trade_requests
    └── pack_items.json        ← todas las filas de pack_items
```

### Credenciales requeridas (en `.env.backup`)
```
SUPABASE_URL=https://hngymqusifirjurlyacv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**La `service_role` key se obtiene en:** Supabase Dashboard → Settings → API → `service_role` (secret).

---

## 4. Cómo ejecutar el backup

### Setup inicial (una sola vez)
1. Copiar `.env.backup.example` a `.env.backup`
2. Pegar la `service_role` key en `.env.backup`
3. Verificar que `backups/` esté en `.gitignore` (ya incluido)

### Backup manual
```bash
npm run backup
```

### Verificación de backup existente
```bash
npm run backup:verify
```
Compara los conteos del último backup con la DB actual. Detecta datos nuevos desde el último backup.

### Backup automatizado (opcional — PowerShell Task Scheduler en Windows)
Crear una tarea programada que ejecute diariamente:
```powershell
Set-Location "C:\Users\juan.corella\OneDrive - Corporacion ACS Sabanilla S.A\Escritorio\Album"
npm run backup >> backups\backup.log 2>&1
```

---

## 5. Retención de backups

| Política | Descripción |
|---|---|
| **Mantener** | Los últimos 30 backups (o 30 días) |
| **Eliminar** | Backups más viejos de 30 días (manual o con `npm run backup:clean`) |
| **Almacenamiento estimado** | ~2 MB por backup × 30 = ~60 MB para 30 días |

---

## 6. Pasos de restauración

En caso de pérdida de datos, para restaurar desde un backup JSON:

### Paso 1 — Preparar el entorno
```bash
# Identificar el backup a restaurar
ls backups/
# Leer el manifest para confirmar el contenido
cat backups/2026-05-29_192031/manifest.json
```

### Paso 2 — Restaurar datos en Supabase SQL Editor

Para cada tabla, usar el SQL Editor del Dashboard:

#### Restaurar `profiles`
```sql
-- Usar el JSON del backup para generar INSERTs
-- El script restore_backup.mjs (ver BACKUP_RESULT.md) genera el SQL automáticamente
```

O usar la Supabase Management API (POST con service_role key):
```bash
node scripts/restore_backup.mjs --backup backups/2026-05-29_192031 --table profiles
```

### Paso 3 — Verificar restauración
```bash
npm run backup:verify
```

### Notas importantes de restauración
- `profiles.id` debe coincidir con `auth.users.id` — si los usuarios de auth se perdieron, los perfiles no tienen sentido sin ellos.
- `sticker_states.user_id` y `trade_requests.*_id` referencian UUIDs de `auth.users`.
- En el caso de pérdida total del proyecto Supabase, el esquema se recrea con `restore_complete.sql` y luego se importan los datos.

---

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| `.env.backup` commiteado accidentalmente | Baja | Está en `.gitignore`; git pre-commit hook puede verificar |
| `service_role` key expuesta | Baja | Nunca pasa por código de producción; solo en script local |
| Backup incompleto por timeout | Baja | Paginación de 1000 filas; validación de conteo al final |
| Backup corrupto sin detectar | Muy baja | Validación de conteo en cada export; manifest con checksums |
| Datos nuevos entre backup y restore | Media | Hacer backup antes de cualquier operación riesgosa |
| `auth.users` no respaldados | Certeza | Supabase no expone `auth.users` vía REST — depender del backup nativo de Supabase |

---

## 8. Checklist de verificación de backup

Después de cada backup manual, verificar:

- [ ] El directorio `backups/{timestamp}/` existe y contiene 5 archivos (4 JSON + manifest)
- [ ] `manifest.json` muestra `"validation_passed": true`
- [ ] Los row counts en `manifest.json` coinciden con los esperados
- [ ] El archivo `sticker_states.json` tiene el mayor peso (es la tabla más grande)
- [ ] `profiles.json` contiene los display_names correctos (revisión visual rápida)
- [ ] Ejecutar `npm run backup:verify` y confirmar 0 errores

---

## 9. Limitaciones conocidas

1. **`auth.users` no está incluido** — Los usuarios de Supabase Auth no son accesibles vía REST con service_role. Solo el backup nativo de Supabase incluye `auth.users`.
2. **Sin backup de schema** — El esquema (tablas, funciones, triggers) está documentado en `restore_complete.sql`, no en los backups de datos.
3. **Sin cifrado** — Los archivos JSON están en texto plano. Para datos sensibles, considerar cifrado en reposo.
4. **Sin offsite storage** — Los backups están solo localmente. Si la máquina falla, se pierden.
