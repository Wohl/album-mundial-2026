# RESTORE_PREVIEW.md — Album Mundial 2026
## Vista previa de restauración — pendiente de aprobación

> **Proyecto destino:** `hngymqusifirjurlyacv` (https://hngymqusifirjurlyacv.supabase.co)  
> **Estado actual:** Base de datos vacía (0 tablas confirmado)  
> **Fuentes SQL:** `schema.sql` · `migration_v3.sql` · `supabase-pack-items-migration.sql` · RPCs reconstruidas  
> **Script consolidado:** `restore_complete.sql`  
> **Operaciones destructivas:** NINGUNA — solo CREATE / ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE

---

## BLOQUE 1 — Schema base
*Fuente: `schema.sql`*

### Tablas

| # | Tabla | Columnas | PK | FK |
|---|---|---|---|---|
| 1 | `profiles` | `id`, `display_name`, `created_at`, `updated_at` | `id UUID` | `auth.users(id) ON DELETE CASCADE` |
| 2 | `sticker_states` | `id`, `user_id`, `sticker_key`, `status`, `repeat_count`, `updated_at` | `id UUID` | `auth.users(id) ON DELETE CASCADE` |
| 3 | `trade_requests` | `id`, `requester_id`, `owner_id`, `requested_sticker_key`, `offered_sticker_key`, `status`, `created_at`, `updated_at` | `id UUID` | `auth.users(id) x2 ON DELETE CASCADE` |

### Índices

| Tabla | Nombre | Columna |
|---|---|---|
| `sticker_states` | `idx_sticker_states_user` | `user_id` |
| `sticker_states` | `idx_sticker_states_key` | `sticker_key` |
| `sticker_states` | `idx_sticker_states_status` | `status` |
| `trade_requests` | `idx_trade_requests_owner` | `owner_id` |
| `trade_requests` | `idx_trade_requests_requester` | `requester_id` |
| `trade_requests` | `idx_trade_requests_status` | `status` |

### Funciones

| # | Función | Tipo | Propósito |
|---|---|---|---|
| 1 | `update_updated_at_column()` | `TRIGGER FUNCTION` | Actualiza `updated_at = NOW()` automáticamente |
| 2 | `handle_new_user()` | `TRIGGER FUNCTION SECURITY DEFINER` | Crea fila en `profiles` al registrarse un usuario en `auth.users` |

### Triggers

| # | Nombre | Tabla | Evento | Función |
|---|---|---|---|---|
| 1 | `trg_profiles_updated_at` | `profiles` | `BEFORE UPDATE` | `update_updated_at_column()` |
| 2 | `trg_sticker_states_updated_at` | `sticker_states` | `BEFORE UPDATE` | `update_updated_at_column()` |
| 3 | `trg_trade_requests_updated_at` | `trade_requests` | `BEFORE UPDATE` | `update_updated_at_column()` |
| 4 | `on_auth_user_created` | `auth.users` | `AFTER INSERT` | `handle_new_user()` |

### Row Level Security (RLS)

| Tabla | Política | Operación | Condición |
|---|---|---|---|
| `profiles` | `profiles_select` | `SELECT` | `auth.role() = 'authenticated'` |
| `profiles` | `profiles_update` | `UPDATE` | `auth.uid() = id` |
| `sticker_states` | `stickers_select` | `SELECT` | `auth.role() = 'authenticated'` |
| `sticker_states` | `stickers_insert` | `INSERT` | `auth.uid() = user_id` |
| `sticker_states` | `stickers_update` | `UPDATE` | `auth.uid() = user_id` |
| `sticker_states` | `stickers_delete` | `DELETE` | `auth.uid() = user_id` |
| `trade_requests` | `trades_select` | `SELECT` | `auth.uid() = requester_id OR auth.uid() = owner_id` |
| `trade_requests` | `trades_insert` | `INSERT` | `auth.uid() = requester_id` |
| `trade_requests` | `trades_update` | `UPDATE` | `auth.uid() = requester_id OR auth.uid() = owner_id` |

**Total: 9 RLS policies**

---

## BLOQUE 2 — Migración v3: N:N + Contraofertas
*Fuente: `migration_v3.sql`*

### Columnas nuevas en `trade_requests`

| Columna | Tipo | Default | Propósito |
|---|---|---|---|
| `requested_sticker_keys` | `TEXT[] NOT NULL` | `'{}'` | Array N:N de figuritas pedidas |
| `offered_sticker_keys` | `TEXT[] NOT NULL` | `'{}'` | Array N:N de figuritas ofrecidas |
| `counter_requested_keys` | `TEXT[] NULL` | `NULL` | Figuritas pedidas en contraoferta |
| `counter_offered_keys` | `TEXT[] NULL` | `NULL` | Figuritas ofrecidas en contraoferta |
| `counter_by` | `UUID NULL` | `NULL` | Quién hizo la última contraoferta — FK a `auth.users(id)` |

### Constraint actualizado

| Constraint | Valores permitidos |
|---|---|
| `trade_requests_status_check` | `'pending'`, `'accepted'`, `'rejected'`, `'cancelled'`, `'countered'` |

### RPCs (funciones de negocio)

| # | RPC | Firma | Tipo | Propósito |
|---|---|---|---|---|
| 1 | `accept_trade` | `accept_trade(p_trade_id UUID) → void` | `SECURITY DEFINER` | Intercambio atómico N:N. Soporta trades directos y contraofertas. Valida que solo el `owner` (o `requester` en contraoferta) pueda aceptar. Ejecuta el swap completo de figuritas en una sola transacción, bypaseando RLS. |
| 2 | `counter_trade` | `counter_trade(p_trade_id UUID, p_counter_requested_keys TEXT[], p_counter_offered_keys TEXT[]) → void` | `SECURITY DEFINER` | Crea una contraoferta sobre un trade `pending` o `countered`. Valida que no contraoferte quien hizo la última contraoferta. |

---

## BLOQUE 3 — Tabla `pack_items`
*Fuente: `supabase-pack-items-migration.sql`*

### Tabla

| # | Tabla | Columnas | PK | FK |
|---|---|---|---|---|
| 4 | `pack_items` | `id`, `owner_id`, `sticker_key`, `trade_id`, `created_at`, `opened_at` | `id UUID` | `profiles(id) ON DELETE CASCADE`, `trade_requests(id) ON DELETE SET NULL` |

### Índice

| Nombre | Columnas | Condición | Propósito |
|---|---|---|---|
| `pack_items_owner_unopened` | `(owner_id, opened_at)` | `WHERE opened_at IS NULL` | Consulta eficiente de sobres sin abrir |

### RLS

| Política | Operación | Condición |
|---|---|---|
| `Usuarios ven sus propios pack_items` | `SELECT` | `auth.uid() = owner_id` |
| `Usuarios insertan sus propios pack_items` | `INSERT` | `auth.uid() = owner_id` |
| `Usuarios actualizan sus propios pack_items` | `UPDATE` | `auth.uid() = owner_id` |

**Total: 3 RLS policies adicionales (acumulado: 12)**

---

## BLOQUE 4 — RPCs del Dashboard
*Reconstruidas desde `src/services/dashboardService.ts` — no estaban en ningún SQL del repositorio*

| # | RPC | Firma | Retorna | Propósito |
|---|---|---|---|---|
| 3 | `dashboard_user_counts` | `dashboard_user_counts() → TABLE` | `(user_id UUID, owned_count BIGINT, extra_count BIGINT)` | Cuenta figuritas poseídas y extras por usuario. Usada para el ranking del dashboard. |
| 4 | `dashboard_wanted_stickers` | `dashboard_wanted_stickers(lmt INT DEFAULT 6) → TABLE` | `(sticker_key TEXT, cnt BIGINT)` | Las figuritas más buscadas (mayor cantidad de usuarios con `status = 'missing'`). |
| 5 | `dashboard_available_stickers` | `dashboard_available_stickers(lmt INT DEFAULT 6) → TABLE` | `(sticker_key TEXT, cnt BIGINT)` | Las figuritas más disponibles (mayor cantidad de usuarios con `status = 'repeated'`). |

---

## BLOQUE 5 — Realtime
*Agrega tablas a la publication `supabase_realtime`*

| Tabla | Usado en | Estado actual | Acción |
|---|---|---|---|
| `sticker_states` | `useTrades`, `useStickers` | No en publication | `ALTER PUBLICATION supabase_realtime ADD TABLE sticker_states` |
| `trade_requests` | `useTrades` | No en publication | `ALTER PUBLICATION supabase_realtime ADD TABLE trade_requests` |
| `pack_items` | `usePacks` | No en publication | `ALTER PUBLICATION supabase_realtime ADD TABLE pack_items` |

---

## Resumen total de objetos a crear

| Categoría | Cantidad | Detalle |
|---|---|---|
| **Tablas** | 4 | `profiles`, `sticker_states`, `trade_requests`, `pack_items` |
| **Índices** | 7 | 3 en `sticker_states`, 3 en `trade_requests`, 1 en `pack_items` |
| **Funciones de trigger** | 2 | `update_updated_at_column`, `handle_new_user` |
| **Triggers** | 4 | 3 de `updated_at` + `on_auth_user_created` en `auth.users` |
| **RPCs** | 5 | `accept_trade`, `counter_trade`, `dashboard_user_counts`, `dashboard_wanted_stickers`, `dashboard_available_stickers` |
| **RLS policies** | 12 | 2 en `profiles`, 4 en `sticker_states`, 3 en `trade_requests`, 3 en `pack_items` |
| **Realtime** | 3 tablas | `sticker_states`, `trade_requests`, `pack_items` |
| **Columnas agregadas** | 5 | En `trade_requests` vía `ADD COLUMN IF NOT EXISTS` |
| **Constraint actualizado** | 1 | `trade_requests_status_check` incluye `'countered'` |

---

## Seguridad de la operación

| Aspecto | Garantía |
|---|---|
| Operaciones destructivas | **NINGUNA** — sin `DROP TABLE`, `TRUNCATE`, `DELETE`, ni `reset` |
| Idempotencia | `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION` — seguro re-ejecutar |
| Triggers | `DROP TRIGGER IF EXISTS` + `CREATE` — solo para garantizar no duplicados |
| Policies | `DROP POLICY IF EXISTS` + `CREATE` — solo para garantizar no duplicados |
| Datos existentes | Sin riesgo — la DB está vacía; en caso de re-ejecución ningún dato existente sería afectado |
| Auth settings | No se modifica — el usuario debe desactivar "Email confirmations" manualmente en el Dashboard |

---

## Configuración Auth requerida post-SQL (manual)

Ir a **Authentication → Settings** en el Dashboard de Supabase:

- [ ] Desactivar **"Enable email confirmations"** para registro inmediato sin verificación de email

> Sin este cambio el registro de usuarios funciona pero devuelve sesión `null` hasta que el usuario verifique su email.

---

**Pendiente de aprobación. Una vez confirmado, ejecuto `restore_complete.sql` y genero `RESTORE_RESULT.md`.**
