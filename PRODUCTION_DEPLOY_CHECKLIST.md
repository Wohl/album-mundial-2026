# PRODUCTION_DEPLOY_CHECKLIST.md — Album Mundial 2026
## Pasos requeridos antes de actualizar Vercel y redesplegar producción

> **Fecha:** 2026-05-29  
> **Proyecto Supabase nuevo:** `hngymqusifirjurlyacv`  
> **Proyecto Vercel:** `album-mundial-2026` (`prj_OnQruToUZl1dAktlJtmTKRpFExci`)  
> **Branch activo:** `main` (up to date con origin/main)

---

## Estado actual

| Componente | Estado |
|---|---|
| Base de datos nueva | ✅ Restaurada y validada (59/59 tests) |
| Validación funcional | ✅ 69 PASS, 0 FAIL, 0 regresiones |
| Dev server local | ✅ HTTP 200, build limpio |
| Variables en `.env.local` | ✅ Apuntan al nuevo proyecto |
| Variables en Vercel (Producción) | ❌ **AÚN APUNTAN AL PROYECTO ELIMINADO** |
| Email confirmations desactivado | ⚠️ **PENDIENTE** |
| SMTP configurado | ⚠️ Opcional pero recomendado |
| Código commiteado | ⚠️ 4 archivos modificados sin commit |

---

## PASO 1 — Supabase Dashboard: desactivar email confirmations

**Dónde:** https://supabase.com/dashboard/project/hngymqusifirjurlyacv/auth/providers

1. Ir a **Authentication → Settings**
2. En la sección **Email Auth**, desactivar **"Enable email confirmations"**
3. Guardar

**Por qué es crítico:** Sin esto, cada usuario que se registre recibirá un email de confirmación. Si el SMTP no está configurado, el email nunca llega y el usuario queda bloqueado. La validación confirmó que el endpoint `/auth/v1/recover` retorna 400 si no hay SMTP activo.

**Riesgo si se omite:** Los usuarios nuevos no podrán acceder a la app hasta confirmar su email.

---

## PASO 2 — Supabase Dashboard: configurar Auth URL (redirect)

**Dónde:** https://supabase.com/dashboard/project/hngymqusifirjurlyacv/auth/url-configuration

1. Ir a **Authentication → URL Configuration**
2. Configurar **Site URL:** `https://album-mundial-2026-omega.vercel.app` (o la URL de producción de Vercel)
3. Agregar en **Redirect URLs:** `https://album-mundial-2026-omega.vercel.app/**`
4. Guardar

**Por qué:** El `useAuth.ts` usa `process.env.NEXT_PUBLIC_SITE_URL` como `redirectTo` para el reset de contraseña. Si la URL no está en la allowlist de Supabase, el reset de contraseña fallará.

---

## PASO 3 — Vercel: actualizar variables de entorno de producción

**Dónde:** https://vercel.com/juan-pablos-projects-759821b5/album-mundial-2026/settings/environment-variables

Las variables de producción actuales aún apuntan al **proyecto eliminado** (`lwttzrboabtfweassaxr`). Actualizar:

### Variables a actualizar/agregar (Production + Preview)

| Variable | Valor nuevo | Entornos |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hngymqusifirjurlyacv.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(anon key del nuevo proyecto — ver Settings → API)* | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_kMkzEUFMiBIfEcTJ12x7Ag_rThzpPLt` | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | `https://album-mundial-2026-omega.vercel.app` | Production |
| `NEXT_PUBLIC_OFFLINE_MODE` | `false` | Production, Preview |

**Para obtener el anon key del nuevo proyecto:**  
Supabase Dashboard → `hngymqusifirjurlyacv` → Settings → API → Project API Keys → `anon public`

### Variables a eliminar o ignorar (del proyecto viejo — ya no sirven)

Las siguientes variables en Vercel apuntan al proyecto eliminado. No bloquean el deploy pero son ruido — pueden eliminarse en cualquier momento:
- `NEXT_PUBLIC_lwttzrboabtfweassaxr_SUPABASE_*`
- `lwttzrboabtfweassaxr_POSTGRES_*`
- `lwttzrboabtfweassaxr_SUPABASE_*`

---

## PASO 4 — Commit de los cambios locales

Los siguientes archivos fueron modificados durante la restauración y deben commitearse:

```
.mcp.json           — project_ref actualizado a hngymqusifirjurlyacv
package.json        — @supabase/ssr agregado como dependencia
package-lock.json   — lockfile actualizado
src/lib/supabase.ts — lee NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY con fallback
```

Archivos nuevos a incluir en el commit:

```
src/middleware.ts               — SSR session refresh middleware (nuevo)
src/utils/supabase/client.ts    — browser client helper (nuevo)
src/utils/supabase/server.ts    — server client helper (nuevo)
src/utils/supabase/middleware.ts — middleware helper (nuevo)
restore_complete.sql            — SQL de restauración completa (documentación)
RECOVERY_PLAN.md                — plan de recuperación (documentación)
RESTORE_PREVIEW.md              — preview aprobado (documentación)
RESTORE_RESULT.md               — resultado de restauración (documentación)
VALIDATION_REPORT.md            — reporte de validación (documentación)
PRODUCTION_DEPLOY_CHECKLIST.md  — este archivo (documentación)
```

**Comando sugerido:**
```bash
git add .mcp.json package.json package-lock.json src/lib/supabase.ts \
        src/middleware.ts src/utils/ \
        restore_complete.sql RECOVERY_PLAN.md RESTORE_PREVIEW.md \
        RESTORE_RESULT.md VALIDATION_REPORT.md PRODUCTION_DEPLOY_CHECKLIST.md
git commit -m "chore: migrate to new Supabase project (hngymqusifirjurlyacv)

- Add @supabase/ssr with server/client/middleware helpers
- Update supabase.ts to read NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- Add src/middleware.ts for SSR session refresh
- Update .mcp.json project_ref
- Add restore_complete.sql and recovery documentation"
```

> **No commitear:** `.env.local`, `.env`, `scripts/_*.mjs`, `validation_results.json` (contienen credenciales o son scripts temporales de validación).

---

## PASO 5 — Vercel: redesplegar

Una vez actualizadas las variables de entorno en Vercel y el código commiteado y pusheado:

1. Ir a https://vercel.com/juan-pablos-projects-759821b5/album-mundial-2026
2. Hacer click en **Redeploy** en el último deployment (sin necesidad de nuevo commit si las env vars ya se actualizaron)
3. O hacer `git push origin main` para triggerear el deploy automático

---

## PASO 6 — Validación post-deploy en producción

Después del redeploy, verificar manualmente en la URL de producción:

- [ ] La página carga sin errores de consola
- [ ] El modal de login/registro aparece (confirma que Supabase está conectado)
- [ ] Registrar un usuario nuevo → confirmar que puede acceder sin confirmación de email
- [ ] El perfil aparece automáticamente (trigger funcionando en producción)
- [ ] Marcar una figurita → persiste al recargar
- [ ] El tab "Mercado" carga sin errores de red
- [ ] El tab "Dashboard" carga estadísticas (pueden estar en 0 si no hay datos aún)
- [ ] La campana de notificaciones abre sin errores

---

## PASO 7 — (Opcional) Configurar SMTP para reset de contraseña

Si se requiere la funcionalidad de reset de contraseña:

**Dónde:** Supabase Dashboard → Authentication → SMTP Settings

Opciones:
- **Resend** (recomendado, plan gratis): https://resend.com
- **SendGrid**
- **Postmark**
- SMTP propio

El código en `useAuth.ts` ya está preparado — solo requiere que Supabase tenga SMTP activo.

---

## PASO 8 — (Opcional) Limpiar Vercel de variables del proyecto viejo

Una vez confirmado que el redeploy funciona correctamente:

Eliminar de Vercel las variables prefijadas con `lwttzrboabtfweassaxr_*` y `NEXT_PUBLIC_lwttzrboabtfweassaxr_*` ya que son del proyecto eliminado y ya no son necesarias.

---

## Resumen de orden de ejecución

```
[Supabase Dashboard]
1. ✅ DB restaurada y validada (ya hecho)
2. ⬜ Authentication → Settings → Desactivar "Enable email confirmations"
3. ⬜ Authentication → URL Configuration → Agregar URL de producción

[Local]
4. ⬜ git add + git commit con archivos modificados y nuevos
5. ⬜ git push origin main

[Vercel]
6. ⬜ Settings → Environment Variables → Actualizar URL + ANON_KEY + PUBLISHABLE_KEY
7. ⬜ Redeploy (automático con push o manual desde dashboard)

[Post-deploy]
8. ⬜ Validación manual en URL de producción (checklist del Paso 6)
9. ⬜ (Opcional) Configurar SMTP para password reset
10. ⬜ (Opcional) Eliminar variables del proyecto viejo de Vercel
```

---

## Riesgos identificados

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Usuarios existentes del viejo proyecto intentan acceder | Media | Los datos son irrecuperables. Comunicar a usuarios que deben registrarse nuevamente. |
| Email confirmations bloquea nuevos registros | Alta si se omite el Paso 2 | Desactivar en Supabase Dashboard antes del redeploy |
| Vercel usa variables viejas después del redeploy | Alta si se omite el Paso 3 | Verificar variables ANTES de hacer redeploy |
| La URL de redirect para password reset falla | Baja | Configurar Site URL en Supabase Auth URL Configuration |
| `fetchRecentTrades` retorna siempre vacío | Certeza | Bug pre-existente — no bloquea producción, feed de actividad vacío |
