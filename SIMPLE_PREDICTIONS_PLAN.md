# Predicciones Simples — Plan de Implementación
**Fecha:** 2026-06-03  
**Enfoque:** localStorage MVP · Sin Supabase · Sin ranking · Sin puntos

---

## Objetivo

Permitir que cada usuario guarde su predicción de marcador para los 104 partidos del Mundial 2026, directamente en el navegador. Sin base de datos, sin autenticación, sin competencia.

---

## Arquitectura

```
WC2026_MATCHES (calendar-data.ts, 104 partidos)
       │
       ├── usePredictions (localStorage hook)
       │     localStorage key: 'album-wc2026-predictions-v1'
       │     { [matchId]: { homeScore, awayScore, savedAt } }
       │
       ├── getKickoffInfo (lib/quiniela/kickoff.ts — ya implementado)
       │     → isLocked: boolean
       │
       └── useLiveWc (ya implementado)
             → liveByKey: Map<homeCode-awayCode, LiveMatch>
             → real scores para comparación
```

**Sin llamadas nuevas a la API.** Todo reutiliza infraestructura existente.

---

## localStorage Schema

```
Key:   'album-wc2026-predictions-v1'
Value: JSON string de PredictionStore

type PredictionStore = {
  [matchId: string]: {   // matchId = 'A-1-1', 'R32-1', 'FINAL', etc.
    homeScore: number    // 0–30
    awayScore: number    // 0–30
    savedAt:  string     // ISO 8601
  }
}
```

**Ejemplo:**
```json
{
  "A-1-1": { "homeScore": 2, "awayScore": 1, "savedAt": "2026-06-10T14:32:00.000Z" },
  "A-1-2": { "homeScore": 0, "awayScore": 0, "savedAt": "2026-06-10T14:33:00.000Z" }
}
```

---

## Archivos nuevos

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/usePredictions.ts` | Hook: leer/escribir predicciones en localStorage |
| `src/components/PredictionsView.tsx` | Vista completa de predicciones (tab Quiniela) |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/page.tsx` | Reemplazar placeholder de Quiniela con `<PredictionsView />` |

---

## Flujo de estados por tarjeta de partido

```
Partido upcoming + sin predicción
  → Inputs editables [0] – [0] + botón "Guardar"

Partido upcoming + con predicción
  → Inputs editables con valores guardados + botón "Actualizar" + "Borrar"

Partido locked (kickoff pasó) + con predicción
  → Predicción guardada en solo-lectura (no inputs)
  → "🔒 Bloqueado · Tu predicción: 2-1"

Partido locked + sin predicción
  → "🔒 Sin predicción guardada"

Partido completed + con predicción + resultado real disponible
  → Tu predicción: 2-1
  → Resultado real: 1-0
  → ✅ Resultado acertado (o ✅ Marcador exacto / ❌ No acertado)

Partido completed + sin predicción
  → "Sin predicción para este partido"
```

---

## Reglas de bloqueo

La función `isMatchLocked(matchId)` de `src/lib/quiniela/kickoff.ts` ya implementada:
- Retorna `true` cuando `now() >= kickoffUTC - 60s`
- Usa `WC2026_MATCHES` como fuente de verdad (calendar-data.ts)
- El hook `usePredictions.save()` llama `isMatchLocked()` antes de escribir
- El componente bloquea los inputs cuando `isLocked === true`

**Limitación documentada:** La validación es solo client-side (localStorage). Un usuario técnico podría editar localStorage después del kickoff. Esto es aceptable para un MVP personal sin ranking.

---

## Lógica de comparación de resultados

```typescript
type ResultStatus = 'exact' | 'result' | 'wrong' | 'pending'

function getResultStatus(
  pred: { home: number; away: number },
  real: { home: number; away: number }
): ResultStatus {
  if (pred.home === real.home && pred.away === real.away) return 'exact'
  const getOutcome = (h: number, a: number) => h > a ? 'H' : h < a ? 'A' : 'D'
  return getOutcome(pred.home, pred.away) === getOutcome(real.home, real.away)
    ? 'result' : 'wrong'
}
```

| Status | Ícono | Texto |
|--------|-------|-------|
| `exact` | ✅ | Marcador exacto |
| `result` | ✅ | Resultado acertado |
| `wrong` | ❌ | No acertado |
| `pending` | ⏳ | Resultado pendiente |

---

## Integración con Live Data

`useLiveWc()` ya existe — retorna `liveByKey: Map<"HOME-AWAY", LiveMatch>`.

En `PredictionsView`:
```typescript
const { liveByKey } = useLiveWc()
const liveMatch = liveByKey.get(`${match.home.code}-${match.away.code}`)

const realScore = liveMatch?.status === 'completed'
  ? { home: liveMatch.home.score ?? 0, away: liveMatch.away.score ?? 0 }
  : null
```

**Sin llamadas nuevas.** `useLiveWc` ya está montado en CalendarView y se re-usa aquí.

---

## UI Layout

```
┌─────────────────────────────────────────────────┐
│ 🎯 Mis Predicciones                             │
│ Mundial 2026 · Se guardan en este dispositivo   │
│                                                 │
│ 14 predicciones · 5 acertadas · 2 exactas       │
│                                                 │
│ [Todos] [Por predecir] [Mis predicciones] [Final│
│                                                 │
│ ── Jueves 11 junio ─────────────────────────── │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🏆 GRUPO A · Jornada 1         ⏰ 13:00 CT│   │
│ │                                           │   │
│ │   🇲🇽 México  [2] – [1] Sudáfrica 🇿🇦    │   │
│ │                                           │   │
│ │                  [Guardar]                │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🔒 GRUPO A · Jornada 1 · BLOQUEADO        │   │
│ │                                           │   │
│ │   Tu pred: 2-1   Real: 1-0               │   │
│ │   ✅ Resultado acertado                   │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Filtros

| Tab | Criterio |
|-----|----------|
| Todos | Los 104 partidos |
| Por predecir | `!isLocked && !hasPrediction` |
| Mis predicciones | `hasPrediction` (cualquier estado) |
| Finalizados | `status === 'completed'` con datos reales |

---

## Estadísticas en header (cuando hay predicciones)

```typescript
const stats = {
  total:   Object.keys(predictions).length,
  exact:   matchedPredictions.filter(m => m.status === 'exact').length,
  correct: matchedPredictions.filter(m => m.status === 'result').length,
  wrong:   matchedPredictions.filter(m => m.status === 'wrong').length,
}
```

Solo se calculan cuando hay resultados reales disponibles (status completed).

---

## Accesibilidad

- Inputs: `type="number"`, `min="0"`, `max="30"`, `aria-label`
- Botón guardar: `type="button"`, `aria-label`
- Estado bloqueado: `aria-disabled="true"`, `aria-label="Predicción bloqueada"`
- Focus ring: `focus-visible:ring-2`

---

## Lo que NO se implementa en esta versión

- ❌ Puntos / scoring
- ❌ Ranking / leaderboard
- ❌ Supabase / base de datos
- ❌ Autenticación requerida
- ❌ Predicciones de Amistosos
- ❌ Predicciones de fases eliminatorias (winner_pred)
- ❌ Compartir predicciones
- ❌ Notificaciones

---

## Cómo evolucionar a Supabase (futuro)

El hook `usePredictions` tiene una interfaz estable. Migrar sería:

1. Crear tablas `predictions` (ya diseñadas en `quiniela_schema_v1.sql`)
2. Reemplazar las llamadas a `localStorage` en el hook por llamadas a `quinielaService.ts`
3. Mantener localStorage como caché local (offline-first)
4. Agregar `userId` como parámetro del hook

La interfaz del componente `PredictionsView` no cambiaría.
