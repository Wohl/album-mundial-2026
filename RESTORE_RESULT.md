# RESTORE_RESULT.md — Album Mundial 2026
## Reporte de restauración completada

> **Proyecto:** `hngymqusifirjurlyacv` (https://hngymqusifirjurlyacv.supabase.co)  
> **Fecha de ejecución:** 2026-05-29  
> **Resultado global:** EXITOSO — 0 errores de schema, 0 errores funcionales  
> **Schema: 31/31 PASS · Funcional: 28/28 PASS · Total: 59/59 PASS**

---

## 1. SQL ejecutado por bloque

### Bloque 1a — Tablas base + índices
**Resultado:** OK  
**Fuente:** `schema.sql`

| Objeto | Tipo | Estado |
|---|---|---|
| `profiles` | TABLE | CREADA |
| `sticker_states` | TABLE | CREADA |
| `trade_requests` | TABLE | CREADA |
| `idx_sticker_states_user` | INDEX | CREADO |
| `idx_sticker_states_key` | INDEX | CREADO |
| `idx_sticker_states_status` | INDEX | CREADO |
| `idx_trade_requests_owner` | INDEX | CREADO |
| `idx_trade_requests_requester` | INDEX | CREADO |
| `idx_trade_requests_status` | INDEX | CREADO |

### Bloque 1b — Funciones y triggers
**Resultado:** OK  
**Fuente:** `schema.sql`

| Objeto | Tipo | Estado |
|---|---|---|
| `update_updated_at_column()` | FUNCTION (TRIGGER) | CREADA |
| `handle_new_user()` | FUNCTION (SECURITY DEFINER) | CREADA |
| `trg_profiles_updated_at` | TRIGGER on `profiles` BEFORE UPDATE | CREADO |
| `trg_sticker_states_updated_at` | TRIGGER on `sticker_states` BEFORE UPDATE | CREADO |
| `trg_trade_requests_updated_at` | TRIGGER on `trade_requests` BEFORE UPDATE | CREADO |
| `on_auth_user_created` | TRIGGER on `auth.users` AFTER INSERT | CREADO |

### Bloque 1c — RLS habilitado + 9 policies
**Resultado:** OK  
**Fuente:** `schema.sql`

| Tabla | Política | Operación | Estado |
|---|---|---|---|
| `profiles` | `profiles_select` | SELECT | CREADA |
| `profiles` | `profiles_update` | UPDATE | CREADA |
| `sticker_states` | `stickers_select` | SELECT | CREADA |
| `sticker_states` | `stickers_insert` | INSERT | CREADA |
| `sticker_states` | `stickers_update` | UPDATE | CREADA |
| `sticker_states` | `stickers_delete` | DELETE | CREADA |
| `trade_requests` | `trades_select` | SELECT | CREADA |
| `trade_requests` | `trades_insert` | INSERT | CREADA |
| `trade_requests` | `trades_update` | UPDATE | CREADA |

### Bloque 2a — Columnas N:N en `trade_requests`
**Resultado:** OK  
**Fuente:** `migration_v3.sql`

| Columna | Tipo | Estado |
|---|---|---|
| `requested_sticker_keys` | TEXT[] NOT NULL DEFAULT '{}' | AGREGADA |
| `offered_sticker_keys` | TEXT[] NOT NULL DEFAULT '{}' | AGREGADA |
| `counter_requested_keys` | TEXT[] NULL | AGREGADA |
| `counter_offered_keys` | TEXT[] NULL | AGREGADA |
| `counter_by` | UUID NULL → FK auth.users | AGREGADA |
| `trade_requests_status_check` | CHECK constraint actualizado (+countered) | ACTUALIZADO |

### Bloque 2b — RPC `accept_trade` (versión final N:N)
**Resultado:** OK  
**Fuente:** `migration_v3.sql`

| Objeto | Tipo | Estado |
|---|---|---|
| `accept_trade(p_trade_id UUID)` | FUNCTION SECURITY DEFINER | CREADA/REEMPLAZADA |

### Bloque 2c — RPC `counter_trade`
**Resultado:** OK  
**Fuente:** `migration_v3.sql`

| Objeto | Tipo | Estado |
|---|---|---|
| `counter_trade(UUID, TEXT[], TEXT[])` | FUNCTION SECURITY DEFINER | CREADA |

### Bloque 3 — `pack_items` + índice + 3 policies
**Resultado:** OK  
**Fuente:** `supabase-pack-items-migration.sql`

| Objeto | Tipo | Estado |
|---|---|---|
| `pack_items` | TABLE | CREADA |
| `pack_items_owner_unopened` | INDEX PARCIAL (WHERE opened_at IS NULL) | CREADO |
| `Usuarios ven sus propios pack_items` | RLS SELECT | CREADA |
| `Usuarios insertan sus propios pack_items` | RLS INSERT | CREADA |
| `Usuarios actualizan sus propios pack_items` | RLS UPDATE | CREADA |

### Bloque 4 — RPCs del Dashboard (reconstruidas)
**Resultado:** OK  
**Fuente:** Reconstruidas desde `src/services/dashboardService.ts` (no existían en ningún SQL del repo)

| Objeto | Retorna | Estado |
|---|---|---|
| `dashboard_user_counts()` | TABLE(user_id UUID, owned_count BIGINT, extra_count BIGINT) | CREADA |
| `dashboard_wanted_stickers(lmt INT)` | TABLE(sticker_key TEXT, cnt BIGINT) | CREADA |
| `dashboard_available_stickers(lmt INT)` | TABLE(sticker_key TEXT, cnt BIGINT) | CREADA |

### Bloque 5 — Realtime publication
**Resultado:** OK

| Tabla | Publication | Estado |
|---|---|---|
| `sticker_states` | `supabase_realtime` | AGREGADA |
| `trade_requests` | `supabase_realtime` | AGREGADA |
| `pack_items` | `supabase_realtime` | AGREGADA |

---

## 2. Validación de schema (Management API)

**31/31 checks PASS**

| Categoría | Esperado | Encontrado | Estado |
|---|---|---|---|
| Tablas | 4 | 4 | PASS |
| RLS policies en `profiles` | 2 | 2 | PASS |
| RLS policies en `sticker_states` | 4 | 4 | PASS |
| RLS policies en `trade_requests` | 3 | 3 | PASS |
| RLS policies en `pack_items` | 3 | 3 | PASS |
| Trigger `on_auth_user_created` | presente | presente | PASS |
| Trigger `trg_profiles_updated_at` | presente | presente | PASS |
| Trigger `trg_sticker_states_updated_at` | presente | presente | PASS |
| Trigger `trg_trade_requests_updated_at` | presente | presente | PASS |
| Función `accept_trade()` | presente | presente | PASS |
| Función `counter_trade()` | presente | presente | PASS |
| Función `dashboard_available_stickers()` | presente | presente | PASS |
| Función `dashboard_user_counts()` | presente | presente | PASS |
| Función `dashboard_wanted_stickers()` | presente | presente | PASS |
| Función `handle_new_user()` | presente | presente | PASS |
| Función `update_updated_at_column()` | presente | presente | PASS |
| Realtime en `pack_items` | presente | presente | PASS |
| Realtime en `sticker_states` | presente | presente | PASS |
| Realtime en `trade_requests` | presente | presente | PASS |
| Columna `requested_sticker_keys` | presente | presente | PASS |
| Columna `offered_sticker_keys` | presente | presente | PASS |
| Columna `counter_requested_keys` | presente | presente | PASS |
| Columna `counter_offered_keys` | presente | presente | PASS |
| Columna `counter_by` | presente | presente | PASS |

---

## 3. Validación funcional end-to-end

**28/28 checks PASS — 0 fallos**

### A. Creación de usuarios de prueba (admin API)
| Test | Estado |
|---|---|
| Admin create user1 (val1_...@example.com) | PASS |
| Admin create user2 (val2_...@example.com) | PASS |

### B. Trigger `on_auth_user_created` — perfil automático
| Test | Estado |
|---|---|
| 2 perfiles creados automáticamente por trigger | PASS |
| display_name de user1 correcto (desde raw_user_meta_data) | PASS |
| display_name de user2 correcto (desde raw_user_meta_data) | PASS |

### C. Auth — `signInWithPassword`
| Test | Estado |
|---|---|
| User1 signInWithPassword → JWT obtenido | PASS |
| User2 signInWithPassword → JWT obtenido | PASS |

### D. Sticker states — CRUD con RLS
| Test | Estado |
|---|---|
| INSERT sticker_state ARG-01 (owned) — user1 | PASS |
| UPDATE sticker_state ARG-01 → repeated/repeat_count=2 | PASS |
| SELECT sticker_state — datos correctos post-UPDATE | PASS |
| INSERT sticker_state BRA-01 (repeated) — user2 (para trade) | PASS |

### E. Trade request + `accept_trade` RPC
| Test | Estado |
|---|---|
| INSERT trade_request (user1 pide BRA-01 de user2, ofrece ARG-01) | PASS |
| RPC `accept_trade()` ejecutada por user2 (owner) sin error | PASS |
| trade_requests.status = 'accepted' post-RPC | PASS |

### F. `counter_trade` RPC
| Test | Estado |
|---|---|
| RPC `counter_trade()` ejecutada por user2 (owner) sin error | PASS |
| trade_requests.status = 'countered' post-RPC | PASS |
| counter_by = user2.id (correcto) | PASS |

### G. Pack items
| Test | Estado |
|---|---|
| INSERT pack_item vinculado a trade_id | PASS |
| SELECT pack_items WHERE opened_at IS NULL (1 fila) | PASS |
| UPDATE pack_item.opened_at (marcar como abierto) | PASS |

### H. Dashboard RPCs
| Test | Estado |
|---|---|
| `dashboard_user_counts()` → 2 filas (una por usuario) | PASS |
| `dashboard_wanted_stickers(3)` → ejecuta sin error | PASS |
| `dashboard_available_stickers(3)` → 1 fila (BRA-01 repeated de user2) | PASS |

### I. Realtime publication
| Test | Estado |
|---|---|
| `sticker_states` en publication `supabase_realtime` | PASS |
| `trade_requests` en publication `supabase_realtime` | PASS |
| `pack_items` en publication `supabase_realtime` | PASS |

### Z. Limpieza post-validación
| Test | Estado |
|---|---|
| Usuario de prueba 1 eliminado | PASS |
| Usuario de prueba 2 eliminado | PASS |

---

## 4. Objetos faltantes o diferencias respecto al proyecto original

| Item | Estado | Detalle |
|---|---|---|
| `dashboard_user_counts` | RECREADA | No estaba en ningún SQL del repo — reconstruida desde el código que la consume |
| `dashboard_wanted_stickers` | RECREADA | Ídem |
| `dashboard_available_stickers` | RECREADA | Ídem |
| Datos de usuarios | IRRECUPERABLE | Los usuarios del proyecto eliminado no se pueden recuperar — deberán registrarse nuevamente |
| Sticker states históricos | IRRECUPERABLE | Vivían en el proyecto eliminado |
| Trade requests históricos | IRRECUPERABLE | Ídem |
| Pack items históricos | IRRECUPERABLE | Ídem |

---

## 5. Acción manual pendiente

**Authentication → Settings en el Dashboard de Supabase:**

- [ ] Desactivar **"Enable email confirmations"** para que el registro sea inmediato sin verificación de email

> Sin este cambio, usuarios nuevos que se registren vía la app recibirán un email de confirmación y no podrán acceder hasta verificarlo. Si el SMTP no está configurado, el email nunca llega.

---

## 6. Próximos pasos

1. Desactivar "Email confirmations" en Authentication → Settings del Dashboard
2. Actualizar variables de entorno en Vercel (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
3. Hacer redeploy en Vercel
4. Verificar app en producción con un registro real
5. (Opcional) Configurar SMTP propio en Supabase para emails de reset de contraseña

---

## 7. Archivos generados durante la restauración

| Archivo | Propósito |
|---|---|
| `restore_complete.sql` | SQL consolidado de toda la restauración (reutilizable) |
| `RECOVERY_PLAN.md` | Plan documentado de recuperación |
| `RESTORE_PREVIEW.md` | Vista previa aprobada antes de ejecutar |
| `RESTORE_RESULT.md` | Este documento — resultado completo |
| `scripts/execute_restore.mjs` | Script Node.js para re-ejecutar via Management API |
| `scripts/validate_restore.mjs` | Script de validación reutilizable |
| `scripts/_run_functional_validation.mjs` | Script de validación funcional ejecutado |
| `validation_results.json` | Resultado de validación en JSON |
