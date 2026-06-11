# LIVE_TIMELINE_BUG_REPORT
**Módulo:** WC Live Timeline — Calendario → Mundial 2026  
**Fecha de auditoría:** 2026-06-11  
**Estado:** BUGS IDENTIFICADOS — pendiente de fix

---

## Resumen ejecutivo

Los eventos (goles, tarjetas, cambios) no aparecen o aparecen desactualizados en los partidos
en vivo del Mundial en `CalendarView`. La causa no es un único fallo sino una cadena de cinco
problemas que se acumulan: un state local que silencia las actualizaciones automáticas del hook,
una ruta sin fallback mock, un hook del Dashboard que nunca pide eventos, una cabecera CDN que
permite datos obsoletos, y un intervalo de polling largo que retrasa la detección del kick-off.

---

## Archivos auditados

| Archivo | Propósito |
|---|---|
| `src/hooks/useLiveWc.ts` | Hook principal de polling WC (CalendarView) |
| `src/hooks/useLiveAll.ts` | Hook del Dashboard (LiveBlock) |
| `src/components/CalendarView.tsx` | Renderizado de tarjetas y overlay de eventos |
| `src/components/FriendliesView.tsx` | Referencia — Amistosos (funciona en mock) |
| `src/components/LiveEventsBlock.tsx` | Componente de timeline (sin bugs) |
| `src/app/api/live/wc/route.ts` | Route Handler del listado WC |
| `src/app/api/live/match/[id]/route.ts` | Route Handler del detalle (eventos) |
| `src/lib/live-data/providers/api-football-provider.ts` | Provider API-Football |
| `src/lib/live-data/providers/apifootball-provider.ts` | Provider apifootball.com |
| `src/lib/live-data/config.ts` | Configuración de TTLs y proveedores |
| `src/lib/live-data/mappers/api-football-mapper.ts` | Mapeador — `events` solo en `fetchMatchById` |
| `src/lib/live-data/types/index.ts` | `LiveMatch.events?: LiveEvent[]` — opcional |

---

## Bugs identificados

---

### BUG-1 — `cachedEvents` silencia actualizaciones automáticas del poll
**Severidad:** ALTA  
**Impacto en producción:** SÍ — afecta a cualquier usuario que expanda el timeline durante un partido

**Archivo:** `src/components/CalendarView.tsx`  
**Líneas clave:** 107, 125, 129-144

**Descripción:**

`MatchCard` tiene dos fuentes de eventos:
1. `liveOverlay.events` — actualizado automáticamente cada 60 s por `useLiveWc`
2. `cachedEvents` — state local, seteado cuando el usuario expande y hay un lazy-fetch

La prioridad es:
```typescript
// línea 125
const events: LiveEvent[] = cachedEvents ?? liveOverlay?.events ?? []
```

El lazy-fetch solo se dispara cuando `!liveOverlay?.events` (undefined/null):
```typescript
// línea 129-144
const handleToggle = async () => {
    if (!expanded && cachedEvents === null && !liveOverlay?.events) {
        // ...fetch → setCachedEvents(json?.match?.events ?? [])
    }
}
```

**Escenario problemático:**
1. Partido empieza — primer poll de `useLiveWc` falla o llega antes de que la API tenga eventos → `liveOverlay.events = undefined`
2. Usuario hace clic en "Ver eventos" → condición cumplida → lazy-fetch → `setCachedEvents([])` (vacío)
3. Gol en el minuto 15 → `useLiveWc` actualiza `liveOverlay.events = [goal@15]`
4. `events = cachedEvents ?? liveOverlay.events` → `cachedEvents = []` (no null) → **se usa `[]` siempre**
5. El gol nunca aparece. El poll automático de 60 s existe pero es ignorado por el state local

**Por qué Amistosos "funciona":** `FriendliesView` tiene el mismo bug (líneas 91, 100, 104-119) pero el MockProvider devuelve datos estáticos que no cambian entre polls, por lo que la staleness del `cachedEvents` es invisible.

**Fix propuesto:**

En `MatchCard`, limpiar `cachedEvents` cuando llega una actualización del poll con eventos más recientes:

```typescript
// Después de la línea 125, añadir:
useEffect(() => {
    if (isLive && liveOverlay?.events && cachedEvents !== null) {
        setCachedEvents(null)  // dejar que liveOverlay.events tome precedencia
    }
}, [isLive, liveOverlay?.events, cachedEvents])
```

Alternativamente, cambiar la prioridad:
```typescript
// Priorizar overlay en vivo sobre caché manual cuando el partido sigue activo
const events: LiveEvent[] =
    (isLive && liveOverlay?.events) ? liveOverlay.events
    : cachedEvents ?? liveOverlay?.events ?? []
```

Aplicar el mismo fix en `FriendliesView.tsx` línea 100.

---

### BUG-2 — Sin fallback mock para WC cuando no hay API key
**Severidad:** ALTA  
**Impacto en producción:** Solo afecta a entornos sin `API_FOOTBALL_KEY` (dev/staging)

**Archivo:** `src/app/api/live/wc/route.ts`

**Descripción:**

Cuando `isApiEnabled()` es false:

```typescript
// WC route (actual):
matches = []
source = 'mock'

// Friendlies route (referencia — funciona):
const mock = new MockProvider()
matches = await mock.fetchMatches({ from, to, competitionType: 'friendly', teamCode })
source = 'mock'
```

WC devuelve array vacío. No hay fixtures, no hay overlay, no hay eventos. `useLiveWc`
retorna `liveByKey = new Map()`, todos los `CalMatch` se renderizan sin overlay.

El resultado es que en development/staging sin API key:
- Calendario WC visible (usa `WC2026_MATCHES` estático) ✓
- Score/status en vivo: nunca ✗
- Timeline de eventos: nunca ✗
- Botón "Ver eventos": nunca aparece ✗

**Fix propuesto:**

Añadir MockProvider para WC. Si no existen fixtures WC en `MockProvider`, crear un set
mínimo (2-3 partidos con `status: 'live'` y eventos hardcodeados) para que el timeline
sea testeable sin API key.

---

### BUG-3 — `useLiveAll` nunca pide eventos para partidos WC en vivo
**Severidad:** ALTA  
**Impacto en producción:** SÍ — el Dashboard (LiveEventsBlock) no muestra eventos WC

**Archivo:** `src/hooks/useLiveAll.ts`

**Descripción:**

`useLiveAll` llama a `/api/live/wc?live=true`:
```typescript
const [wcRes, frRes] = await Promise.all([
    fetch(`/api/live/wc?live=true`),         // → fetchLiveMatches() — sin eventos
    fetch(`/api/live/friendlies?from=...`),   // → fetchMatches() → MockProvider embebe eventos
])
```

`fetchLiveMatches()` en ambos providers devuelve la lista de partidos en vivo
**sin eventos** (no llama a `fetchMatchById`). Así, el Dashboard LiveBlock siempre
muestra `events: undefined` para partidos WC, aunque haya goles registrados.

`useLiveWc` sí tiene el paso de enriquecimiento (llama `/api/live/match/{id}` por cada
partido live), pero `useLiveAll` es un hook separado que no implementa esa lógica.

**Fix propuesto:**

Añadir un paso de enriquecimiento en `useLiveAll` similar al de `useLiveWc`, solo para
los partidos WC con status `live` o `halftime`:

```typescript
// En useLiveAll, después de obtener wcMatches:
const liveWcIds = wcMatches
    .filter(m => m.status === 'live' || m.status === 'halftime')
    .map(m => m.id)

if (liveWcIds.length > 0) {
    const details = await Promise.allSettled(
        liveWcIds.map(id => fetch(`/api/live/match/${id}`).then(r => r.ok ? r.json() : null).catch(() => null))
    )
    const detailMap = new Map<string, LiveMatch>()
    for (const r of details) {
        if (r.status === 'fulfilled' && r.value?.match) {
            detailMap.set(r.value.match.id, r.value.match)
        }
    }
    wcMatches = wcMatches.map(m => detailMap.get(m.id) ?? m)
}
```

---

### BUG-4 — CDN cachea el detalle de partido en vivo (stale-while-revalidate)
**Severidad:** MEDIA  
**Impacto en producción:** SÍ — eventos pueden ser hasta 3 min obsoletos en Vercel Edge

**Archivo:** `src/app/api/live/match/[id]/route.ts`  
**Archivo relacionado:** `src/lib/live-data/config.ts`

**Descripción:**

El Route Handler de detalle usa `cacheHeader(hasLive)`:
```typescript
// config.ts
cacheTtlLive:    Number(process.env.LIVE_CACHE_TTL    ?? '60'),   // 60 s
// cacheHeader:
// live  → `public, s-maxage=60, stale-while-revalidate=120`
// idle  → `public, s-maxage=3600, stale-while-revalidate=86400`
```

Para un partido en vivo, `s-maxage=60` + `stale-while-revalidate=120` permite que la
Vercel Edge Cache sirva la misma respuesta de eventos durante hasta **180 s**.

`useLiveWc` llama este endpoint cada 60 s durante live. La secuencia típica en un
servidor con edge caching activo:

| Tiempo | Evento real | Respuesta desde cache |
|---|---|---|
| T+0 | Gol min 23 | Cache válida (eventos vacíos o anteriores) |
| T+60s | Poll 2 | Cache stale (< 120s) — sigue sirviendo eventos viejos |
| T+120s | Poll 3 | Cache expirada — background revalidation |
| T+180s | Poll 4 | Primera respuesta fresca con gol min 23 |

En el peor caso: **3 ciclos de poll = 180 s** entre que ocurre un evento y aparece en UI.

**Fix propuesto:**

Para partidos `live` o `halftime`, devolver `Cache-Control: no-store`:
```typescript
// En /api/live/match/[id]/route.ts:
const cacheCtrl = hasLive
    ? 'no-store'                                          // nunca cachear durante vivo
    : cacheHeader(false)                                  // 3600s para fixture finalizado
```

---

### BUG-5 — Detección de kick-off retrasada por polling idle + cache del listado
**Severidad:** MEDIA  
**Impacto en producción:** SÍ — los eventos no empiezan a aparecer hasta ~5 min después del inicio

**Archivos:** `src/hooks/useLiveWc.ts`, `src/app/api/live/wc/route.ts`

**Descripción:**

Cuando todos los partidos del día están en estado `upcoming`, `useLiveWc` usa
`POLL_IDLE_MS = 300_000` (5 min). Mientras tanto, la ruta `/api/live/wc?date=TODAY`
tiene cache:
```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

Al kick-off:
1. CDN sirve la respuesta cacheada (`upcoming`) hasta que expire `s-maxage=3600`
2. Hook ve 0 partidos live → no llama a `/api/live/match/{id}` → no hay eventos
3. Siguiente poll viene en 300 s (no detecta live antes)

En el peor caso sin CDN warm: **5 min** de retraso para empezar a mostrar eventos.
Con CDN warm y s-maxage activo: hasta **60 min** (3600 s) para que el listado refleje `live`.

El hecho de que score/status SÍ actualicen indica que en producción el CDN no está
sirviendo la respuesta cacheada durante todo el s-maxage (posiblemente Vercel revalida
rápido en background), pero la ventana de polling idle de 300 s sí introduce retraso.

**Fix propuesto:**

1. Reducir `POLL_IDLE_MS` a 120 s (dentro de la ventana de caché caliente de 5 min)
2. Para el día actual (`date === hoy`), usar un `s-maxage` más corto:
   ```typescript
   // En /api/live/wc/route.ts:
   const isToday = date === todayIso()
   const cacheCtrl = isToday
       ? (hasLive ? cacheHeader(true) : 'public, s-maxage=120, stale-while-revalidate=60')
       : cacheHeader(false)
   ```

---

## Comparativa Amistosos vs. WC

| Aspecto | Amistosos | WC (Mundial) |
|---|---|---|
| Fallback sin API key | MockProvider con datos + eventos | `[]` — sin datos |
| Eventos en lista base | Sí (MockProvider embebe eventos) | No (`fetchMatches` nunca incluye eventos) |
| Enriquecimiento automático | No (lazy en `handleToggle`) | Sí (`useLiveWc` llama `/api/live/match/{id}` cada 60s) |
| `cachedEvents` bloquea poll | Sí (mismo bug, invisible con datos estáticos) | Sí (visible porque los eventos cambian) |
| Detección kick-off | N/A (mock no cambia) | Hasta 300 s (idle poll) |
| CDN staleness en detalle | Mismo `cacheHeader` — hasta 180s | Mismo — hasta 180s |

---

## Flujo correcto (cuando todo funciona)

```
useLiveWc (cada 60s cuando live)
  └─ GET /api/live/wc?date=TODAY
       └─ provider.fetchMatches()  → LiveMatch[] (sin events)
            └─ [si live] GET /api/live/match/{id}
                  └─ provider.fetchMatchById(id)  → LiveMatch con events[]
  └─ detailMap.set(m.id, enrichedMatch)
  └─ enriched = base.map(m => detailMap.get(m.id) ?? m)
  └─ liveByKey = Map<"HOME-AWAY", LiveMatch>

CalendarView
  └─ liveByKey.get(`${home.code}-${away.code}`)  → liveOverlay
  └─ liveOverlay.events → MatchCard
  └─ MatchCard: events = cachedEvents ?? liveOverlay.events ?? []
```

**Punto de quiebre (BUG-1):** Si el usuario expande cuando `liveOverlay.events = undefined`,
`cachedEvents` es seteado y hace cortocircuito en todos los polls siguientes.

---

## Archivos modificados por fix (estimación)

| Archivo | Cambio |
|---|---|
| `src/components/CalendarView.tsx` | Limpiar `cachedEvents` en live-poll update |
| `src/components/FriendliesView.tsx` | Mismo fix para consistencia |
| `src/app/api/live/wc/route.ts` | Añadir MockProvider fallback |
| `src/app/api/live/match/[id]/route.ts` | `no-store` para partidos en vivo |
| `src/hooks/useLiveAll.ts` | Añadir enriquecimiento de eventos WC |
| `src/hooks/useLiveWc.ts` | Reducir `POLL_IDLE_MS` de 300s a 120s |

---

## Esfuerzo estimado

| Bug | Fix | Esfuerzo |
|---|---|---|
| BUG-1 `cachedEvents` stale | 5-10 líneas — `useEffect` + cambio de prioridad | 1 h |
| BUG-2 WC mock | Añadir 2-3 fixtures mock con status live + eventos | 2 h |
| BUG-3 `useLiveAll` enrichment | ~20 líneas — copiar patrón de `useLiveWc` | 1 h |
| BUG-4 CDN `no-store` live | 3 líneas en Route Handler | 15 min |
| BUG-5 Poll interval + cache | 2 líneas en hook + 5 líneas en Route Handler | 30 min |
| **Total** | | **~5 h** |

---

## Impacto en producción

| Componente | Estado actual |
|---|---|
| CalendarView — score/status en vivo | ✅ Funciona (overlay de `useLiveWc`) |
| CalendarView — eventos timeline | ❌ Stale o ausente (BUG-1 + BUG-4 + BUG-5) |
| Dashboard LiveBlock — score WC | ✅ Funciona (`useLiveAll`) |
| Dashboard LiveBlock — eventos WC | ❌ Nunca aparecen (BUG-3) |
| Dev sin API key — WC | ❌ Sin datos (BUG-2) |
| Dev sin API key — Amistosos | ✅ Mock funciona |

---

*Auditoría realizada sobre rama `main` @ commit `7ebf3bb`*
