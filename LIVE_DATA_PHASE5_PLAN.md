# Live Data — Fase 5 Plan de Implementación
**Fecha:** 2026-06-03  
**Proveedor seleccionado:** API-Football (api-football.com)  
**Estado:** Solo planificación — sin código implementado

---

## Objetivo

Reemplazar `MockProvider` con datos reales de API-Football para:
- **Amistosos**: resultados, estado, marcador, minuto actual, eventos ligeros
- **Mundial 2026**: actualizaciones de score en vivo, marcador, minuto, eventos

Sin modificar: Supabase, auth, RLS, RPCs, marketplace, trades, álbum, Countdown Hero, quiniela.

---

## Arquitectura propuesta

```
Browser (cliente)
  │
  ├── FriendliesView, CalendarView, FavoriteMatchesBlock
  │     └── Llaman a servicios en src/lib/live-data/services/
  │           └── Servicios llaman a /api/live/* (Next.js Route Handlers)
  │
src/app/api/live/                        ← NUEVO (server-side, protege API key)
  ├── friendlies/route.ts                GET /api/live/friendlies
  ├── wc/route.ts                        GET /api/live/wc
  └── match/[id]/route.ts                GET /api/live/match/{id}
         │
         └── ApiFootballProvider         ← NUEVO
               └── api-football.com/v3   (HTTPS, con key server-side)

src/lib/live-data/
  ├── types/index.ts                     ← Ampliar: añadir LiveEvent
  ├── providers/
  │   ├── base-provider.ts              (sin cambio)
  │   ├── mock-provider.ts              (sin cambio — fallback)
  │   └── api-football-provider.ts      ← NUEVO
  ├── mappers/
  │   ├── index.ts                      (sin cambio)
  │   └── api-football-mapper.ts        ← NUEVO
  └── services/
      ├── friendlies-service.ts         ← Modificar: usar ApiFootballProvider
      └── wc-service.ts                 ← NUEVO: live data para WC2026
```

### Principio de swap

El único cambio en `friendlies-service.ts` es:
```typescript
// Antes:
const provider = new MockProvider()

// Después:
const provider = process.env.API_FOOTBALL_KEY
  ? new ApiFootballProvider(process.env.API_FOOTBALL_KEY)
  : new MockProvider()            // fallback automático si no hay key
```

Esto garantiza que el modo mock siga funcionando en entornos sin key configurada.

---

## Variables de entorno necesarias

```bash
# .env.local (server-side únicamente — NO usar NEXT_PUBLIC_)
API_FOOTBALL_KEY=tu_key_de_api_football

# Opcional: controlar el comportamiento sin tocar código
LIVE_DATA_PROVIDER=api-football   # o 'mock' para forzar mock
LIVE_DATA_POLL_INTERVAL_MS=60000  # intervalo de polling en vivos (default: 60000)
LIVE_DATA_CACHE_TTL_LIVE=30       # segundos de cache para partidos en vivo
LIVE_DATA_CACHE_TTL_FIXTURE=3600  # segundos de cache para fixtures (1 hora)
```

**Importante**: `API_FOOTBALL_KEY` nunca se expone al cliente. Solo los Route Handlers en `src/app/api/live/` la leen desde `process.env`.

---

## Endpoints / Server Routes

### GET `/api/live/friendlies`

**Query params**: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD), `teamCode?` (código FIFA)

**Comportamiento**:
1. Valida params (from/to requeridos, formato fecha)
2. Consulta API-Football: `GET /v3/fixtures?league=friendly&season=2026&from={from}&to={to}`
3. Filtra por `teamCode` si se provee
4. Mapea respuesta → `LiveMatch[]`
5. Responde con cache headers `Cache-Control: s-maxage=300` (5 min para fixtures)

**Respuesta**: `{ matches: LiveMatch[], meta: { source, cachedAt, count } }`

---

### GET `/api/live/wc`

**Query params**: `date?` (YYYY-MM-DD, default hoy), `live?` (boolean)

**Comportamiento**:
1. Si `live=true`: `GET /v3/fixtures?live=all&league=1` (league 1 = FIFA WC en API-Football)
2. Si `live=false` o ausente: `GET /v3/fixtures?league=1&season=2026&date={date}`
3. Mapea → `LiveMatch[]`
4. Cache: 30s si hay partidos en vivo, 3600s si solo fixtures próximos

**Respuesta**: `{ matches: LiveMatch[], meta: { source, cachedAt, hasLive } }`

---

### GET `/api/live/match/[id]`

**Path param**: `id` (fixture ID externo de API-Football)

**Comportamiento**:
1. `GET /v3/fixtures?id={id}`
2. `GET /v3/fixtures/events?fixture={id}`
3. Combina fixture + eventos → `LiveMatch` completo con `events[]`
4. Cache: 30s si partido en vivo, 1h si finalizado

**Respuesta**: `{ match: LiveMatch | null }`

---

## Tipos a añadir (`src/lib/live-data/types/index.ts`)

```typescript
export type LiveEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty'
  | 'yellow_card'
  | 'red_card'
  | 'yellow_red_card'
  | 'substitution'

export interface LiveEvent {
  id: string
  type: LiveEventType
  minute: number
  extraTime?: number
  teamCode: string
  playerName: string
  assistName?: string      // para goles
  playerOutName?: string   // para sustituciones
}

// Añadir a LiveMatch:
// events?: LiveEvent[]
```

---

## Mapper: API-Football → LiveMatch

```typescript
// src/lib/live-data/mappers/api-football-mapper.ts

function mapStatus(short: string): LiveMatchStatus {
  switch (short) {
    case 'NS':                      return 'upcoming'
    case '1H': case '2H':
    case 'ET': case 'BT': case 'P': return 'live'
    case 'HT':                      return 'halftime'
    case 'FT': case 'AET':
    case 'PEN': case 'AWD':         return 'completed'
    case 'PST': case 'TBD':         return 'postponed'
    case 'CANC': case 'ABD':
    case 'WO': case 'INT':          return 'cancelled'
    default:                        return 'upcoming'
  }
}

function mapEventType(type: string, detail: string): LiveEventType | null {
  if (type === 'Goal') {
    if (detail === 'Own Goal') return 'own_goal'
    if (detail === 'Penalty')  return 'penalty'
    return 'goal'
  }
  if (type === 'Card') {
    if (detail === 'Yellow Card')        return 'yellow_card'
    if (detail === 'Red Card')           return 'red_card'
    if (detail === 'Yellow Card Second') return 'yellow_red_card'
  }
  if (type === 'subst') return 'substitution'
  return null  // ignorar tipos desconocidos (VAR, etc.)
}

function mapFixture(raw: ApiFbFixture): LiveMatch {
  const status = mapStatus(raw.fixture.status.short)
  return {
    id: String(raw.fixture.id),
    date: raw.fixture.date.split('T')[0],
    time: raw.fixture.date.split('T')[1].slice(0, 5),
    timezone: 'UTC',
    status,
    minute: raw.fixture.status.elapsed ?? undefined,
    home: {
      id: String(raw.teams.home.id),
      code: resolveCode(raw.teams.home.name),  // mapping FIFA codes
      name: raw.teams.home.name,
      shortName: raw.teams.home.name.slice(0, 3).toUpperCase(),
      score: raw.goals.home ?? undefined,
    },
    away: {
      id: String(raw.teams.away.id),
      code: resolveCode(raw.teams.away.name),
      name: raw.teams.away.name,
      shortName: raw.teams.away.name.slice(0, 3).toUpperCase(),
      score: raw.goals.away ?? undefined,
    },
    venue: {
      id: String(raw.fixture.venue?.id ?? 0),
      name: raw.fixture.venue?.name ?? 'Por confirmar',
      city: raw.fixture.venue?.city ?? '',
      country: raw.league.country,
    },
    competition: {
      id: String(raw.league.id),
      name: raw.league.name,
      shortName: raw.league.name.slice(0, 10),
      type: raw.league.id === 1 ? 'world_cup' : 'friendly',
    },
    round: raw.league.round,
  }
}
```

**Nota sobre `resolveCode()`**: API-Football usa nombres de equipo en inglés (ej. "Mexico", "South Africa"). Se requiere un mapa `englishName → FIFACode` para los 48 equipos del WC + equipos de amistosos. Este mapa vive en `src/lib/live-data/mappers/team-code-map.ts`.

---

## Estrategia de caché

### En Route Handlers (Next.js)

```typescript
// Para partidos próximos/terminados (datos estables)
const response = NextResponse.json(data)
response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
return response

// Para partidos en vivo (datos volátiles)
const response = NextResponse.json(data)
response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
return response
```

### En cliente (polling adaptativo)

```typescript
// Lógica de polling inteligente en hooks del cliente
function getPollInterval(hasLiveMatches: boolean): number {
  if (hasLiveMatches) return 60_000     // 60s cuando hay partido en vivo
  return 5 * 60_000                    // 5 min cuando no hay vivos
}
```

### Cálculo de consumo de API (Starter plan: 7,500 req/día)

| Escenario | Req/hora | Req/día |
|-----------|----------|---------|
| Sin partidos en vivo | 12 req/h (1 cada 5 min) | ~288 |
| 1 partido en vivo | 60 req/h (1 por min) | ~360 peak |
| 3 partidos simultáneos (grupo MD3) | 60 req/h × 3 = 180/h | ~540 peak |
| **Máximo estimado día mundialista** | — | **~1,000–1,500** |

**Conclusión**: El plan Starter (7,500 req/día) tiene margen 5× sobre el peor caso estimado.

---

## Estrategia de refresh en cliente

```typescript
// Hook propuesto: src/hooks/useLiveMatches.ts
export function useLiveMatches(endpoint: string) {
  const [data, setData] = useState<LiveMatch[]>([])
  const [hasLive, setHasLive] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(endpoint)
      const json = await res.json()
      setData(json.matches)
      setHasLive(json.meta?.hasLive ?? false)
    }

    fetchData()
    const interval = setInterval(fetchData, getPollInterval(hasLive))
    return () => clearInterval(interval)
  }, [endpoint, hasLive])

  return data
}
```

- **Sin partido en vivo**: poll cada 5 minutos (económico)
- **Con partido en vivo**: poll cada 60 segundos
- **Tab oculta**: `document.visibilitychange` pausa el polling (evita requests innecesarios)

---

## Fallback a mock

El fallback es automático si `API_FOOTBALL_KEY` no está definida:

```typescript
// friendlies-service.ts
const provider: LiveDataProvider = process.env.API_FOOTBALL_KEY
  ? new ApiFootballProvider(process.env.API_FOOTBALL_KEY)
  : new MockProvider()
```

También se puede forzar mock globalmente con `LIVE_DATA_PROVIDER=mock` en `.env.local`. Esto es útil durante desarrollo local sin key, o en tests de CI.

---

## Plan incremental de implementación

### Sprint 1 — Tipos y mapper (sin API calls)
- Añadir `LiveEvent` e `events?` a `LiveMatch` en `types/index.ts`
- Crear `src/lib/live-data/mappers/api-football-mapper.ts`
- Crear `src/lib/live-data/mappers/team-code-map.ts` (48 equipos WC + ~20 de amistosos)
- TypeScript check
- **Sin cambios en UI ni en servicios**

### Sprint 2 — Route Handlers (server-side)
- Crear `src/app/api/live/friendlies/route.ts`
- Crear `src/app/api/live/wc/route.ts`
- Crear `src/app/api/live/match/[id]/route.ts`
- Test manual con `curl localhost:3000/api/live/friendlies?from=2026-06-01&to=2026-06-10`
- Verificar que la key no se expone en ningún bundle de cliente

### Sprint 3 — ApiFootballProvider
- Crear `src/lib/live-data/providers/api-football-provider.ts`
- Implementar `fetchMatches()` y `fetchMatchById()`
- Los Route Handlers del Sprint 2 la instancian internamente
- Test de integración: comparar resultados con MockProvider para misma fecha

### Sprint 4 — Activar en servicios
- Modificar `friendlies-service.ts` para usar la variable de entorno
- Crear `src/lib/live-data/services/wc-service.ts` para WC2026
- Test: Amistosos View muestra datos reales de API-Football
- Fallback a mock si key no disponible

### Sprint 5 — Polling en cliente + eventos
- Crear `src/hooks/useLiveMatches.ts` con polling adaptativo
- Actualizar `FriendliesView` para usar el hook
- Mostrar eventos (goles, tarjetas) en cards de partidos en vivo
- Añadir indicator de minuto en vivo (ya presente en el UI via `minute?`)

### Sprint 6 — WC live en CalendarView
- Actualizar `CalendarView` para partidos del Mundial con datos en vivo
- Mostrar marcador real en lugar de TBD durante el torneo
- Actualizar `status` de fixtures a medida que terminan

---

## Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| API-Football cambia precios o estructura de respuesta | Media | Wrapper mapper aísla el cambio; solo actualizar mapper |
| Rate limit excedido en peak (Jornada 3 grupos, 4 partidos simultáneos) | Media | Cache agresivo en Route Handlers; reducir polling a 90s si hay >2 vivos |
| Team name mismatch (API devuelve "Czech Republic", código necesita "CZE") | Alta | `team-code-map.ts` resuelve esto; auditar antes del Mundial |
| API key expuesta en logs de Vercel | Alta | Usar `redact` en variables de entorno de Vercel; no loguear headers |
| Sin key en CI/CD rompe build | Baja | `MockProvider` como fallback; key opcional en `.env` |
| football-data.org (alternativa) no cubre amistosos | Media | Documentado; si se elige esta alternativa, verificar antes de implementar |
| Vercel serverless cold start añade latencia al primer poll | Baja | `stale-while-revalidate` oculta la latencia al usuario |
| Sportmonks event type_id cambia entre versiones de API | Baja | N/A (no recomendado) |

---

## Validaciones requeridas antes de cerrar Fase 5

| Validación | Método |
|------------|--------|
| Fixtures de amistosos correctos (fecha, equipos, score) | Comparar con fuentes externas (FIFA.com) para 3 partidos conocidos |
| Fixtures del Mundial correctos | Comparar con `WC2026_MATCHES` de `calendar-data.ts` |
| Team codes correctos (FIFA 3-letter) | Revisar 48 equipos del draw contra `team-code-map.ts` |
| Key no visible en bundle de cliente | `grep -r "API_FOOTBALL_KEY" .next/static` debe dar 0 resultados |
| Fallback a mock funciona sin key | Ejecutar con `API_FOOTBALL_KEY=` vacío, verificar app carga |
| TypeScript: 0 errores | `npx tsc --noEmit` |
| Build: exitoso | `npm run build` |
| Rate limit no excedido en sesión de prueba de 10 min | Revisar dashboard de API-Football |
| Eventos (gol, tarjeta) mapeados correctamente | Test con partido de amistoso completado conocido |

---

## Dependencias y prerrequisitos

1. **Cuenta en api-football.com** — Registrarse y obtener key gratuita para desarrollo
2. **Verificar league_id del Mundial 2026** en API-Football (probablemente `league_id=1`, confirmar en su documentación de temporadas)
3. **Verificar league_id de amistosos internacionales** (probablemente `league_id=friendly` o un ID numérico específico)
4. **Añadir `API_FOOTBALL_KEY` en Vercel** → Settings → Environment Variables → Production + Preview

---

## Decisiones pendientes de aprobación

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| Plan de API-Football | Gratuito (dev) → Starter (prod) | Starter ~$10-15/mes para período del Mundial |
| Frecuencia de polling live | 30s / 60s / 90s | 60s (equilibrio costo-UX) |
| Mostrar eventos en cards o solo en modal | Solo marcador en card + modal de eventos | Marcador en card, eventos en detalle |
| Cache layer adicional (Redis/Upstash) | Sí / No | No en Fase 5; evaluar si hay problemas de rate limit |

---

*Documento de planificación. No implementar hasta aprobación.*
