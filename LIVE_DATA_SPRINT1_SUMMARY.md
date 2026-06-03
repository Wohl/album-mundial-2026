# Live Data Sprint 1 — Summary
**Fecha:** 2026-06-03  
**Proveedor:** API-Football v3 (api-football.com)  
**Estado:** ✅ Build limpio — commit local, sin push

---

## Objetivo cumplido

La app puede consumir datos reales de API-Football **sin que el usuario vea ninguna diferencia**.  
La UI es idéntica al estado anterior. El pipeline de datos está completo y listo para activarse con una API key.

---

## Archivos creados / modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/lib/live-data/types/index.ts` | Modificado | Añadidos `LiveEventType`, `LiveEvent`, `events?` a `LiveMatch` |
| `src/lib/live-data/config.ts` | Nuevo | Config server-side: key, league IDs, TTLs de caché |
| `src/lib/live-data/mappers/team-code-map.ts` | Nuevo | Nombre inglés → código FIFA (48 WC + ~60 amistosos) |
| `src/lib/live-data/mappers/api-football-mapper.ts` | Nuevo | `ApiFbFixture` / `ApiFbEvent` → `LiveMatch` / `LiveEvent` |
| `src/lib/live-data/providers/api-football-provider.ts` | Nuevo | `ApiFootballProvider` implementa `LiveDataProvider` |
| `src/app/api/live/friendlies/route.ts` | Nuevo | Route Handler — amistosos internacionales |
| `src/app/api/live/wc/route.ts` | Nuevo | Route Handler — fixtures y live WC2026 |
| `src/app/api/live/match/[id]/route.ts` | Nuevo | Route Handler — detalle de partido + eventos |
| `src/lib/live-data/services/friendlies-service.ts` | Modificado | Llama a `/api/live/friendlies`; fallback a mock |
| `src/lib/live-data/services/wc-service.ts` | Nuevo | Servicios cliente para datos en vivo del Mundial |

**Sin cambios en:** UI, Supabase, auth, RLS, RPCs, trades, marketplace, álbum, Countdown Hero, Amistosos UI, favoritos, quiniela.

---

## Arquitectura implementada

```
Browser (FriendliesView / FavoriteMatchesBlock / MyTeamsView)
  │
  └─▶ getAllFriendlies() / getFriendliesByTeam()
        │
        └─▶ fetch('/api/live/friendlies?from=&to=')     ← HTTP, key nunca al cliente
              │
              ├── API_FOOTBALL_KEY configurada ──▶ ApiFootballProvider
              │                                      └─▶ api-football.com/v3/fixtures
              │
              └── API_FOOTBALL_KEY ausente ────▶ MockProvider (60 amistosos locales)
```

```
Route Handlers disponibles (server-side únicamente):
  GET /api/live/friendlies?from=YYYY-MM-DD&to=YYYY-MM-DD[&teamCode=ARG]
  GET /api/live/wc?date=YYYY-MM-DD[&live=true]
  GET /api/live/match/{fixtureId}
```

---

## Validaciones realizadas

| Validación | Resultado |
|------------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ Build limpio — sin regresión de bundle |
| Bundle cliente — búsqueda de `API_FOOTBALL_KEY` en `.next/static/` | ✅ 0 ocurrencias — key nunca expuesta |
| Fallback sin key: `GET /api/live/friendlies` | ✅ `source: mock \| count: 60` |
| Tamaño de página principal | ✅ 169 kB — sin cambio (0 código nuevo al cliente) |
| Route Handlers en build | ✅ `ƒ /api/live/friendlies`, `/api/live/wc`, `/api/live/match/[id]` |

---

## Para activar datos reales

1. Registrarse en [api-football.com](https://dashboard.api-football.com)
2. Obtener la API key (plan Free para dev, Starter para producción)
3. Añadir en `.env.local`:
   ```
   API_FOOTBALL_KEY=tu_key_aqui
   ```
4. Añadir en Vercel → Settings → Environment Variables:
   ```
   API_FOOTBALL_KEY = tu_key_aqui   (Production + Preview)
   ```
5. Verificar league IDs:
   - WC2026: probablemente `league_id=1` — confirmar en dashboard de API-Football
   - Friendlies: probablemente `league_id=9` — confirmar
   - Si difieren: sobreescribir con `API_FOOTBALL_WC_LEAGUE_ID` y `API_FOOTBALL_FRIENDLY_LEAGUE_ID`

---

## Caché implementado

| Endpoint | Con partidos live | Sin partidos live |
|----------|------------------|------------------|
| `/api/live/friendlies` | `s-maxage=60, swr=120` | `s-maxage=3600, swr=86400` |
| `/api/live/wc` | `s-maxage=60, swr=120` | `s-maxage=3600, swr=86400` |
| `/api/live/match/[id]` | `s-maxage=60, swr=120` | `s-maxage=3600, swr=86400` |

---

## Riesgos pendientes

| Riesgo | Severidad | Estado |
|--------|-----------|--------|
| League IDs de WC y Friendly pendientes de verificar con key real | Media | Pendiente — env var override disponible |
| Nombre de equipo no mapeado → fallback genérico (3 chars) | Baja | Mapa cubre 48 WC + ~60 amistosos; ampliar si aparece "UNK" en logs |
| Polling en cliente aún no implementado (se hace en Sprint 5) | — | Por diseño — Sprint 1 no cambia UI |
| CalendarView WC todavía usa datos estáticos | — | Por diseño — Sprint 6 |

---

## Próximo paso: Sprint 2

Para mostrar datos reales al usuario:
1. Añadir `API_FOOTBALL_KEY` en `.env.local` (verificar league IDs primero)
2. Verificar en navegador que `FriendliesView` muestra partidos reales
3. Sprint 2: añadir hook `useLiveMatches` con polling adaptativo (60s live / 5min idle)
4. Sprint 5: mostrar score y eventos en cards de partidos en vivo

---

## Bundle final

```
Route (app)                              Size     First Load JS
┌ ○ /                                    169 kB          256 kB   ← sin cambio
├ ƒ /api/live/friendlies                 0 B                0 B   ← server only
├ ƒ /api/live/match/[id]                 0 B                0 B   ← server only
└ ƒ /api/live/wc                         0 B                0 B   ← server only
```
