# POST_DEPLOY_VALIDATION.md — Album Mundial 2026
## Checklist de validación post-deploy en producción

> **URL de producción:** https://album-mundial-2026-omega.vercel.app  
> **Proyecto Supabase:** `hngymqusifirjurlyacv`  
> **Commit desplegado:** `fa876c2` — merge de cambios marketplace/PDF + migración Supabase  
> **Fecha:** 2026-05-29

Ejecutar este checklist manualmente en el navegador usando la URL de producción.  
Cada check tiene el resultado esperado y cómo detectar un fallo.

---

## PRE-CHECK: Verificar que el deploy completó

Antes de comenzar, confirmar en https://vercel.com/juan-pablos-projects-759821b5/album-mundial-2026 que el último deployment tiene estado **Ready** (no Building, ni Error).

---

## CHECK 1 — Carga de la app

**URL:** https://album-mundial-2026-omega.vercel.app

**Pasos:**
1. Abrir la URL en modo incógnito (para sesión limpia)
2. Abrir DevTools → Console (F12)
3. Abrir DevTools → Network

**Resultado esperado:**
- La página carga con la pantalla de login/registro (modal `AuthModal`)
- No hay errores rojos en Console
- No hay requests con estado `401`, `403`, `500` en Network
- El favicon y estilos cargan correctamente

**Señal de fallo:**
- Página en blanco o error `Application error`
- Error en consola: `Supabase credentials not configured` → variables de entorno mal configuradas en Vercel
- Error: `Failed to fetch` → problema de conectividad con Supabase

---

## CHECK 2 — Registro de usuario nuevo

**Pasos:**
1. En el modal de auth, ir a la pestaña **Crear cuenta**
2. Ingresar email válido (ej: `tumail+test1@gmail.com`), contraseña fuerte, nombre de usuario
3. Hacer click en **Crear cuenta**

**Resultado esperado:**
- El modal se cierra inmediatamente
- La app muestra el álbum con el nombre ingresado en el header
- No se recibe email de confirmación (confirmations están desactivadas)
- En Network: `POST /auth/v1/token` retorna `200` con `access_token`

**Señal de fallo:**
- Mensaje "Check your email for confirmation" → email confirmations activas (ir a Supabase Dashboard → Auth → Settings → desactivar)
- Error `invalid email` → dominio del email bloqueado (usar un dominio real)
- La app carga pero muestra el modal nuevamente → token no se guardó en cookie

---

## CHECK 3 — Verificar creación automática de perfil (trigger)

**Pasos:**  
Inmediatamente después del registro exitoso (CHECK 2):
1. Confirmar que en el header aparece el nombre que ingresaste
2. Hacer click en el avatar/nombre → abrir **Mi perfil** (ProfileModal)
3. Verificar que muestra el display_name correcto

**Resultado esperado:**
- El nombre aparece correctamente en el header y en el modal de perfil
- En Supabase Dashboard → Table Editor → `profiles` → aparece la fila del nuevo usuario con el `display_name` correcto

**Señal de fallo:**
- Header muestra "Usuario" o vacío → el trigger `on_auth_user_created` no ejecutó
- ProfileModal muestra datos vacíos → RLS de `profiles` mal configurada

---

## CHECK 4 — Login y logout

**Pasos:**
1. Hacer click en el ícono de logout (→ en el header)
2. Confirmar que vuelve a aparecer el modal de auth
3. En la pestaña **Iniciar sesión**, ingresar las mismas credenciales del CHECK 2
4. Hacer click en **Iniciar sesión**

**Resultado esperado:**
- Logout: modal de auth aparece correctamente
- Login: app carga el álbum con el mismo usuario
- En Network: POST `/auth/v1/token?grant_type=password` → `200`

**Señal de fallo:**
- Login retorna error `Invalid login credentials` → credenciales incorrectas o proyecto incorrecto
- Después del login vuelve a pedir login → cookies de sesión no se están guardando

---

## CHECK 5 — Sticker ownership update

**Pasos:**
1. Ir al tab **Equipos** → seleccionar cualquier selección (ej: Argentina)
2. Hacer click en cualquier figurita para marcarla como **Tengo** (clic izquierdo)
3. Recargar la página (F5)
4. Volver al mismo equipo

**Resultado esperado:**
- La figurita queda marcada con el estado correcto (color/borde verde)
- Después de recargar, el estado persiste
- El progress bar muestra `1/994` o similar
- En Network: `POST /rest/v1/sticker_states` → `201` al marcar; `GET /rest/v1/sticker_states` → `200` al cargar

**Señal de fallo:**
- El estado se pierde al recargar → la escritura en Supabase falla (verificar Network → 401/403 = problema de RLS o credenciales)
- Consola muestra `Error updating sticker` → verificar que las variables de entorno son correctas

---

## CHECK 6 — Sticker repetidas (repeat_count)

**Pasos:**
1. En una figurita ya marcada como **Tengo**, hacer click derecho → **Repetida**
2. Hacer click nuevamente en **Repetida** para incrementar el contador (si aplica en la UI)
3. Ir al tab **Extras** — verificar que la figurita aparece en la lista

**Resultado esperado:**
- La figurita aparece en el tab Extras con el contador correcto
- El tab **Stats** muestra el conteo actualizado en "Extras"

**Señal de fallo:**
- El estado no cambia a repetida
- La figurita no aparece en el tab Extras

---

## CHECK 7 — Marketplace (mercado de intercambio)

**Pasos:**
1. Ir al tab **Mercado**
2. Verificar que carga sin errores (puede estar vacío si eres el primer usuario)
3. Si hay más usuarios con figuritas repetidas: verificar que aparecen los matches/disponibles

**Resultado esperado:**
- El tab Mercado carga sin errores de consola ni de red
- Las secciones "Matches", "Disponibles" y "Mis intercambios" renderizan (pueden estar vacías)
- En Network: `GET /rest/v1/sticker_states?status=eq.repeated` → `200`
- En Network: `GET /rest/v1/trade_requests` → `200`

**Señal de fallo:**
- Error `PGRST116` o `42501` en consola → problema de RLS
- Marketplace no carga → problema de conexión o credenciales

---

## CHECK 8 — Trade creation

**Requiere:** Dos usuarios con figuritas repetidas.

**Pasos:**
1. Como Usuario A, marcar varias figuritas como repetidas
2. Como Usuario B (otra sesión/navegador), marcar figuritas que A no tiene
3. Usuario A va a Mercado → ve las figuritas de B en "Disponibles"
4. Usuario A propone un intercambio

**Resultado esperado:**
- El trade aparece en la lista de "Mis intercambios" con estado `pending`
- En Network: `POST /rest/v1/trade_requests` → `201`
- Usuario B recibe notificación (badge en la campana)

**Señal de fallo:**
- Error al crear el trade → RPC `accept_trade` no disponible o RLS mal
- Trade no aparece → política `trades_select` no funciona

---

## CHECK 9 — Trade acceptance

**Pasos (continuación del CHECK 8):**
1. Como Usuario B, ir a Mercado → ver el trade pendiente de Usuario A
2. Hacer click en **Aceptar**

**Resultado esperado:**
- El trade cambia a estado `accepted`
- Las figuritas se intercambian automáticamente (sticker_states actualizados)
- Usuario A recibe un pack_item (sobre con la figurita ganada)
- El modal "Abrir sobre" aparece en el header de Usuario A

**Señal de fallo:**
- Error `Solo el owner puede aceptar el intercambio` → RPC `accept_trade` funciona pero el usuario no es el owner correcto
- RPC retorna error → verificar en Supabase Dashboard → Logs

---

## CHECK 10 — Pack items y Realtime

**Resultado esperado (continuación del CHECK 9):**
- En el header de Usuario A aparece el botón **Abrir sobre** con un contador `1`
- Al hacer click, se muestra el modal de apertura de sobre con la figurita recibida
- El estado de la figurita en el álbum se actualiza
- En Network: `GET /rest/v1/pack_items` → `200` con las filas correspondientes

**Señal de fallo:**
- El botón de sobre no aparece → `pack_items` no se insertaron o la policy SELECT falla
- El modal de sobre aparece vacío
- El estado de la figurita no se actualiza tras abrir → realtime no funciona

**Test adicional de Realtime:**
- Con dos ventanas del navegador abiertas (mismo o distinto usuario)
- Actualizar una figurita en la ventana A → verificar que en la ventana B se actualiza automáticamente sin recargar

---

## CHECK 11 — Dashboard RPCs y estadísticas

**Pasos:**
1. Ir al tab **Dashboard**

**Resultado esperado:**
- La sección "Coleccionistas" muestra al menos 1 usuario
- "Figuritas" muestra el total de figuritas de todos los usuarios
- El ranking global muestra al usuario logueado con su progreso
- Las secciones "Más Buscadas" y "Más Disponibles" muestran datos o el mensaje "Sin datos"
- Los logros (achievements) se calculan correctamente
- En Network: `POST /rest/v1/rpc/dashboard_user_counts` → `200`
- En Network: `POST /rest/v1/rpc/dashboard_wanted_stickers` → `200`
- En Network: `POST /rest/v1/rpc/dashboard_available_stickers` → `200`

**Señal de fallo:**
- El dashboard carga con spinner infinito → alguna RPC falla
- Error en consola `Could not find the function` → las RPCs del dashboard no existen (volver a ejecutar el Bloque 4 de restore_complete.sql)
- La sección "Actividad Reciente" siempre está vacía → bug pre-existente de `fetchRecentTrades` (no bloquea, es conocido)

---

## CHECK 12 — Notificaciones

**Pasos:**
1. Hacer click en el ícono de campana (🔔) en el header

**Resultado esperado:**
- El panel de notificaciones se abre desde la derecha
- Muestra la lista de trades del usuario (pendientes, aceptados, etc.)
- Se puede cerrar correctamente

**Señal de fallo:**
- El panel no se abre (error de JavaScript)
- Muestra "Sin actividad" aunque haya trades

---

## CHECK 13 — Páginas de equipo y exportación PDF

**Pasos:**
1. Ir a **Equipos** → seleccionar una selección
2. Verificar que las 20 figuritas del equipo se muestran correctamente
3. Ir al tab **Stats** → verificar el progreso por selección
4. Si hay un botón de exportar PDF → hacer click

**Resultado esperado:**
- Las páginas de equipos cargan correctamente con los 20 slots
- Stats muestra el progreso correcto por selección con barras de progreso
- Si existe: la exportación PDF genera el documento sin errores

---

## CHECK 14 — Console y Network limpio

**Verificar que no hay:**
- Errores rojos en DevTools Console
- Requests fallidos (`4xx`, `5xx`) en DevTools Network
- Warnings de Supabase: `Supabase credentials not configured`
- Warnings de CORS
- Errores de `RLS` o `permission denied` en Supabase Logs

**Para ver Supabase Logs:** https://supabase.com/dashboard/project/hngymqusifirjurlyacv/logs/edge-logs

---

## Tabla de resultados

Marcar cada check después de validar:

| Check | Descripción | Resultado | Notas |
|---|---|---|---|
| 1 | App load sin errores de consola | ⬜ | |
| 2 | Registro de usuario nuevo (sin email confirmation) | ⬜ | |
| 3 | Perfil creado automáticamente por trigger | ⬜ | |
| 4 | Login + Logout funcional | ⬜ | |
| 5 | Sticker update persiste en DB | ⬜ | |
| 6 | Sticker repetidas + repeat_count | ⬜ | |
| 7 | Marketplace carga sin errores | ⬜ | |
| 8 | Trade creation (requiere 2 usuarios) | ⬜ | |
| 9 | Trade acceptance (RPC accept_trade) | ⬜ | |
| 10 | Pack items + Realtime events | ⬜ | |
| 11 | Dashboard RPCs + estadísticas | ⬜ | |
| 12 | Notificaciones panel | ⬜ | |
| 13 | Páginas de equipo + exportación | ⬜ | |
| 14 | Console y Network sin errores | ⬜ | |

---

## Si algo falla: diagnóstico rápido

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Supabase credentials not configured` | Variables de Vercel no actualizadas | Verificar Vercel → Settings → Env Vars |
| Modal de auth en loop | JWT no se persiste en cookies | Verificar src/middleware.ts desplegado |
| `PGRST116: table not found` | Schema no aplicado en nueva DB | Ejecutar restore_complete.sql en SQL Editor |
| `Could not find function dashboard_user_counts` | RPCs del dashboard no existen | Ejecutar Bloque 4 de restore_complete.sql |
| Trades no se ven entre usuarios | RLS policy `trades_select` falla | Verificar policy en Supabase Dashboard |
| Email de confirmación recibido | mailer_autoconfirm = false | Supabase → Auth → Settings → desactivar confirmations |
| Error 400 en password reset | SMTP no configurado | Configurar SMTP en Supabase → Auth → SMTP |
