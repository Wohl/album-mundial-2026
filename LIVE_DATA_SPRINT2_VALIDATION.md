# Live Data Sprint 2 — Validation Report
**Fecha:** 2026-06-03  
**Proveedor:** API-Football v3  
**Estado del entorno:** `API_FOOTBALL_KEY` no configurada → fallback mock activo

---

## 1. Verificación de seguridad

| Check | Resultado |
|-------|-----------|
| `.env.local` en `.gitignore` | ✅ Cubierto (`/.env*.local`, `/.env.local`, `/.env`) |
| `API_FOOTBALL_KEY` presente en `.env.local` | ⚠️ **AUSENTE** — pendiente configuración |
| `API_FOOTBALL_KEY` en `.next/static/` (bundle cliente) | ✅ Ausente — key protegida server-side |
| `NEXT_PUBLIC_` prefix en la key | ✅ Nunca — solo `process.env.API_FOOTBALL_KEY` en Route Handlers |

**Acción requerida antes de validar con datos reales:**
```bash
# Añadir a .env.local (NUNCA commitear este archivo):
API_FOOTBALL_KEY=<tu_key_de_api-football.com>
```

---

## 2. Endpoints probados

### GET /api/live/friendlies

| Parámetro | Valor probado | HTTP | source | count |
|-----------|---------------|------|--------|-------|
| `?from=2026-05-30&to=2026-06-10` | válido | 200 | mock | 60 |
| `?from=2026-05-30&to=2026-06-10&teamCode=ARG` | filtro team | 200 | mock | 2 |
| `?from=2026-05-30&to=2026-06-10&teamCode=MEX` | filtro team | 200 | mock | 2 |
| `?from=bad-date&to=2026-06-10` | fecha inválida | **400** | — | — |

**Cache-Control devuelta (sin partidos live):**  
`public, s-maxage=3600, stale-while-revalidate=86400` ✅

---

### GET /api/live/wc

| Parámetro | HTTP | source | count | Notas |
|-----------|------|--------|-------|-------|
| `?date=2026-06-11` | 200 | mock | 0 | Esperado: [] sin key |
| `?live=true` | 200 | mock | 0 | Esperado: [] sin key |

**Comportamiento sin key:** retorna vacío con `source: mock`. ✅ Por diseño — WC calendar usa datos estáticos de `calendar-data.ts`.

**Cache-Control devuelta:**  
`public, s-maxage=3600, stale-while-revalidate=86400` ✅

---

### GET /api/live/match/[id]

| ID | HTTP | source | match | Notas |
|----|------|--------|-------|-------|
| `999` | 200 | mock | null | Sin key → retorna null con meta.reason |
| `not-a-number` | **400** | — | — | Validación ID numérico ✅ |

**Nota:** el endpoint `/match/[id]` no expone error 502 al usuario cuando no hay key — retorna 200 con `match: null` y `meta.reason: 'API_FOOTBALL_KEY not configured'`. Diseño correcto para UX.

---

## 3. Validación de estructura LiveMatch

**Fuente:** 60 partidos del MockProvider

| Campo | Presente en todos | Valor ejemplo |
|-------|------------------|---------------|
| `id` | ✅ 60/60 | `frnd-20260530-sco-cuw` |
| `date` | ✅ 60/60 | `2026-05-30` |
| `time` | ✅ 60/60 | `20:00` |
| `timezone` | ✅ 60/60 | `BST`, `CT`, `Local`, `KST`... |
| `status` | ✅ 60/60 | `completed` \| `upcoming` |
| `home.code` | ✅ 60/60 | `SCO` |
| `home.name` | ✅ 60/60 | `Escocia` |
| `home.score` (completed) | ✅ 21/21 | `4` |
| `home.score` (upcoming) | ✅ 39/39 | `null` |
| `away.code` | ✅ 60/60 | `CUW` |
| `venue.name` | ✅ 60/60 | `Por confirmar` (mock) |
| `venue.city` | ✅ 60/60 | `Por confirmar` (mock) |
| `competition.name` | ✅ 60/60 | `Amistoso Internacional` |
| `competition.type` | ✅ 60/60 | `friendly` |
| `events` | ✅ — | `null` (no events en mock por diseño) |
| `minute` | ✅ — | `null` (ningún live en mock) |

**Campos faltantes:** 0 ✅  
**Scores en partidos completados:** 21/21 ✅  
**Status distribution:** `completed: 21`, `upcoming: 39`

---

## 4. Distribución de status (mock)

```
completed: 21  (35%)
upcoming:  39  (65%)
live:       0  — se generará cuando haya partidos reales en vivo
halftime:   0  — ídem
```

---

## 5. Cobertura de teamCode filter

| teamCode | Partidos encontrados | Partidos correctos |
|----------|---------------------|--------------------|
| ARG | 2 | ✅ ARG vs HON, ARG vs ISL |
| MEX | 2 | ✅ MEX vs AUS (completed 1-0), MEX vs SRB (upcoming) |
| BRA | pendiente key | — |
| ESP | pendiente key | — |

---

## 6. Análisis de team-code-map

**74 códigos únicos encontrados en el mock. Cobertura post-Sprint 2:**

### Equipos WC 2026 (48 códigos)
✅ Todos cubiertos con múltiples aliases de nombre inglés

### Equipos no-WC en amistosos mock (26 adicionales)

| Código | Nombre inglés en mapa | Estado |
|--------|----------------------|--------|
| ARU | Aruba | ✅ Añadido Sprint 2 |
| BOL | Bolivia | ✅ Sprint 1 |
| CHI | Chile | ✅ Sprint 1 |
| CRC | Costa Rica | ✅ Sprint 1 |
| DEN | Denmark | ✅ Sprint 1 |
| DOM | Dominican Republic | ✅ Añadido Sprint 2 |
| FIN | Finland | ✅ Sprint 1 |
| GRE | Greece | ✅ Sprint 1 |
| GUA | Guatemala | ✅ Sprint 1 |
| HON | Honduras | ✅ Sprint 1 |
| IRL | Republic of Ireland / Ireland | ✅ Añadido Sprint 2 |
| ISL | Iceland | ✅ Sprint 1 |
| KOS | Kosovo | ✅ Añadido Sprint 2 (unificado a KOS) |
| MAD | Madagascar | ✅ Añadido Sprint 2 |
| MKD | North Macedonia | ✅ Sprint 1 |
| MLT | Malta | ✅ Sprint 1 |
| NCA | Nicaragua | ✅ Añadido Sprint 2 |
| NGA | Nigeria | ✅ Sprint 1 |
| NIR | Northern Ireland | ✅ Añadido Sprint 2 |
| PER | Peru | ✅ Sprint 1 |
| POL | Poland | ✅ Sprint 1 |
| SLV | El Salvador | ✅ Sprint 1 |
| SRB | Serbia | ✅ Sprint 1 |
| SVK | Slovakia | ✅ Sprint 1 |
| SVN | Slovenia | ✅ Sprint 1 |
| TTO | Trinidad and Tobago | ✅ Sprint 1 |
| UKR | Ukraine | ✅ Sprint 1 |
| VEN | Venezuela | ✅ Sprint 1 |
| WAL | Wales | ✅ Sprint 1 |

**Discrepancia Kosovo:**  
- Mock usa `KOS` (código UEFA/API-Football convencional)  
- Sprint 1 inicialmente usaba `KVX` (código FIFA técnico)  
- **Resuelto Sprint 2:** unificado a `KOS` (alineado con API-Football)

**Cobertura total post-Sprint 2:** 74/74 códigos del mock cubiertos ✅

---

## 7. Rate limits observados

**Con mock (sin key):** 0 llamadas externas — N/A

**Estimado con key real (plan Starter):**
- Límite: 7,500 req/día, 45 req/min
- Polling 60s por amistoso: ~1,440 req/día máximo (completamente dentro del límite)
- WC period (3 partidos en vivo simultáneos): ~4,320 req/día — dentro del límite

---

## 8. Gaps identificados para validación con key real

Estos puntos **no se pueden validar sin una key real** y requieren verificación manual:

| Gap | Impacto | Acción |
|-----|---------|--------|
| `league_id` para WC2026 (asumir `1`) | Alto — sin el ID correcto, no retorna partidos | Verificar en dashboard API-Football antes de activar |
| `league_id` para friendlies internacionales (asumir `9`) | Alto | Verificar igual |
| Nombre exacto que API-Football usa para los 48 equipos WC | Medio | Probar un partido conocido (ej. MEX vs RSA, 2026-06-11) |
| Formato de `fixture.date` (ISO-8601 con offset) | Bajo | Mapper ya lo maneja pero confirmar con dato real |
| Eventos (goals/cards/subs) en partido completado conocido | Bajo | Probar `/api/live/match/{fixtureId}` con ID real |
| Rate limit real en burst | Bajo | Monitorear dashboard primeros 30 min de uso |

---

## 9. Comparativa Mock vs API-Football esperada

| Campo | Mock | API-Football (esperado) |
|-------|------|------------------------|
| `id` | `frnd-YYYYMMDD-xxx-yyy` | Numérico, ej. `1234567` |
| `venue.name` | `Por confirmar` | Nombre real del estadio |
| `venue.city` | `Por confirmar` | Ciudad real |
| `timezone` | `BST`, `CT`, etc. | `UTC±X` derivado del ISO-8601 |
| `events` | `null` | `[{type, minute, playerName, ...}]` en `/match/[id]` |
| `minute` | `null` | Entero 1-90+ para partidos live |
| `competition.name` | `Amistoso Internacional` | `International Friendly` (en inglés) |

---

## 10. Recomendación para Sprint 3

### Prerrequisito inmediato: agregar la key
```bash
# .env.local — NO commitear
API_FOOTBALL_KEY=<key_obtenida_en_dashboard.api-football.com>
```

### Sprint 3 checklist (una vez con key):
1. Probar `GET /api/live/friendlies?from=2026-05-30&to=2026-06-10` → verificar `source: api-football`
2. Verificar `league_id=9` retorna amistosos internacionales; si no, ajustar `API_FOOTBALL_FRIENDLY_LEAGUE_ID`
3. Probar `GET /api/live/wc?date=2026-06-11` → verificar `league_id=1` retorna el partido MEX-RSA
4. Si los nombres de equipo en API-Football no matchean el mapa → añadir aliases en `team-code-map.ts`
5. Probar `GET /api/live/match/{id}` con un partido completado conocido → verificar eventos
6. Monitorear rate limit en dashboard API-Football los primeros 30 min

### Vercel — agregar antes del primer deploy con datos reales:
```
API_FOOTBALL_KEY = <key>   (Production + Preview, NOT client-exposed)
```

---

## 11. Fixes aplicados en Sprint 2

| Fix | Archivo | Descripción |
|-----|---------|-------------|
| 7 códigos de team faltantes | `team-code-map.ts` | Añadidos: ARU, DOM, IRL, MAD, NCA, NIR + unificado KOS |
| Kosovo KVX→KOS | `team-code-map.ts` | Alineado con convención API-Football |

**TypeScript post-fix:** ✅ 0 errores  
**Commit:** pendiente (solo si se decide commitear el fix del mapa)

---

## Resumen ejecutivo

| Validación | Estado |
|------------|--------|
| `.gitignore` protege `.env.local` | ✅ |
| Key ausente del bundle cliente | ✅ |
| `/api/live/friendlies` — estructura | ✅ 60 partidos, 0 campos faltantes |
| `/api/live/friendlies` — filtro teamCode | ✅ ARG×2, MEX×2 |
| `/api/live/wc` — fallback sin key | ✅ `[]` con source:mock |
| `/api/live/match/[id]` — fallback sin key | ✅ `null` con meta.reason |
| Validación de input (fechas, IDs) | ✅ HTTP 400 en inputs inválidos |
| Cache-Control headers | ✅ `s-maxage=3600, swr=86400` |
| team-code-map cobertura 74/74 del mock | ✅ |
| **Validación con key real (API-Football)** | ⚠️ **PENDIENTE — requiere `API_FOOTBALL_KEY`** |
