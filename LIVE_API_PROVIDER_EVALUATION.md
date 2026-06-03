# Live API Provider Evaluation — Album Mundial 2026
**Fecha:** 2026-06-02  
**Fase:** 5 — Evaluación (sin implementación)  
**Objetivo:** Elegir el proveedor de datos en vivo para Calendario Mundial 2026 y Amistosos

---

## Contexto técnico del proyecto

La arquitectura `src/lib/live-data/` ya existe con la interfaz `LiveDataProvider`:
```typescript
interface LiveDataProvider {
  fetchMatches(options: FetchMatchesOptions): Promise<LiveMatch[]>
  fetchMatchById(id: string): Promise<LiveMatch | null>
}
```
`MockProvider` está activo. Cambiar de proveedor = implementar una clase nueva + actualizar `friendlies-service.ts`. **UI, tipos y mappers no necesitan cambios**.

**Datos requeridos por `LiveMatch`:**
- `status`: upcoming / live / halftime / completed / postponed / cancelled
- `minute?`: minuto actual del partido en vivo
- `home.score`, `away.score`: marcador
- Eventos: gol, tarjeta amarilla, tarjeta roja, sustitución

---

## Tabla comparativa

| Criterio | **API-Football** | **Sportmonks** | **football-data.org** | **apifootball.com** |
|----------|-----------------|----------------|-----------------------|---------------------|
| **URL** | api-football.com | sportmonks.com | football-data.org | apifootball.com |
| **Plan gratuito** | 100 req/día, 10 req/min | Solo Superliga danesa + Premiership escocesa | 12 competencias, 10 req/min, SIN live scores | 180 req/h/endpoint, solo 2 ligas (no WC) |
| **Plan mínimo útil** | ~$10–15/mes (Starter) | €29/mes (Starter) | €12/mes (+ livescores) | $21/mes (European) |
| **Plan recomendado** | Starter o Pro ($10–40/mes) | Growth €99/mes | Standard €49/mes | Worldwide $42/mes |
| **Req/día (plan base pago)** | 7,500 | 2,000/entidad/hora | 60 req/min | 1,000/hora/endpoint |
| **Rate limit** | 45 req/min (paid) | 2,000/entidad/hora | 60 req/min (Standard) | 1,000/hora/endpoint |
| **Mundial 2026** | ✅ Confirmado | ✅ Confirmado | ✅ Confirmado | ⚠️ No confirmado |
| **Amistosos internacionales** | ✅ Confirmado (league_id=friendly) | ✅ Confirmado | ⚠️ No listado explícitamente | ✅ Con Worldwide |
| **Score en vivo** | ✅ `/fixtures?live=all` | ✅ `/livescores/latest` (10s cycle) | ✅ (requiere €12+/mes) | ✅ Polling o WebSocket |
| **Minuto actual** | ✅ `fixture.status.elapsed` | ✅ `periods` + timing | ✅ `minute` en match response | ✅ Sí |
| **Eventos: Gol** | ✅ `type: "Goal"` | ✅ `type_id: 14` | ✅ En `goals[]` del match | ✅ `goalscorer[]` |
| **Eventos: Tarjeta amarilla** | ✅ `type: "Card", detail: "Yellow Card"` | ✅ `type_id: 19` | ✅ `card: "YELLOW_CARD"` | ✅ Sí |
| **Eventos: Tarjeta roja** | ✅ `type: "Card", detail: "Red Card"` | ✅ `type_id: 20` | ✅ `card: "RED_CARD"` | ✅ Sí |
| **2ª amarilla (roja)** | ✅ `detail: "Yellow Card Second"` | ✅ `type_id: 21` | ✅ `card: "YELLOW_RED_CARD"` | ⚠️ No confirmado |
| **Sustitución** | ✅ `type: "subst"` | ✅ `type_id: 18` | ✅ `substitutions[]` | ✅ Sí |
| **Alineaciones** | ✅ `/fixtures/lineups?fixture={id}` | ✅ `include=lineups` | ✅ En match response | ✅ Sí |
| **Actualización live** | ~60 segundos (típico) | ~10 segundos (`/latest`) | ~1 minuto | ~1 minuto (polling) / WebSocket |
| **Key server-side** | ✅ Requerido | ✅ Requerido | ✅ Requerido | ✅ Requerido |
| **Documentación** | ⭐⭐⭐⭐ Muy buena, OpenAPI | ⭐⭐⭐⭐ Buena, includes system | ⭐⭐⭐⭐⭐ Excelente, muy clara | ⭐⭐⭐ Aceptable |
| **Facilidad integración** | ⭐⭐⭐⭐ Alta | ⭐⭐⭐ Media (includes complejos) | ⭐⭐⭐⭐⭐ Muy alta | ⭐⭐⭐ Media |
| **Comunidad/soporte** | ⭐⭐⭐⭐⭐ Más popular | ⭐⭐⭐ Activo | ⭐⭐⭐⭐ Buena | ⭐⭐ Pequeña |
| **Riesgo rate limit** | Bajo (7,500 req/día suficiente) | Bajo (2,000/entidad/hora) | Bajo (60 req/min suficiente) | Bajo |
| **Confiabilidad** | ⭐⭐⭐⭐ Alta (uso masivo) | ⭐⭐⭐⭐ Alta | ⭐⭐⭐⭐ Alta | ⭐⭐⭐ Media |
| **Trial gratis** | Plan gratuito permanente (100 req/día) | 14 días | No | 15 días |
| **Idioma documentación** | Inglés | Inglés | Inglés | Inglés |

---

## Análisis por criterio crítico

### 1. Cobertura del Mundial 2026

| Proveedor | Estado | Notas |
|-----------|--------|-------|
| API-Football | ✅ Confirmado | FIFA World Cup = `league_id=1` en v3 |
| Sportmonks | ✅ Confirmado | Listado en página oficial de torneos |
| football-data.org | ✅ Confirmado | Listado en `/v4/competitions` free forever |
| apifootball.com | ⚠️ No confirmado | Docs no mencionan WC2026 explícitamente |

### 2. Cobertura de Amistosos Internacionales

| Proveedor | Estado | Notas |
|-----------|--------|-------|
| API-Football | ✅ Confirmado | `league_id=friendly` + `country=World` |
| Sportmonks | ✅ Confirmado | Incluido en cobertura internacional |
| football-data.org | ⚠️ Incierto | No aparece en lista de 12 comp. gratuitas; requiere verificar plan |
| apifootball.com | ✅ Con Worldwide | $42/mes cubre 800+ ligas |

### 3. Calidad de datos en vivo

**API-Football** provee datos cada ~60 segundos. El endpoint `/fixtures?live=all` devuelve todos los partidos en vivo. Para eventos se llama `/fixtures/events?fixture={id}` por separado.

**Sportmonks** es el más rápido (10 segundos de ciclo con `/livescores/latest`). Los includes permiten obtener `scores;participants;events` en una sola llamada, minimizando requests.

**football-data.org** incluye todo en el objeto match: goles, bookings y sustituciones en arrays dentro de la respuesta del partido. Limpio y simple.

### 4. Riesgos de rate limit para este proyecto

Con polling de 60 segundos durante partidos del Mundial (máx 3 partidos simultáneos):
- **Fixtures en vivo**: 1 llamada/60s × 3 partidos = **3 req/min** = 4,320 req/día
- **Eventos individuales**: 1 llamada/60s × 3 = 3 req/min adicionales
- **Total estimado peak**: ~6,500 req/día

Esto **excede** el plan gratuito de API-Football (100 req/día) pero cabe en el Starter (~7,500 req/día).

Para football-data.org en Standard (60 req/min), el polling es muy holgado.

### 5. Integración con arquitectura existente

La interfaz `LiveDataProvider` requiere implementar:
```typescript
fetchMatches(options: FetchMatchesOptions): Promise<LiveMatch[]>
fetchMatchById(id: string): Promise<LiveMatch | null>
```

**API-Football**: Endpoints directos REST. Mapper simple (ver sección de plan). Integración estimada: **2-3 horas**.

**Sportmonks**: Sistema de `includes` potente pero con curva de aprendizaje. Integración estimada: **4-6 horas**.

**football-data.org**: API más limpia del mercado. Match response incluye todo. Integración estimada: **1-2 horas**.

---

## Detalle de endpoints relevantes

### API-Football (api-football.com)

```
GET /v3/fixtures?live=all
GET /v3/fixtures?league={id}&season=2026&date={YYYY-MM-DD}
GET /v3/fixtures/events?fixture={id}
GET /v3/fixtures/lineups?fixture={id}
```

Header requerido: `X-RapidAPI-Key: {key}` (o `x-apisports-key`)

Mapeo de status:
```
NS         → upcoming
1H, 2H, ET → live
HT         → halftime
FT, AET    → completed
PST        → postponed
CANC       → cancelled
```

### Sportmonks (v3)

```
GET /v3/football/livescores/latest?include=scores;participants;events
GET /v3/football/fixtures/{id}?include=scores;participants;events;lineups;periods
GET /v3/football/fixtures?season_id=&include=scores;participants
```

Mapeo de type_id de eventos:
```
14 → goal
15 → own_goal
16 → penalty
18 → substitution
19 → yellow_card
20 → red_card
21 → yellow_red_card
```

### football-data.org (v4)

```
GET /v4/competitions/WC/matches?status=LIVE
GET /v4/competitions/WC/matches?matchday={n}
GET /v4/matches/{id}
```

Status values: `SCHEDULED | LIVE | IN_PLAY | PAUSED | FINISHED | POSTPONED | SUSPENDED | CANCELLED`

---

## Opciones adicionales evaluadas y descartadas

| Opción | Razón de descarte |
|--------|-------------------|
| **OpenFootball / football.db** | Solo datos históricos estáticos; sin live |
| **FotMob API** | Sin API oficial pública; riesgo de corte sin aviso |
| **ESPN API (no oficial)** | Inestable, sin documentación, riesgo legal |
| **SportsDB** | Datos históricos OK, live muy básico; WC2026 no confirmado |
| **AllSportsAPI** | Menos establecida, documentación limitada |

---

## Conclusión y recomendación final

### ✅ Recomendación: **API-Football (api-football.com)**

**Razones:**

1. **Cobertura confirmada**: FIFA World Cup 2026 y amistosos internacionales documentados
2. **Ecosistema más amplio**: La comunidad indie/hobby más grande; miles de proyectos similares
3. **Plan gratuito real para desarrollo**: 100 req/día suficiente para construir y probar
4. **Costo razonable**: Starter ~$10-15/mes cubre el peak del Mundial (7,500 req/día)
5. **Documentación excelente**: OpenAPI spec, ejemplos claros, Postman collections disponibles
6. **Integración directa**: REST simple, sin sistema de includes complejo
7. **Mapper directo**: Los tipos de evento (`Goal`, `Card`, `subst`) son inmediatamente claros
8. **Alta confiabilidad**: Miles de proyectos en producción; infraestructura probada

**Plan recomendado para producción**: **Starter** (~$10-15/mes)
- 7,500 req/día (suficiente para el período mundialista)
- 45 req/min rate limit (muy holgado con polling de 60s)

**Plan durante desarrollo**: Gratuito (100 req/día, suficiente para pruebas)

### 🥈 Alternativa: **football-data.org (Standard €49/mes)**

Si el presupuesto lo permite, es la API mejor documentada y más limpia del mercado. La cobertura de amistosos es el único punto a verificar antes de comprometerse.

### ❌ No recomendado: Sportmonks

El sistema de includes es poderoso pero innecesariamente complejo para este caso. El costo mínimo útil (€29/mes) supera a API-Football con menos beneficios para un proyecto de esta escala.

---

*Documento generado sin implementar código. Solo investigación y análisis.*
