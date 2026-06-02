# LIVE_DATA_FOUNDATION_PLAN.md
**Fecha:** 2026-06-02 | **Fase:** 3 — Live Data Foundation + Fogueos Internacionales

---

## Objetivo

Preparar la arquitectura para integrar datos reales de fútbol y crear la sección "Fogueos Internacionales" dentro del Calendario, reutilizando el diseño existente del Mundial 2026.

---

## Arquitectura propuesta

```
CalendarView
├── [Tab] Mundial 2026       ← contenido existente (sin cambios)
└── [Tab] Fogueos            ← NUEVO
         └── FriendliesView
               ├── FriendlyMatchCard  (adapted from MatchCard)
               ├── getAllFriendlies() → LiveDataProvider
               │     └── MockProvider  (Fase 3a)
               │         ApiFootballProvider (Fase 3b, futuro)
               │         SportmonksProvider  (Fase 3c, futuro)
               └── Filtros: Próximos / Recientes / Todos + Search
```

### Capas

| Capa | Path | Responsabilidad |
|------|------|----------------|
| **Types** | `src/lib/live-data/types/index.ts` | Contratos TS agnósticos de proveedor |
| **Provider interface** | `src/lib/live-data/providers/base-provider.ts` | Interfaz `LiveDataProvider` |
| **Mock provider** | `src/lib/live-data/providers/mock-provider.ts` | Datos estáticos de fogueos (Fase 3a) |
| **Service** | `src/lib/live-data/services/friendlies-service.ts` | Orquesta la llamada al provider |
| **Mapper** | `src/lib/live-data/mappers/index.ts` | `LiveMatch → CalMatch` para reusar MatchCard WC |
| **UI** | `src/components/FriendliesView.tsx` | Vista completa de fogueos |

---

## Proveedores candidatos

### 1. API-Football (RapidAPI / api-sports.io)
| Atributo | Detalle |
|----------|---------|
| Cobertura | +1,000 ligas, amistosos internacionales, WC |
| Free tier | 100 req/día, sin resultados en vivo |
| Paid (Basic) | ~$12 USD/mes — 7,500 req/día, resultados en vivo |
| Latencia | ~200–400ms |
| Formato | REST JSON |
| Nota | El proveedor más popular; SDK no oficial disponible |

### 2. Sportmonks
| Atributo | Detalle |
|----------|---------|
| Cobertura | +2,400 ligas, excelente cobertura de amistosos |
| Free tier | Starter: €0 — 200 req/hora, datos básicos |
| Paid (Starter+) | €29/mes — ligas adicionales, lineup, stats |
| Latencia | ~150–300ms |
| Formato | REST JSON, webhooks disponibles |
| Nota | Mejor documentación; más caro para cobertura global |

### 3. football-data.org
| Atributo | Detalle |
|----------|---------|
| Cobertura | Limitada a ~12 ligas top + competencias FIFA |
| Free tier | Tier 1: gratuito — 10 req/min |
| Paid | £ 2–10/mes para ligas adicionales |
| Latencia | ~100–250ms |
| Formato | REST JSON |
| Nota | Simple pero cobertura limitada; amistosos no siempre incluidos |

### 4. OpenLigaDB
| Atributo | Detalle |
|----------|---------|
| Cobertura | Solo Bundesliga y competencias alemanas |
| Costo | Gratuito |
| Nota | Demasiado limitado para fogueos internacionales |

### Recomendación
> **API-Football** para el MVP de Fase 3b: mejor relación cobertura/costo, free tier suficiente para dev, docs sólidos. Evaluar Sportmonks si se necesitan webhooks o lineups.

---

## Costos estimados

| Escenario | Proveedor | Plan | Costo/mes | Req/día |
|-----------|-----------|------|-----------|---------|
| Desarrollo / demo | Mock local | — | $0 | ilimitado |
| MVP producción | API-Football | Free | $0 | 100 |
| Producción moderada | API-Football | Basic | ~$12 | 7,500 |
| Producción con lineup | Sportmonks | Starter+ | ~€29 | ~4,800 |

---

## Límites de uso y estrategia de caché

### Problema
- Free tiers tienen límites bajos (100 req/día)
- Cada usuario que abre Fogueos dispararía una llamada → rate limit en minutos

### Solución: Server-side cache en Next.js

```typescript
// Patrón a implementar en Fase 3b:
// src/app/api/friendlies/route.ts

import { NextResponse } from 'next/server'

const CACHE_TTL_LIVE    = 30       // segundos — durante partido
const CACHE_TTL_PREVIEW = 3600     // 1 hora — antes del partido
const CACHE_TTL_RESULT  = 86400    // 24 horas — partido terminado

let cache: { data: LiveMatch[]; expiresAt: number } | null = null

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data)
  }
  const data = await realProvider.fetchMatches(...)
  cache = { data, expiresAt: Date.now() + CACHE_TTL_PREVIEW * 1000 }
  return NextResponse.json(data)
}
```

### Alternativa con Vercel KV (Upstash)
- KV store gratuito en Vercel — ideal para caché cross-request
- `await kv.set('friendlies', data, { ex: 3600 })`

---

## Estructura de carpetas

```
src/
├── lib/
│   ├── live-data/
│   │   ├── types/
│   │   │   └── index.ts          ← contratos agnósticos
│   │   ├── providers/
│   │   │   ├── base-provider.ts  ← interfaz LiveDataProvider
│   │   │   └── mock-provider.ts  ← datos estáticos (Fase 3a)
│   │   ├── services/
│   │   │   └── friendlies-service.ts  ← orquestador
│   │   └── mappers/
│   │       └── index.ts          ← LiveMatch → CalMatch
│   └── calendar-data.ts          ← SIN CAMBIOS (WC2026)
├── components/
│   ├── FriendliesView.tsx        ← nueva vista
│   └── CalendarView.tsx          ← añade nav tabs
```

---

## Tipos TypeScript

### `LiveMatch`
```typescript
interface LiveMatch {
  id: string
  date: string          // 'YYYY-MM-DD'
  time: string          // 'HH:MM' hora local del estadio
  timezone: string      // label corto: 'UTC', 'ET', 'CT', etc.
  status: LiveMatchStatus
  minute?: number       // minuto actual (partidos en vivo)
  home: LiveTeam
  away: LiveTeam
  venue: LiveVenue
  competition: LiveCompetition
  round?: string
  attendance?: number
}
```

### `LiveMatchStatus`
```typescript
type LiveMatchStatus =
  | 'upcoming' | 'live' | 'halftime'
  | 'completed' | 'postponed' | 'cancelled'
```

### `LiveTeam`
```typescript
interface LiveTeam {
  id: string
  code: string      // FIFA 3-letter code ('ARG', 'BRA', etc.)
  name: string
  shortName: string
  score?: number    // solo cuando status !== 'upcoming'
}
```

### `LiveVenue`
```typescript
interface LiveVenue {
  id: string
  name: string
  city: string
  country: string
  capacity?: number
}
```

### `LiveCompetition`
```typescript
interface LiveCompetition {
  id: string
  name: string
  shortName: string
  type: CompetitionType  // 'friendly' | 'qualifier' | 'world_cup' | ...
}
```

---

## Plan por fases

### Fase 3a — Mock Foundation (ESTA SESIÓN)
- [x] Contratos TypeScript (types, provider interface)
- [x] MockProvider con 30 partidos (15 completados + 15 próximos)
- [x] FriendliesService con `getAllFriendlies()`
- [x] FriendliesView.tsx — filtros Próximos/Recientes/Todos + search
- [x] Nav tabs en CalendarView (Mundial 2026 | Fogueos)
- [x] Mapper `LiveMatch → CalMatch`

### Fase 3b — API Real (próxima iteración)
- [ ] Crear `src/app/api/friendlies/route.ts` (Next.js route handler)
- [ ] Implementar `ApiFootballProvider` (o Sportmonks)
- [ ] Añadir caché server-side (in-memory o Vercel KV)
- [ ] Reemplazar MockProvider por ApiFootballProvider en servicio
- [ ] `.env.local`: `FOOTBALL_API_KEY=xxx`
- [ ] Variables en Vercel dashboard

### Fase 3c — Live Updates (futuro)
- [ ] Polling cada 30s durante partidos en vivo
- [ ] Indicador visual "actualizado hace Xs"
- [ ] Webhooks si proveedor los soporta
- [ ] Minuto a minuto / eventos

### Fase 3d — Features avanzados (backlog)
- [ ] Alineaciones confirmadas
- [ ] Estadísticas básicas (posesión, tiros)
- [ ] Favoritos persistidos en Supabase
- [ ] Integración con Quiniela (predicciones sobre fogueos)

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Rate limit en free tier | Alta | Medio | Caché server-side antes de conectar API |
| API no cubre amistosos menores | Media | Bajo | Filtrar solo competencias confirmadas |
| Cambio de schema del proveedor | Baja | Alto | Mapper aísla la UI de cambios externos |
| Latencia API en edge | Media | Bajo | `revalidate` de Next.js + KV cache |
| Hydration mismatch (async fetch) | Baja | Alto | `useState([])/loading` patrón ya implementado |

---

*Documento generado pre-implementación — Fase 3a completa en esta sesión.*
