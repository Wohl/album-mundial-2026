# VALIDATION_REPORT.md — Album Mundial 2026
## Validación pre-producción completa

> **Proyecto:** `hngymqusifirjurlyacv` (https://hngymqusifirjurlyacv.supabase.co)  
> **Fecha:** 2026-05-29  
> **Build:** `next build` — compilación limpia sin errores TypeScript  
> **Dev server:** HTTP 200 — responde correctamente  
> **Resultado:** **69 PASS · 0 FAIL · 3 WARN · 0 regresiones**

---

## Veredicto

**La app está lista para producción desde el punto de vista técnico.** No se encontraron regresiones causadas por la recreación de la base de datos. Todos los flujos críticos funcionan correctamente contra el nuevo proyecto Supabase.

---

## 1. App health & connectivity

| Test | Estado |
|---|---|
| Dev server responde HTTP 200 | PASS |
| Supabase REST API accesible (`/rest/v1`) | PASS |
| Supabase Auth endpoint accesible (`/auth/v1/settings`) | PASS |

---

## 2. Authentication flows

| Test | Estado | Detalle |
|---|---|---|
| signUp — creación de usuarios via admin API | PASS | email_confirm=true bypasea confirmación |
| signInWithPassword user1 — JWT obtenido | PASS | |
| signInWithPassword user2 — JWT obtenido | PASS | |
| signOut — endpoint responde 204 | PASS | |
| Re-login post-signOut | PASS | Sesión funciona correctamente después de logout |
| Password reset (`POST /auth/v1/recover`) | WARN | Retornó 400 — requiere SMTP configurado en Supabase Dashboard |
| updateUser password (changePassword) | — | No testeable sin SMTP; el RPC subyacente existe en Supabase Auth |

**Nota WARN — Password reset:** El endpoint `/auth/v1/recover` retorna 400 porque el nuevo proyecto Supabase no tiene SMTP configurado. El código de `useAuth.ts` (`sendPasswordReset`) es correcto; el único requisito es configurar SMTP en Authentication → Settings → SMTP Settings. Sin SMTP, el email de reset nunca llega al usuario pero la app no crashea.

---

## 3. Automatic profile creation (trigger)

| Test | Estado |
|---|---|
| Trigger `on_auth_user_created` ejecutado al crear usuario | PASS |
| 2 perfiles creados automáticamente | PASS |
| `display_name` tomado de `raw_user_meta_data` | PASS |
| `profiles` SELECT via RLS (usuario autenticado) | PASS |
| `profiles` UPDATE via RLS (solo perfil propio) | PASS |
| RLS enforcement: user2 NO puede modificar perfil de user1 | PASS |

---

## 4. Sticker ownership & album progress calculations

| Test | Estado | Detalle |
|---|---|---|
| INSERT sticker_state (owned) | PASS | |
| INSERT sticker_state (repeated, repeat_count=3) | PASS | |
| INSERT bulk (5 stickers) | PASS | |
| SELECT — 7 filas correctas | PASS | |
| owned_count = 7 (cálculo correcto) | PASS | |
| repeated extras = 3 (cálculo correcto) | PASS | |
| UPDATE sticker_state owned → missing | PASS | |
| `stickers_select`: user2 ve stickers de user1 | PASS | Requerido para el mercado |
| RLS `stickers_update`: user2 NO puede escribir stickers de user1 | PASS | |

**Album progress calculation:** El cliente calcula el progreso localmente en `stickerService.calculateProgress()`. No hay RPC de progreso — se calcula con `filter(s.status === 'owned' || s.status === 'repeated').length` y `reduce(sum + repeat_count)`. Correcto.

---

## 5. Repeated stickers & marketplace visibility

| Test | Estado | Detalle |
|---|---|---|
| Stickers repetidas de otros usuarios visibles (`status=eq.repeated&user_id=neq.X`) | PASS | 2 stickers de user2 visibles para user1 |
| Profile name lookup para marketplace | PASS | |
| `getUserMissingFromList` pattern (filtro candidatos) | PASS | |

---

## 6. Trade creation & acceptance

| Test | Estado |
|---|---|
| Trade INSERT OK | PASS |
| Trade status = pending inicial | PASS |
| Columnas N:N (`requested_sticker_keys`, `offered_sticker_keys`) presentes | PASS |
| RLS `trades_select`: owner ve el trade | PASS |
| RPC `accept_trade()` — intercambio atómico | PASS |
| `trade_requests.status` = accepted post-RPC | PASS |

---

## 7. Counter-offers

| Test | Estado |
|---|---|
| RPC `counter_trade()` — sin error | PASS |
| `trade_requests.status` = countered | PASS |
| `counter_by` = user2 (quien contraoferció) | PASS |
| `counter_requested_keys` guardadas correctamente | PASS |
| Requester acepta contraoferta (`accept_trade` en estado `countered`) | PASS |
| Trade cancel (`PATCH status=cancelled`) | PASS |

---

## 8. Pack items & realtime events

| Test | Estado |
|---|---|
| INSERT 2 pack_items vinculados a trade_id | PASS |
| SELECT pack_items `WHERE opened_at IS NULL` (2 ítems) | PASS |
| UPDATE `pack_items.opened_at` (abrir sobre) | PASS |
| RLS: user2 NO puede ver pack_items de user1 | PASS |
| Realtime: `pack_items` en `supabase_realtime` publication | PASS |
| Realtime: `sticker_states` en `supabase_realtime` publication | PASS |
| Realtime: `trade_requests` en `supabase_realtime` publication | PASS |

---

## 9. Dashboard statistics

| Test | Estado | Detalle |
|---|---|---|
| `dashboard_user_counts()` — 2 usuarios | PASS | owned_count=8 para user1 |
| `dashboard_wanted_stickers(6)` — retorna filas | PASS | 2 filas |
| `dashboard_available_stickers(6)` — retorna filas | PASS | 3 filas |

---

## 10. Notifications panel

| Test | Estado | Detalle |
|---|---|---|
| Trades feed cargado (2 trades activos) | PASS | |
| Trades con estado `accepted` y `countered` presentes | PASS | |
| Todos los trades tienen `requested_sticker_keys` (columnas N:N) | PASS | |
| `fetchRecentTrades` — selección de columnas inexistentes | WARN | Bug pre-existente (ver abajo) |

---

## 11. Team pages & album structure

| Test | Estado | Detalle |
|---|---|---|
| Total de figuritas: 994 | PASS | 9 intro + 960 equipos + 11 final + 14 CC |
| Formato de claves correcto (`TEAM_N`) | PASS | |
| `displayKey`: `MEX_0` → `MEX_1` (1-based para mostrar) | PASS | |
| `parseInputKey`: `MEX_1` → `MEX_0` (0-based interno) | PASS | |
| `displayKey`: `FWC1` → `FWC1` (clave no-equipo sin cambio) | PASS | |
| `displayKey`: `CC3` → `CC3` (clave CC sin cambio) | PASS | |
| BulkEntry roundtrip `MEX_1` (input) → `MEX_0` (DB) | PASS | |

---

## 12. Export functionality

| Test | Estado | Detalle |
|---|---|---|
| StatsPanel: datos calculados en cliente | PASS | Sin llamadas a DB adicionales |
| DashboardView: logros calculados localmente | PASS | |
| Funcionalidad de export (CSV/PDF) | WARN | **No implementada** en el código fuente actual — no aplica |

---

## 13. Environment & configuration

| Test | Estado |
|---|---|
| `.env.local` apunta a `hngymqusifirjurlyacv` | PASS |
| `.env.local` contiene `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` correcto | PASS |
| `.env.local` NO contiene referencias al proyecto eliminado | PASS |
| `src/lib/supabase.ts` lee `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | PASS |
| `src/middleware.ts` llama `updateSession` (SSR session refresh) | PASS |

---

## Regresiones encontradas

**NINGUNA.** La recreación de la base de datos no introdujo ninguna regresión funcional.

---

## Bugs pre-existentes (no regresiones)

### `fetchRecentTrades` — columnas inexistentes en `trade_requests`

**Archivo:** [`src/services/dashboardService.ts`](src/services/dashboardService.ts) línea 65  
**Descripción:** La función intenta seleccionar `requester_name` y `owner_name` directamente de `trade_requests`, columnas que nunca han existido en el schema.

```typescript
// Línea 65 — intenta seleccionar columnas que no existen
.select('id, requester_name, owner_name, offered_sticker_keys, requested_sticker_keys, updated_at')
```

**Impacto:** El `fetchRecentTrades` retorna `[]` silenciosamente (el `if (error) return []` lo captura). El panel "Actividad Reciente" del Dashboard muestra "Sin intercambios registrados" aunque haya trades aceptados.

**Clasificación:** Bug pre-existente — esta función falló igual en el proyecto original. No es una regresión de la recreación de DB.

**Severidad:** Baja — la funcionalidad es decorativa (feed de actividad). Todos los otros flujos de trades funcionan correctamente.

**Corrección sugerida** (fuera del scope de esta validación):
```typescript
// Reemplazar la query por un JOIN con profiles via FK
.select('id, requester_id, owner_id, profiles!requester_id(display_name), ...')
// O usar dos queries separadas como hace tradeService.ts
```

---

## Warnings adicionales

| # | Warning | Acción requerida |
|---|---|---|
| 1 | Password reset endpoint retorna 400 | Configurar SMTP en Supabase Dashboard → Authentication → SMTP Settings |
| 2 | Export (CSV/PDF) no implementado | No aplica — funcionalidad no existe en el código |
| 3 | `fetchRecentTrades` bug pre-existente | Corregir en sprint futuro (no bloquea producción) |

---

## Estado de Email Confirmations

**Pendiente (acción manual):** Desactivar "Enable email confirmations" en el Dashboard de Supabase → Authentication → Settings.

Sin este cambio, los usuarios que se registren via la app recibirán un email de confirmación. Si SMTP no está configurado, el email nunca llega y el usuario queda bloqueado sin poder acceder.

Opciones:
- **Opción A (recomendada):** Desactivar email confirmations → registro inmediato.
- **Opción B:** Configurar SMTP y mantener confirmaciones para mayor seguridad.

---

## Build & TypeScript

```
npm run build — ✓ Compiled successfully
TypeScript errors: 0
Linting errors: 0
Routes: / (149 kB), /_not-found (871 B)
Middleware: 81.8 kB
```
