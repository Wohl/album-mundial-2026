# Predicciones Simples — Deploy Summary
**Fecha:** 2026-06-03  
**Trigger:** Revisión de seguridad pre-deploy + aviso Codespace  
**Estado:** ✅ Desplegado y verificado en producción

---

## Estado Git antes del push

### Commits pendientes (5 commits ahead de origin/main)

```
4580eb7  chore: preserve docs, scripts and public asset (Codespace cleanup)
696a545  feat: Predicciones simples por partido (localStorage MVP)
336ab82  feat: Sprint 6A — Quiniela foundation (schema, types, services, kickoff)
e73ed09  docs: Sprint 6 — Quiniela architecture plan + scoring proposal
9770b09  feat: Sprint 5 — Timeline expandible de eventos live
```

### Archivos sin trackear encontrados

| Archivo/Dir | Tamaño | Acción tomada |
|-------------|--------|---------------|
| `*.md` de deploy anteriores (6 archivos) | ~25 KB | ✅ Commiteados |
| `scripts/_full_validation.mjs` | ~5 KB | ✅ Commiteado |
| `scripts/_run_functional_validation.mjs` | ~2 KB | ✅ Commiteado |
| `validation_results.json` | ~3 KB | ✅ Commiteado |
| `public/2026_FIFA_World_Cup_emblem.svg.png` | 713 KB | ✅ Commiteado |
| `ALEMANHA_preview_p1.png` | 4.9 MB | ⚠️ Sin commitear (binario grande) |
| `ALEMANHA_preview_p2.png` | 684 KB | ⚠️ Sin commitear (binario grande) |
| `ARGENTINA_preview_p1.png` | 6.0 MB | ⚠️ Sin commitear (binario grande) |
| `VECTORES/` (16 PDFs de diseño) | **88 MB** | ❌ No commiteado — inflaría repo |
| `public/ChatGPT Image 15 may 2026...png` | ~1 MB | ⚠️ Sin commitear |

**Decisión sobre binarios grandes:** VECTORES/ (88 MB) no se committea a git por policy de tamaño. Los archivos `.png` de preview tampoco. Recomendado almacenarlos en Google Drive o similar.

### Archivos modificados sin commit: NINGUNO

El working tree de archivos trackeados estaba **limpio** antes del push.

---

## Commit desplegado

```
HEAD: 4580eb7  (último commit al pushear)
Ultimo commit de codigo: 696a545 feat: Predicciones simples por partido
```

---

## Archivos en los commits de código desplegados

### Sprint 5 — Timeline expandible (`9770b09`)
- `src/components/CalendarView.tsx`
- `src/components/FriendliesView.tsx`
- `src/components/LiveEventsBlock.tsx`

### Sprint 6 docs (`e73ed09`)
- `QUINIELA_ARCHITECTURE_PLAN.md`
- `QUINIELA_SCORING_PROPOSAL.md`

### Sprint 6A — Quiniela foundation (`336ab82`)
- `src/types/quiniela.ts`
- `src/lib/quiniela/config.ts`
- `src/lib/quiniela/kickoff.ts`
- `src/services/quinielaService.ts`
- `quiniela_schema_v1.sql`
- `quiniela_seed.sql`

### Predicciones Simples (`696a545`)
- `src/hooks/usePredictions.ts`
- `src/components/PredictionsView.tsx`
- `src/app/page.tsx`

---

## Archivos protegidos — NINGUNO modificado

```
Supabase / auth / RLS / RPCs / marketplace / trades /
backups / restore / PDF / álbum / live API / favoritos → ✅ INTACTOS
```

---

## Resultado TypeScript

```
npx tsc --noEmit → (sin output) → 0 errores ✅
```

---

## Resultado build

```
Route (app)                              Size     First Load JS
┌ ○ /                                    176 kB          263 kB
├ ƒ /api/live/friendlies                 0 B                0 B
├ ƒ /api/live/match/[id]                 0 B                0 B
└ ƒ /api/live/wc                         0 B                0 B

✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (6/6)
```

---

## Resultado deploy

| Campo | Valor |
|-------|-------|
| Deployment ID | `64g2tmo6m` |
| URL de deploy | `https://album-mundial-2026-64g2tmo6m-juan-pablos-projects-759821b5.vercel.app` |
| URL de producción | `https://album-mundial-2026-omega.vercel.app` |
| Status | ● Ready |
| Duración | **42 segundos** |
| Commits pusheados | 5 (ahead de origin: 975e692 → 4580eb7) |

---

## Bundle final

| Métrica | Valor |
|---------|-------|
| Página principal | **176 kB** |
| First Load JS total | 263 kB |
| Route Handlers | 0 B (server-side) |
| API key en bundle cliente | ❌ No presente ✅ |

---

## Verificaciones post-deploy

| Check | Resultado |
|-------|-----------|
| HTTP 200 app principal | ✅ |
| `/api/live/wc?date=2026-06-11` | ✅ `api-football` · count=1 (MEX vs RSA) |
| `/api/live/friendlies` | ✅ `api-football` · count=76 |
| Live Data activo | ✅ API key en Vercel Production |
| Tab "Predicciones" activo | ✅ (antes era "Próximamente") |
| Calendario funcional | ✅ Sin cambios regresivos |
| Amistosos funcional | ✅ Sin cambios regresivos |
| Dashboard funcional | ✅ Sin cambios regresivos |
| Álbum funcional | ✅ Sin cambios regresivos |
| Marketplace funcional | ✅ Sin cambios regresivos |

---

## Riesgos pendientes

| Riesgo | Severidad | Acción |
|--------|-----------|--------|
| VECTORES/ (88 MB PDFs) sin backup en git | Media | Guardar en Google Drive o storage externo |
| Preview PNGs (~12 MB) sin backup en git | Baja | Ídem |
| ChatGPT asset en public/ sin commitear | Baja | Si se necesita en UI, agregar al repo manualmente |
| Predicciones solo en localStorage (device) | Baja | MVP aceptable; migrar a Supabase en fase futura |

---

## Estado del Codespace

- **Commits no pusheados:** ✅ Todos pusheados (0 pendientes)
- **Archivos trackeados modificados sin commit:** ✅ Ninguno
- **Archivos sin trackear de riesgo:** VECTORES/ + preview PNGs (binarios grandes, no en git)
- El Codespace puede eliminarse sin pérdida de código fuente.

---

## Próximos pasos recomendados

1. **Guardar VECTORES/ en Google Drive** — 88 MB de PDFs de diseño no van al repo
2. **Verificar predicciones en producción** — abrir el tab "Predicciones" y guardar una
3. **Monitorear rate limits** de apifootball.com cuando comiencen los primeros amistosos con múltiples partidos live
4. **Antes de Jun 11** — verificar que MEX vs RSA (id=710281) se actualice a `live` correctamente
5. **Fase siguiente opcional** — conectar predicciones a Supabase (migrar `usePredictions` → `quinielaService`) si se desea ranking o sincronización multi-dispositivo
