# NEXT_PHASE_RECOMMENDATION.md
**Fecha:** 2026-06-02 | **Contexto:** Evaluación de proveedor para Fase 3b — Live Data

---

## Objetivo

Seleccionar el proveedor de datos de fútbol para reemplazar `MockProvider` con datos reales de amistosos internacionales (y potencialmente partidos del Mundial 2026 cuando empiecen).

---

## Proveedores evaluados

### 1. API-Football (api-sports.io / RapidAPI)

**URL:** api-sports.io | **También en:** RapidAPI como `api-football-v3`

| Dimensión | Detalle |
|-----------|---------|
| **Precio free** | 100 req/día — sin datos en vivo, sin lineups |
| **Precio básico** | ~$14 USD/mes — 7,500 req/día, resultados en vivo |
| **Precio pro** | ~$25 USD/mes — 30,000 req/día, lineups, estadísticas |
| **Cobertura selecciones** | ✅ Todas las selecciones FIFA + no-FIFA |
| **Cobertura amistosos** | ✅ Amistosos internacionales cubiertos (League ID: 10 = International Friendlies) |
| **Alineaciones** | ✅ En plan Basic+ — confirmadas 1h antes del partido |
| **Minuto a minuto** | ✅ Eventos (gol, tarjeta, sustitución) con minuto real |
| **Estadísticas** | ✅ Posesión, tiros, corners, faltas — Basic+ |
| **Facilidad integración** | ⭐⭐⭐⭐⭐ REST JSON, headers simples (`x-apisports-key`), docs en español |
| **SDK** | No oficial — integración directa via `fetch` |
| **Rate limit overhead** | Headers `x-ratelimit-remaining` en cada response |
| **Webhooks** | ❌ No disponible |
| **Latencia** | ~200–400ms por request |
| **Uptime SLA** | 99.5% en plan paid |

**Estructura de respuesta relevante:**
```json
{
  "response": [{
    "fixture": { "id": 123, "date": "2026-06-03T19:45:00+00:00", "status": { "short": "NS" } },
    "league":  { "id": 10, "name": "Friendly International" },
    "teams":   { "home": { "id": 7, "name": "France", "code": "FRA" }, "away": {...} },
    "goals":   { "home": null, "away": null },
    "venue":   { "name": "Stade de France", "city": "Saint-Denis" }
  }]
}
```

**Endpoint clave para Fogueos:**
```
GET /fixtures?league=10&season=2026&from=2026-05-01&to=2026-06-10
```

---

### 2. Sportmonks

**URL:** sportmonks.com

| Dimensión | Detalle |
|-----------|---------|
| **Precio free / Starter** | €0 — Starter plan: 200 req/hora, solo datos básicos de ligas contratadas |
| **Precio Base** | €29/mes — Ligas adicionales, lineups, pre-match stats |
| **Precio Advanced** | €59/mes — Expected Goals, live odds, momentum |
| **Cobertura selecciones** | ✅ Todas las selecciones FIFA |
| **Cobertura amistosos** | ✅ International Friendlies disponibles, pero requieren add-on por liga |
| **Alineaciones** | ✅ En plan Base+ — muy detalladas (posición, número, rating) |
| **Minuto a minuto** | ✅ Webhooks en tiempo real (única ventaja clave vs API-Football) |
| **Estadísticas** | ✅ Las más completas del mercado — xG, presiones, PPDA |
| **Facilidad integración** | ⭐⭐⭐⭐ REST JSON, bien documentado, pero más complejo (includes/relationships) |
| **SDK** | PHP SDK oficial; TypeScript no oficial |
| **Webhooks** | ✅ Sí — push en tiempo real para eventos de partido |
| **Latencia** | ~150–300ms |
| **Uptime SLA** | 99.9% en plan paid |

**Complejidad de integración:** Sportmonks usa un sistema de `includes` para cargar relaciones:
```
GET /fixtures?filters=fixtureLeagues:271&include=localTeam;visitorTeam;venue;events
```
Más flexible pero más verboso. El mapper (`mappers/index.ts`) necesitaría más lógica.

---

## Tabla comparativa directa

| Criterio | API-Football | Sportmonks | Ganador |
|----------|-------------|------------|---------|
| **Precio free útil** | 100 req/día (limitado pero funciona para dev) | Starter €0 pero muy restrictivo | API-Football |
| **Precio producción inicial** | ~$14/mes | ~€29/mes (~$31) | API-Football |
| **Cobertura amistosos intl.** | ✅ League ID 10, bien documentado | ✅ Disponible como add-on | Empate |
| **Cobertura WC 2026** | ✅ League ID 1 (World Cup) | ✅ Con plan adecuado | Empate |
| **Alineaciones** | ✅ Basic+ ($14/mes) | ✅ Base+ (€29/mes) | API-Football |
| **Minuto a minuto** | ✅ Polling (no webhooks) | ✅ Webhooks reales | Sportmonks |
| **Estadísticas avanzadas (xG)** | ❌ No disponible | ✅ Advanced (€59/mes) | Sportmonks |
| **Facilidad de integración** | ✅ Simple, REST puro | ⚠️ Más complejo (includes) | API-Football |
| **Documentación** | ✅ Buena, en inglés | ✅ Excelente, más detallada | Sportmonks |
| **Webhooks / push** | ❌ Solo polling | ✅ Sí | Sportmonks |
| **TypeScript support** | Ninguno oficial | Ninguno oficial | Empate |
| **Caché necesaria** | Sí (100 req/día free) | Sí (200 req/hora free) | Empate |
| **Latencia media** | 200–400ms | 150–300ms | Sportmonks |
| **Uptime SLA** | 99.5% | 99.9% | Sportmonks |

---

## Análisis por caso de uso

### Para Fase 3b (MVP — amistosos en tiempo real)
**Recomendado: API-Football**

Razones:
- $14/mes es asequible para un MVP
- League ID 10 (International Friendlies) es exactamente lo que necesitamos
- La estructura JSON mapea directamente al `LiveMatch` type ya implementado
- 7,500 req/día es más que suficiente con caché server-side (1 req/hora = 24 req/día)
- Integración en ~2 horas con `fetch` directo

### Para Fase 3c (live updates, post-Mundial)
**Recomendado: Sportmonks**

Si se implementa minuto a minuto (Fase 3c), los webhooks de Sportmonks eliminan el polling. Con 48 partidos del Mundial en vivo (pico máximo 4 simultáneos), el polling de API-Football (cada 30s × 4 partidos = 480 req/hora) consumiría el plan Basic rápidamente. Los webhooks de Sportmonks son más eficientes.

---

## Recomendación final para album-mundial-2026

### Estrategia en dos pasos

**Paso 1 — Fase 3b (ahora):** Integrar **API-Football** en plan Basic (~$14/mes)
- Bajo costo de entrada
- Fácil de integrar con la arquitectura ya creada
- Suficiente para amistosos + resultados simples del Mundial
- El `MockProvider` ya tiene la misma shape que el response de API-Football

**Paso 2 — Fase 3c (junio–julio 2026, durante el Mundial):** Evaluar migración a **Sportmonks Base** (€29/mes) si se implementa minuto a minuto
- Los webhooks justifican el sobreprecio durante los 32 días del Mundial
- `LiveDataProvider` interface permite el swap sin tocar la UI

### Plan de integración sugerido (Fase 3b)

```
1. Crear cuenta en api-sports.io
2. Agregar FOOTBALL_API_KEY en .env.local + Vercel dashboard
3. Crear src/app/api/friendlies/route.ts (Next.js route handler)
   - Server-side cache con in-memory store o Vercel KV
   - TTL: 3600s (partidos no en vivo)
4. Crear src/lib/live-data/providers/api-football-provider.ts
   - Implementa LiveDataProvider
   - GET /fixtures?league=10&season=2026
   - Mapper: apiFootballToLiveMatch()
5. Reemplazar MockProvider por ApiFootballProvider en friendlies-service.ts
6. Verificar que FriendliesView no necesita cambios (no debería)
```

**Tiempo estimado de implementación:** 3–4 horas para Fase 3b completa.

---

## Variables de entorno necesarias (Fase 3b)

```bash
# .env.local
FOOTBALL_API_KEY=tu_api_key_aqui
FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io

# Vercel Dashboard → Settings → Environment Variables
FOOTBALL_API_KEY=tu_api_key_aqui
```

---

## Estimación de costos operativos

| Fase | Proveedor | Plan | Costo/mes | Req/día estimados |
|------|-----------|------|-----------|------------------|
| Dev / Staging | Mock (actual) | — | $0 | — |
| 3b MVP | API-Football | Basic | ~$14 | ~50 (con caché) |
| 3c WC en vivo | Sportmonks | Base | ~€29 | webhooks (ilimitados) |
| 3d Post-WC | API-Football | Basic | ~$14 | ~30 |

**Costo total Fase 3b + 3c durante el Mundial (jun–jul 2026):** ~$14 + ~€29 = ~$45 por 2 meses si se migra. O ~$28 con solo API-Football si se omite minuto a minuto real.

---

*Documento generado como guía para decisión de proveedor — sin código implementado.*
