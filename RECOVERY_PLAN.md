# RECOVERY_PLAN.md — Album Mundial 2026
## Restauración sobre nuevo proyecto Supabase limpio

> **Fecha de auditoría:** 2026-05-29  
> **Proyecto eliminado:** `lwttzrboabtfweassaxr` (ref del proyecto anterior)  
> **Stack:** Next.js 14 · Supabase JS v2 · Sin Prisma · Vercel

---

## 1. Hallazgos de la auditoría

### 1.1 Cómo se conecta Supabase

- **Sin Prisma, sin migraciones de Prisma.** El proyecto usa `@supabase/supabase-js` directamente.
- El cliente se crea en [`src/lib/supabase.ts`](src/lib/supabase.ts): lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` de las variables de entorno.
- Si las variables están vacías, la app entra en **modo offline** (localStorage) sin crash.
- Todos los accesos a Supabase son del lado del cliente (Next.js App Router, componentes marcados `'use client'`). No hay API Routes ni service workers.

### 1.2 Variables de entorno requeridas

| Variable | Dónde se usa | Requerida |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase.ts` | **Sí** (sin ella → offline) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | **Sí** (sin ella → offline) |
| `NEXT_PUBLIC_SITE_URL` | `src/hooks/useAuth.ts` — redirectTo en reset-password email | Opcional (usa `window.location.origin` si está vacía) |
| `NEXT_PUBLIC_OFFLINE_MODE` | No usado directamente en código (legacy) | No |

### 1.3 Tablas en la base de datos

| Tabla | Propósito | FK clave |
|---|---|---|
| `profiles` | Un perfil por usuario autenticado | `auth.users(id)` |
| `sticker_states` | Estado de cada figurita por usuario | `auth.users(id)` |
| `trade_requests` | Mercado de intercambio | `auth.users(id) x2` |
| `pack_items` | Sobres/paquetes acumulados al aceptar un trade | `profiles(id)`, `trade_requests(id)` |

### 1.4 Funciones y triggers

| Nombre | Tipo | Propósito |
|---|---|---|
| `update_updated_at_column()` | Trigger function | Actualiza `updated_at` automáticamente |
| `trg_profiles_updated_at` | Trigger | Llama al anterior en `profiles` |
| `trg_sticker_states_updated_at` | Trigger | Llama al anterior en `sticker_states` |
| `trg_trade_requests_updated_at` | Trigger | Llama al anterior en `trade_requests` |
| `handle_new_user()` | Trigger function SECURITY DEFINER | Crea fila en `profiles` al registrarse un usuario |
| `on_auth_user_created` | Trigger | Dispara `handle_new_user` en `auth.users` INSERT |
| `accept_trade(p_trade_id UUID)` | RPC SECURITY DEFINER | Intercambio atómico N:N + contraofertas (versión final en migration_v3.sql) |
| `counter_trade(...)` | RPC SECURITY DEFINER | Crear contraoferta en un trade |
| `dashboard_user_counts()` | RPC | Retorna `user_id, owned_count, extra_count` — **NO está en ningún SQL del repo** |
| `dashboard_wanted_stickers(lmt)` | RPC | Retorna `sticker_key, cnt` (más faltantes) — **NO está en ningún SQL del repo** |
| `dashboard_available_stickers(lmt)` | RPC | Retorna `sticker_key, cnt` (más repetidas) — **NO está en ningún SQL del repo** |

### 1.5 RLS Policies

| Tabla | Operación | Condición |
|---|---|---|
| `profiles` | SELECT | `auth.role() = 'authenticated'` |
| `profiles` | UPDATE | `auth.uid() = id` |
| `sticker_states` | SELECT | `auth.role() = 'authenticated'` |
| `sticker_states` | INSERT | `auth.uid() = user_id` |
| `sticker_states` | UPDATE | `auth.uid() = user_id` |
| `sticker_states` | DELETE | `auth.uid() = user_id` |
| `trade_requests` | SELECT | `auth.uid() = requester_id OR auth.uid() = owner_id` |
| `trade_requests` | INSERT | `auth.uid() = requester_id` |
| `trade_requests` | UPDATE | `auth.uid() = requester_id OR auth.uid() = owner_id` |
| `pack_items` | SELECT | `auth.uid() = owner_id` |
| `pack_items` | INSERT | `auth.uid() = owner_id` |
| `pack_items` | UPDATE | `auth.uid() = owner_id` |

### 1.6 Realtime habilitado

| Tabla | Estado en código | Estado en schema.sql |
|---|---|---|
| `sticker_states` | Sí (useTrades, useStickers) | En `supabase_realtime` publication |
| `trade_requests` | Sí (useTrades) | En `supabase_realtime` publication |
| `pack_items` | Sí (usePacks) | **No está en el publication** — debe agregarse |

### 1.7 Auth configuración requerida en Dashboard

- Desactivar **"Enable email confirmations"** en Authentication → Settings para que el registro sea inmediato.
- (Opcional en prod) Configurar SMTP para emails de reset de contraseña.

### 1.8 Archivos SQL disponibles en el repo

| Archivo | Qué hace | Orden |
|---|---|---|
| `schema.sql` | Crea todo desde cero (profiles, sticker_states, trade_requests, triggers, RLS, accept_trade v1, realtime) | **1° — ejecutar primero** |
| `migration_v3.sql` | Agrega arrays N:N a trade_requests, agrega contraoferta, reemplaza accept_trade, agrega counter_trade | **2° — ejecutar segundo** |
| `supabase-pack-items-migration.sql` | Crea tabla pack_items con RLS | **3° — ejecutar tercero** |

### 1.9 SQL faltante (debe crearse)

Las 3 RPCs del dashboard (`dashboard_user_counts`, `dashboard_wanted_stickers`, `dashboard_available_stickers`) existían en el proyecto eliminado pero **no están en ningún SQL del repo**. Hay que recrearlas — el código que las consume está en [`src/services/dashboardService.ts`](src/services/dashboardService.ts) y define exactamente qué columnas retornan.

---

## 2. Qué datos se pueden recuperar

### ✅ Recuperable (está en el repo)
- El esquema completo de la base de datos
- Toda la lógica de negocio y frontend
- Las definiciones de las 994 figuritas
- Las RPCs (las del repo) y las del dashboard (las reconstruimos)

### ❌ Irrecuperable (vivía en el proyecto Supabase eliminado)
- **Usuarios registrados** — `auth.users` es propiedad del proyecto Supabase, no hay export disponible
- **Sticker states** de cada usuario
- **Trade requests** históricas
- **Pack items**
- **Profiles** (se generan automáticamente al registrarse, pero sin los usuarios de auth tampoco existen)

> **Conclusión:** La app quedará lista y funcional, pero los usuarios deberán registrarse nuevamente desde cero.

---

## 3. Plan de recuperación paso a paso

### PRE-REQUISITOS

- Tener acceso a [supabase.com](https://supabase.com) con la cuenta del proyecto
- Tener acceso a [vercel.com](https://vercel.com) con la cuenta del proyecto
- El código fuente está en: `C:\Users\juan.corella\OneDrive - Corporacion ACS Sabanilla S.A\Escritorio\Album\`

---

### PASO 0 — Crear el nuevo proyecto Supabase

1. Ir a [supabase.com](https://supabase.com) → Dashboard → **New Project**
2. Nombre: `album-mundial-2026` (o el que prefieras)
3. Región recomendada: **South America (São Paulo)** para menor latencia
4. Anotar la **contraseña de la DB** en un lugar seguro (no se vuelve a mostrar)
5. Esperar a que el proyecto esté **fully initialized** (puede tardar 1-2 min)

**Validación:** El panel del proyecto se carga sin errores. Estado: "Healthy".

---

### PASO 1 — Ejecutar `schema.sql` (base completa)

1. En el Dashboard del nuevo proyecto → **SQL Editor** → New query
2. Copiar el contenido completo del archivo `schema.sql` del repo
3. **Revisar:** Las primeras líneas tienen `DROP TABLE IF EXISTS`. En un proyecto nuevo estas tablas no existen, así que es seguro. Confirmar antes de ejecutar.
4. Pegar y ejecutar (**Run** o `Ctrl+Enter`)
5. Esperar resultado exitoso

**Qué crea:**
- Tablas: `profiles`, `sticker_states`, `trade_requests`
- Índices en sticker_states y trade_requests
- Funciones: `update_updated_at_column`, `handle_new_user`
- Triggers: `trg_profiles_updated_at`, `trg_sticker_states_updated_at`, `trg_trade_requests_updated_at`, `on_auth_user_created`
- RLS habilitado con 7 policies
- RPC `accept_trade` (versión 1 — será reemplazada en el siguiente paso)
- Realtime en `sticker_states` y `trade_requests`

**Validación después del paso 1:**
```sql
-- Ejecutar en SQL Editor para confirmar
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Debe mostrar: profiles, sticker_states, trade_requests

SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';
-- Debe mostrar los 4 triggers

SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public';
-- Debe mostrar 7 policies
```

**Riesgo:** Bajo. En DB nueva los DROP son no-ops.

---

### PASO 2 — Ejecutar `migration_v3.sql` (N:N + contraofertas)

1. SQL Editor → New query
2. Copiar y pegar el contenido de `migration_v3.sql`
3. Ejecutar

**Qué hace:**
- Agrega columnas `requested_sticker_keys TEXT[]`, `offered_sticker_keys TEXT[]` a `trade_requests`
- Agrega columnas `counter_requested_keys TEXT[]`, `counter_offered_keys TEXT[]`, `counter_by UUID`
- Actualiza el constraint CHECK de `status` para incluir `'countered'`
- **Reemplaza** la RPC `accept_trade` con la versión N:N que soporta contraofertas
- Agrega la nueva RPC `counter_trade`

**Validación después del paso 2:**
```sql
-- Verificar columnas nuevas en trade_requests
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trade_requests' AND table_schema = 'public'
ORDER BY ordinal_position;
-- Debe incluir: requested_sticker_keys, offered_sticker_keys, counter_requested_keys, counter_offered_keys, counter_by

-- Verificar RPCs
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;
-- Debe incluir: accept_trade, counter_trade, handle_new_user, update_updated_at_column
```

**Riesgo:** Bajo. Usa `ADD COLUMN IF NOT EXISTS` y `CREATE OR REPLACE FUNCTION`. La migración de datos existentes (`UPDATE trade_requests SET ... WHERE array_length IS NULL`) no hace nada en una DB vacía.

---

### PASO 3 — Ejecutar `supabase-pack-items-migration.sql` (pack_items)

1. SQL Editor → New query
2. Copiar y pegar el contenido de `supabase-pack-items-migration.sql`
3. Ejecutar

**Qué crea:**
- Tabla `pack_items` con índice en `(owner_id, opened_at) WHERE opened_at IS NULL`
- RLS habilitado con 3 policies

**Validación después del paso 3:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Debe mostrar ahora: pack_items, profiles, sticker_states, trade_requests

SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public';
-- Debe mostrar 10 policies (7 anteriores + 3 de pack_items)
```

**Riesgo:** Bajo. Usa `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`.

---

### PASO 4 — Crear las RPCs del Dashboard (faltantes)

Estas 3 funciones existían en el proyecto eliminado pero no están en ningún SQL del repo.  
Ejecutar el siguiente bloque completo en SQL Editor:

```sql
-- ============================================================
-- RPCs del Dashboard — recreadas desde el código que las consume
-- (src/services/dashboardService.ts)
-- ============================================================

-- Retorna owned_count y extra_count por usuario
-- owned_count = figuritas en estado 'owned' o 'repeated'
-- extra_count = suma de repeat_count en estado 'repeated'
CREATE OR REPLACE FUNCTION dashboard_user_counts()
RETURNS TABLE(user_id UUID, owned_count BIGINT, extra_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    user_id::UUID,
    COUNT(*)            FILTER (WHERE status IN ('owned', 'repeated')) AS owned_count,
    COALESCE(SUM(repeat_count) FILTER (WHERE status = 'repeated'), 0) AS extra_count
  FROM sticker_states
  GROUP BY user_id;
$$;

-- Retorna las figuritas más buscadas (más usuarios con status 'missing')
CREATE OR REPLACE FUNCTION dashboard_wanted_stickers(lmt INT DEFAULT 6)
RETURNS TABLE(sticker_key TEXT, cnt BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sticker_key, COUNT(*) AS cnt
  FROM sticker_states
  WHERE status = 'missing'
  GROUP BY sticker_key
  ORDER BY cnt DESC
  LIMIT lmt;
$$;

-- Retorna las figuritas más disponibles (más usuarios con status 'repeated')
CREATE OR REPLACE FUNCTION dashboard_available_stickers(lmt INT DEFAULT 6)
RETURNS TABLE(sticker_key TEXT, cnt BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sticker_key, COUNT(*) AS cnt
  FROM sticker_states
  WHERE status = 'repeated'
  GROUP BY sticker_key
  ORDER BY cnt DESC
  LIMIT lmt;
$$;
```

**Validación después del paso 4:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;
-- Debe incluir ahora las 3 funciones del dashboard
```

**Riesgo:** Bajo. Son funciones nuevas, no modifican datos.

---

### PASO 5 — Habilitar Realtime para `pack_items`

El código de `usePacks.ts` escucha cambios en `pack_items` vía Realtime, pero `schema.sql` no la agrega a la publication. Ejecutar:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE pack_items;
```

**Validación:**
```sql
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
-- Debe mostrar: pack_items, sticker_states, trade_requests
```

**Riesgo:** Mínimo. Solo agrega la tabla a la publication.

---

### PASO 6 — Configurar Auth en el Dashboard de Supabase

1. Ir a **Authentication → Settings** (en el Dashboard del nuevo proyecto)
2. En **Email Auth** → desactivar **"Enable email confirmations"**
   - Esto permite que los usuarios se registren y accedan inmediatamente sin verificar email
3. (Opcional para producción) Configurar **Custom SMTP** para emails de reset de contraseña
4. Guardar cambios

**Validación:** Crear un usuario de prueba en Authentication → Users y verificar que aparece en la lista sin estado "Confirming".

**Riesgo:** Bajo. Solo cambia el flujo de email de registro.

---

### PASO 7 — Obtener las nuevas credenciales

1. En el Dashboard del nuevo proyecto → **Settings → API**
2. Copiar:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. El nuevo `project_ref` es el código en la URL: `https://NUEVO_REF.supabase.co`

---

### PASO 8 — Actualizar variables de entorno locales

Editar el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://NUEVO_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=NUEVA_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://album-mundial-2026-omega.vercel.app
NEXT_PUBLIC_OFFLINE_MODE=false
```

También actualizar `.env` (si se usa localmente):
```env
NEXT_PUBLIC_SUPABASE_URL=https://NUEVO_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=NUEVA_ANON_KEY
NEXT_PUBLIC_OFFLINE_MODE=false
```

**Riesgo:** Asegurarse de no commitear `.env.local` a git (está en `.gitignore`).

---

### PASO 9 — Actualizar `.mcp.json`

El archivo `.mcp.json` apunta al proyecto eliminado. Actualizar el `project_ref`:

Archivo: `.mcp.json`
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=NUEVO_REF"
    }
  }
}
```

Reemplazar `NUEVO_REF` con el ref del nuevo proyecto.

---

### PASO 10 — Verificar localmente

```bash
# Instalar dependencias si es necesario
npm install

# Arrancar en desarrollo
npm run dev
```

Abrir `http://localhost:3000` y:
1. Verificar que la app NO muestra errores de conexión
2. Registrar un usuario de prueba
3. Verificar que el perfil se crea automáticamente (trigger `on_auth_user_created`)
4. Marcar algunas figuritas y verificar que persisten en Supabase
5. Abrir otra ventana con otro usuario y verificar que el mercado de intercambio funciona
6. Verificar que el Dashboard carga (puede estar vacío si hay pocos datos, pero no debe crashear)

---

### PASO 11 — Actualizar variables en Vercel

> **NOTA:** No cambiar nada en Vercel hasta que el paso 10 (verificación local) sea exitoso.

1. Ir a [vercel.com](https://vercel.com) → Proyecto `album-mundial-2026`
2. **Settings → Environment Variables**
3. Actualizar o agregar:
   - `NEXT_PUBLIC_SUPABASE_URL` = nueva URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = nueva anon key
   - `NEXT_PUBLIC_SITE_URL` = URL de producción de Vercel
4. Hacer un nuevo deploy (puede ser un **Redeploy** del último commit, sin cambiar código)

**Validación post-deploy:**
- Abrir la URL de producción de Vercel
- Registrar un usuario
- Verificar que las figuritas y el mercado funcionan en producción

---

## 4. Resumen de riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| `schema.sql` falla por DROP de tablas inexistentes | Muy baja | `DROP IF EXISTS` es seguro en DB vacía |
| Las RPCs del dashboard tienen lógica diferente a la original | Media | El código que las consume define exactamente las columnas. Las funciones recreadas son equivalentes. Si algo falla, el dashboard muestra vacío (no crashea, tiene try/catch). |
| `pack_items.owner_id` referencia `profiles(id)` pero un usuario puede tener pack_items antes de que su perfil exista | Media | El trigger `on_auth_user_created` crea el perfil automáticamente. En producción, el insert a pack_items ocurre después de que el trigger ya se ejecutó. |
| Realtime no funciona en el nuevo proyecto | Baja | Supabase lo habilita por defecto. El paso 5 agrega pack_items explícitamente. |
| Variables de entorno expuestas en git | Baja | `.env.local` está en `.gitignore`. Verificar que `.env` no tenga credenciales de producción commiteadas. |

---

## 5. Orden de ejecución (resumen)

```
[Supabase Dashboard]
1. Crear nuevo proyecto
2. SQL Editor → ejecutar schema.sql
3. SQL Editor → ejecutar migration_v3.sql
4. SQL Editor → ejecutar supabase-pack-items-migration.sql
5. SQL Editor → ejecutar RPCs del dashboard (bloque del Paso 4)
6. SQL Editor → ALTER PUBLICATION supabase_realtime ADD TABLE pack_items;
7. Authentication → Settings → desactivar email confirmations

[Local]
8. Actualizar .env.local y .env con nuevas credenciales
9. Actualizar .mcp.json con nuevo project_ref
10. npm run dev → verificar funcionamiento completo

[Vercel — solo si paso 10 es exitoso]
11. Actualizar env vars en Vercel → Redeploy
```

---

## 6. Validación final completa

Ejecutar estas queries en SQL Editor del nuevo proyecto para confirmar que todo está en orden:

```sql
-- TABLAS (debe retornar 4 filas)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- TRIGGERS (debe retornar 4 filas)
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema IN ('public') OR event_object_schema = 'auth';

-- POLICIES (debe retornar 10 filas)
SELECT policyname, tablename, cmd FROM pg_policies 
WHERE schemaname = 'public' ORDER BY tablename, cmd;

-- FUNCIONES (debe retornar 7 filas)
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- REALTIME (debe retornar 3 filas)
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- TEST DEL TRIGGER (crear un usuario de prueba primero, luego verificar):
SELECT id, display_name, created_at FROM profiles;
```
