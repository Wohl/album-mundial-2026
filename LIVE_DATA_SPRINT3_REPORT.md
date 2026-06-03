# Live Data Sprint 3 — Integration & Validation Report
**Fecha:** 2026-06-03  
**Estado:** ✅ Integración real validada — datos vivos funcionando

---

## Hallazgo crítico: proveedor real

La key proporcionada corresponde a **apifootball.com** (`apiv3.apifootball.com`), no a api-football.com.  
Se creó `ApifootballProvider` con detección automática por longitud de key (64-char hex → apifootball.com).  
Ambos providers coexisten; el Route Handler selecciona el correcto automáticamente.

---

## 1. League IDs definitivos (apifootball.com)

| Competición | league_id | Nombre en API | Temporada | Validado |
|-------------|-----------|---------------|-----------|---------|
| FIFA World Cup 2026 | **28** | `World Cup - World Championship` | 2026 | ✅ |
| International Friendlies | **356** | `Friendlies - Friendly International` | 2026 | ✅ |
| Club Friendlies | 355 | `Club Friendlies` | 2026 | — |

**Env vars para override (opcionales):**
```
APIFB_WC_LEAGUE_ID=28
APIFB_FRIENDLY_LEAGUE_ID=356
```

---

## 2. Season utilizada

`league_year: '2026'` confirmado en respuestas. No requiere parámetro de temporada separado en apifootball.com (filtrado por fecha).

---

## 3. Cobertura encontrada

### Mundial 2026 (league_id=28)

| Rango | Fixtures encontrados | Notas |
|-------|---------------------|-------|
| Jun 11–28 (Fase de Grupos) | **72** | ✅ Todas las MD1-MD3 |
| Jun 28–Jul 19 (Knockout) | **4** | ⚠️ Solo últimos partidos de grupos — R32/R16/QF/SF/Final **no disponibles todavía** |
| **Total** | **72/104** | Knockout TBD — pendiente cuando FIFA los asigne |

**Nota:** Los 32 partidos de fase eliminatoria (R32 al Final) no existen aún en apifootball.com porque FIFA no ha asignado participantes. Se agregarán automáticamente conforme avance el torneo.

### Amistosos Internacionales (league_id=356)

| Rango | Fixtures | Completados c/score | Status |
|-------|---------|---------------------|--------|
| May 30–Jun 10 | **186** | 36/36 (100%) | ✅ |
| Partidos live ahora | Variable | N/A | ✅ |
| Cancelados | 7/186 | — | ✅ |

---

## 4. Endpoints validados con key real

### GET /api/live/friendlies ✅

```json
{
  "meta": { "source": "api-football", "count": 186, "hasLive": true },
  "matches": [
    {
      "id": "733540",
      "date": "2026-05-30", "time": "14:00", "timezone": "UTC",
      "status": "completed",
      "home": { "code": "SCO", "name": "Scotland", "score": 4 },
      "away": { "code": "CUW", "name": "Curacao", "score": 1 },
      "venue": { "name": "Hampden Park", "city": "", "country": "World" },
      "competition": { "id": "356", "name": "Friendlies - Friendly International", "type": "friendly" }
    }
  ]
}
```
- Response time: ~1,400–1,800 ms ✅
- Scores en completados: 36/36 (100%) ✅
- Venue real (no "Por confirmar"): 109/186 (58%) — depende de datos fuente
- Team code mapping: 157 códigos únicos, 0 fallbacks "UNK" ✅

---

### GET /api/live/wc?date=2026-06-11 ✅

```json
{
  "meta": { "source": "api-football", "count": 1, "hasLive": false },
  "matches": [
    {
      "id": "710281",
      "date": "2026-06-11", "time": "21:00", "timezone": "UTC",
      "status": "upcoming",
      "home": { "code": "MEX", "name": "Mexico" },
      "away": { "code": "RSA", "name": "South Africa" },
      "venue": { "name": "Estadio Banorte" }
    }
  ]
}
```
- Response time: ~880 ms ✅
- **Discrepancia de venue**: API retorna "Estadio Banorte" pero FIFA oficial es "Estadio Azteca". ⚠️ Ver sección 8.
- **Tiempo en UTC**: 21:00 UTC = 13:00 CT México ✅ Consistente con nuestro `calendar-data.ts`

---

### GET /api/live/match/733540 ✅

```json
{
  "meta": { "source": "api-football" },
  "match": {
    "id": "733540", "status": "completed",
    "home": { "code": "SCO", "score": 4 },
    "away": { "code": "CUW", "score": 1 },
    "venue": { "name": "Hampden Park" },
    "events": [ /* 23 events */ ]
  }
}
```
- Response time: ~1,300 ms ✅

---

## 5. Validación de eventos ✅

**Partido: Scotland vs Curacao (733540) — Finished 4-1**

| Tipo | Count | Ejemplo real |
|------|-------|-------------|
| `goal` | 4 | min 45+1: F. Curtis (assist: K. McLean) |
| `penalty` | 1 | min 81: R. Christie |
| `yellow_card` | 4 | min 36: T. Chong (CUW), min 49: K. McLean (SCO)... |
| `red_card` | 1 | min 38: J. Locadia (CUW) |
| `substitution` | 13 | min 46: G. Hirst ← L. Dykes |

**Todos los tipos requeridos confirmados:**
- ✅ Gol (`goal`)
- ✅ Tarjeta amarilla (`yellow_card`)
- ✅ Tarjeta roja (`red_card`)
- ✅ Sustitución (`substitution`)

**Tipos adicionales mapeados correctamente:**
- ✅ Penal (`penalty`) — via `info: 'Penalty'` en goleador
- ✅ Gol en contra (`own_goal`) — via `info: 'Own Goal'`
- ✅ Tarjeta roja directa por segunda amarilla (`yellow_red_card`) — field `card: 'yellow red card'`

---

## 6. Validación de mappings

### WC2026 — 48 equipos

| Estado | Count |
|--------|-------|
| Mapeados correctamente | **48/48** |
| Sin mapping (UNK fallback) | 0 |

**Variantes detectadas en apifootball.com vs nuestro mapa:**
| API retorna | Código asignado | Fix aplicado |
|-------------|-----------------|--------------|
| `D.R. Congo` | COD | ✅ Sprint 3 |
| `Ivory Coast` | CIV | ✅ Sprint 3 (quoting fix) |
| `Bosnia & Herzegovina` | BIH | ✅ Sprint 1 |

### Amistosos — 157 equipos únicos

- 0 códigos fallback "UNK" detectados ✅
- Todos resuelven a códigos FIFA válidos ✅

---

## 7. Performance

| Endpoint | P50 | P95 (estimado) | Cache TTL |
|----------|-----|----------------|-----------|
| `/api/live/friendlies` (186 matches) | ~1,600 ms | ~2,500 ms | 3,600 s (no live) |
| `/api/live/wc?date=YYYY-MM-DD` | ~850 ms | ~1,200 ms | 3,600 s (no live) |
| `/api/live/match/{id}` | ~1,300 ms | ~2,000 ms | 3,600 s (completed) |
| Durante partido live | ~800 ms | ~1,400 ms | 60 s |

**Consumo estimado (plan actual — 180 req/h endpoint):**
- WC period: 1 req/60s × 3 vivos simultáneos = 3 req/min = 180 req/h → **exactamente en el límite** ⚠️
- Fuera de partidos: 1 req/5min = 12 req/h → muy holgado ✅
- **Recomendación:** En peak (MD3, 4 partidos simultáneos) reducir polling a 90s durante días críticos

**Rate limit headers:** apifootball.com no expone headers de rate limit. Límite inferido: 180 req/h/endpoint (plan European/Worldwide documentado en pricing).

---

## 8. Gaps y discrepancias detectadas

| Gap | Severidad | Descripción | Acción |
|-----|-----------|-------------|--------|
| Venue de apertura incorrecto | Media | API: "Estadio Banorte" — FIFA oficial: "Estadio Azteca". apifootball.com tiene datos de venue desactualizados para WC | Mantener `calendar-data.ts` como fuente de venue para fase de grupos |
| Timezone "UTC" en vez de local | Baja | Todos los tiempos en UTC. `calendar-data.ts` usa tiempos locales. Para live overlay usar `calendar-data.ts` como referencia de local time | Documenter en Sprint 4 strategy |
| Knockout stage no disponible | Baja | Solo 4 partidos del Jun 28 en apifootball — los fixtures TBD se agregarán solos | No action needed |
| 42% de venues "Por confirmar" en amistosos | Muy baja | apifootball.com no siempre incluye el estadio en amistosos | UX: no mostrar venue si es "Por confirmar" |
| Rate limit peak en MD3 | Media | 180 req/h = exactamente el límite si 3 partidos simultáneos + polling 60s | Polling adaptativo: 90s si >2 partidos live |

---

## 9. Fallback sigue funcionando ✅

Sin key configurada:
- `/api/live/friendlies` → `source: mock, count: 60` ✅
- `/api/live/wc` → `source: mock, count: 0` ✅
- `/api/live/match/{id}` → `match: null` + `meta.reason` ✅

---

## 10. Arquitectura final post-Sprint 3

```
Detección automática de provider:
  API_FOOTBALL_KEY length == 64 hex chars → ApifootballProvider (apiv3.apifootball.com)
  API_FOOTBALL_KEY length != 64           → ApiFootballProvider (v3.football.api-sports.io)
  LIVE_DATA_PROVIDER=apifootball/api-football → override manual

Providers disponibles:
  ApifootballProvider  — apifootball.com  (key actual ✅)
  ApiFootballProvider  — api-football.com (alternativa, key pendiente)
  MockProvider         — fallback offline ✅
```

---

## 11. TypeScript y build

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ Limpio — 169 kB página, 0 B Route Handlers |
| Bundle cliente — API key ausente | ✅ Confirmado |
| Fallback mock funcional | ✅ Confirmado |

---

## 12. Recomendaciones para Sprint 4 (UI Live Data)

1. **Usar `calendar-data.ts` como fuente de venue/ciudad/timezone** — apifootball.com tiene venues desactualizados
2. **Usar API para scores y status en tiempo real** — esos sí son correctos
3. **Mostrar "21:00 UTC" como tiempo de referencia en tarjetas live** — o convertir a local via `calendar-data.ts`
4. **Polling adaptativo**: 60s si hay partidos live, 5min si no los hay, 90s si hay >2 simultáneos
5. **Amistosos**: mostrar venue solo si `venue.name !== 'Por confirmar'`
6. **Vercel env**: añadir `API_FOOTBALL_KEY` en Production + Preview antes de Sprint 4 deploy

---

## Respuestas definitivas

| Pregunta | Respuesta |
|---------|-----------|
| ¿API cubre Mundial 2026? | ✅ **SÍ** — 72 fixtures de fase de grupos. Knockout se agrega automáticamente |
| ¿API cubre Amistosos Internacionales? | ✅ **SÍ** — 186 fixtures pre-WC (league_id=356) con scores reales |
| ¿Eventos (gol/amarilla/roja/sustitución) disponibles? | ✅ **SÍ** — todos validados en partido real |
| ¿Listos para Sprint 4 (UI Live Data)? | ✅ **SÍ** — arquitectura completa, datos reales, fallback funcional |
