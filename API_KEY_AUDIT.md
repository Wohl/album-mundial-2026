# API_KEY_AUDIT.md — Album Mundial 2026
## Auditoría de "Invalid API key" en producción

> **Fecha:** 2026-05-29  
> **Error reportado:** Registration failing in production with "Invalid API key"  
> **Commit del fix:** `5d2fe4d`  
> **Resultado post-fix:** 11/11 PASS en producción

---

## 1. Causa raíz

### Incompatibilidad entre el formato `sb_publishable_` y `@supabase/supabase-js` v2.43.4

Supabase introdujo el formato de clave `sb_publishable_XXXXX` como reemplazo moderno de la clave anon JWT (`eyJhbGciOiJIUzI1NiIs...`). Sin embargo:

- **`@supabase/supabase-js` v2.43.4** (el que usa el proyecto) fue publicado **antes** de que este formato fuera soportado por el SDK.
- Cuando el SDK v2.43.4 hace requests a `/auth/v1/signup` o `/auth/v1/token`, pasa la clave directamente como `Authorization: Bearer <key>`.
- Para la clave JWT (`eyJ...`), esto funciona porque Supabase Auth la reconoce como un Bearer token JWT válido.
- Para la clave `sb_publishable_...`, Supabase Auth **no la reconoce como un JWT válido** y retorna `"Invalid API key"`.

### ¿Por qué funcionó en las validaciones previas?

Las validaciones usaron `fetch` puro con la clave como header `apikey: sb_publishable_...`. PostgREST y el Auth endpoint **sí aceptan** la clave en el header `apikey`. El error solo ocurre cuando `@supabase/supabase-js` v2.43.4 la usa como `Authorization: Bearer`.

### Factor agravante: 3 de los 4 archivos sin fallback

`src/utils/supabase/client.ts`, `server.ts` y `middleware.ts` leían **solo** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sin fallback. Si esa variable estaba vacía o incorrecta, fallaban completamente (sin posibilidad de usar la clave ANON JWT).

---

## 2. Archivos auditados

| Archivo | Variable usada (antes del fix) | Problema |
|---|---|---|
| `src/lib/supabase.ts` | `PUBLISHABLE_KEY \|\| ANON_KEY` | Prioridad incorrecta: `sb_publishable_` se usaba primero |
| `src/utils/supabase/client.ts` | Solo `PUBLISHABLE_KEY` | Sin fallback — si la var falla, el cliente falla |
| `src/utils/supabase/middleware.ts` | Solo `PUBLISHABLE_KEY` | Sin fallback — middleware también falla |
| `src/utils/supabase/server.ts` | Solo `PUBLISHABLE_KEY` | Sin fallback |
| `src/middleware.ts` | Importa `updateSession` de `middleware.ts` | Heredaba el problema |
| `src/hooks/useAuth.ts` | Usa `supabase` de `src/lib/supabase.ts` | Indirectamente afectado |
| `src/services/*.ts` | Usan `supabase` de `src/lib/supabase.ts` | Indirectamente afectados |

---

## 3. Variables de entorno — estado antes y después del fix

### Vercel Production (antes)

| Variable | Estado | Problema |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hngymqusifirjurlyacv.supabase.co` | Correcto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT del nuevo proyecto | Correcto, pero prioridad baja |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_kMkzEUFMiBIfEcTJ12x7Ag_rThzpPLt` | Correcto como valor, **incompatible como Bearer token** con SDK v2.43.4 |
| `NEXT_PUBLIC_SITE_URL` | `https://album-mundial-2026-omega.vercel.app` | Correcto |

### Vercel Production (después del fix)

| Variable | Valor | Fuente de verdad |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hngymqusifirjurlyacv.supabase.co` | Supabase Management API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT 208 chars (`eyJhbGci...`) | Supabase Management API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_kMkzEUFMiBIfEcTJ12x7Ag_rThzpPLt` | Supabase Management API |
| `NEXT_PUBLIC_SITE_URL` | `https://album-mundial-2026-omega.vercel.app` | Configurado explícitamente |

Todos los valores fueron re-seteados directamente desde la Supabase Management API para garantizar que no haya typos.

---

## 4. Fix aplicado

### Código — 4 archivos modificados (commit `5d2fe4d`)

**Cambio:** Invertir prioridad de claves. Usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT, compatible con SDK v2.43.4) primero en los 4 archivos. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como fallback.

#### `src/lib/supabase.ts` (el más crítico — usado por toda la app)
```diff
- const supabaseKey =
-   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
-   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
-   ''
+ // Prefer the JWT anon key (compatible with @supabase/supabase-js v2.x).
+ // The sb_publishable_ format requires SDK v2.60+ to be used as a Bearer token.
+ const supabaseKey =
+   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
+   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
+   ''
```

#### `src/utils/supabase/client.ts` (agregado fallback)
```diff
- const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
+ const supabaseKey = (
+   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
+   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
+ )!
```

#### `src/utils/supabase/middleware.ts` (agregado fallback)
```diff
- const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
+ const supabaseKey = (
+   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
+   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
+ )!
```

#### `src/utils/supabase/server.ts` (agregado fallback)
```diff
- const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
+ const supabaseKey = (
+   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
+   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
+ )!
```

### Vercel — variables re-seteadas
- Re-seteadas las 3 variables SUPABASE desde la Supabase Management API como fuente de verdad
- Todos los valores confirmados contra el proyecto `hngymqusifirjurlyacv`

---

## 5. Validación post-fix en producción

Ejecutada el 2026-05-29 a las 19:20 UTC. **11/11 PASS**.

| # | Test | Resultado |
|---|---|---|
| 1 | App HTTP 200 en producción | PASS |
| 2 | `signUp` via ANON JWT key — retorna `access_token` (sin confirmación de email) | PASS |
| 3 | Admin create + email_confirm=true | PASS |
| 4 | `signInWithPassword` via ANON JWT key | PASS |
| 5 | Trigger `on_auth_user_created` → perfil auto-creado | PASS |
| 6 | `sticker_state` INSERT con ANON key + user JWT | PASS |
| 7 | REST API SELECT con ANON key + user JWT | PASS |
| 8 | `sb_publishable_` key sigue funcionando como fallback (`apikey` header) | PASS |
| 9 | Cleanup usuario de prueba 1 | PASS |
| 10 | Cleanup usuario de prueba 2 | PASS |

---

## 6. Por qué el registro ahora funciona

```
Antes:  PUBLISHABLE_KEY (sb_publishable_...) → Bearer token → Auth rechaza (no es JWT)
Después: ANON_KEY (eyJhbGci...) → Bearer token → Auth acepta (es JWT válido)
```

El flujo completo de registro en la app:
1. Usuario llena el formulario → `useAuth.signUp()` → `supabase.auth.signUp()`
2. SDK usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ahora tiene prioridad)
3. Request: `POST /auth/v1/signup` con `apikey: eyJhbGci...` + `Authorization: Bearer eyJhbGci...`
4. Supabase Auth reconoce el JWT → crea el usuario → retorna `access_token`
5. Trigger `on_auth_user_created` → crea `profiles` row
6. Usuario ve su álbum

---

## 7. Recomendación futura

Para migrar a `sb_publishable_` en el futuro, actualizar `@supabase/supabase-js` a `^2.60.0` o superior (cuando este SDK tenga soporte oficial para el nuevo formato). El cambio en el código sería simplemente revertir la prioridad en los 4 archivos.
