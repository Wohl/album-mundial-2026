# Social Predictions — Sistema de Puntaje
**Fecha:** 2026-06-03  
**Estado:** Propuesta de diseño — pendiente aprobación

---

## Principio de diseño del scoring

El sistema de puntaje tiene que ser:
1. **Comprensible en 10 segundos** — el usuario lo entiende sin manual
2. **Diferenciador** — quién más sabe sobre fútbol termina más arriba
3. **Implementable en ~40 líneas** de TypeScript puro sin dependencias

---

## Sistema de puntaje — Partidos de Grupos

Una sola predicción de marcador (e.g., `2-1`) cubre automáticamente la predicción 1X2.

### Niveles (solo se otorga el nivel más alto alcanzado)

| # | Nivel | Condición | Puntos |
|---|-------|-----------|--------|
| 4 | **Exacto** | Marcador exacto (predijo 2-1, fue 2-1) | **5** |
| 3 | **Resultado + Diferencia** | Mismo ganador Y misma diferencia de goles (predijo 3-2, fue 2-1) | **4** |
| 2 | **Resultado** | Mismo W/D/L, diferencia distinta (predijo 3-0, fue 2-1) | **3** |
| 1 | **Diferencia** | Misma diferencia de goles, resultado distinto (predijo 0-1, fue 1-2) | **1** |
| 0 | **Nada** | Sin coincidencia (predijo 2-0, fue 1-3) | **0** |

### Definiciones

```
Resultado   = local gana (L) | empate (E) | visita gana (V)
Diferencia  = |home_score - away_score|
```

### Ejemplos — Partido real: México 2-1 Sudáfrica

| Predicción | Nivel | Puntos | Razón |
|-----------|-------|--------|-------|
| 2-1 | 4 | **5** | Exacto |
| 3-2 | 3 | **4** | Local gana (✅) + diferencia 1 (✅) |
| 1-0 | 3 | **4** | Local gana (✅) + diferencia 1 (✅) |
| 3-0 | 2 | **3** | Local gana (✅) + diferencia 3 (❌) |
| 2-2 | 0 | **0** | Empate (❌) |
| 1-3 | 0 | **0** | Visita gana (❌) |
| 0-1 | 1 | **1** | Visita gana (❌) + diferencia 1 (✅) |

---

## Sistema de puntaje — Fase Eliminatoria

El usuario predice DOS cosas:
1. **Marcador a 90'** — puede terminar empate (e.g., 1-1)
2. **Equipo ganador** — quién avanza (incluyendo si es por OT/penales)

### Niveles knockout (solo el nivel más alto)

| # | Condición | Puntos |
|---|-----------|--------|
| 5 | Ganador correcto + marcador 90' exacto | **6** |
| 4 | Ganador correcto + diferencia 90' correcta | **5** |
| 3 | Ganador correcto (cualquier marcador) | **4** |
| 2 | Ganador incorrecto + marcador 90' exacto (incluye empates) | **2** |
| 1 | Ganador incorrecto + diferencia 90' correcta | **1** |
| 0 | Sin nada correcto | **0** |

### Manejo de prórroga y penales

```
Marcador a 90':
  Siempre se evalúa el resultado al final del tiempo reglamentario (FT).
  El tiempo extra (AET) y los penales NO afectan la comparación de marcador.

Ganador del partido:
  Es el equipo que AVANZA, independientemente de cómo (90', AET, penales).
```

### Ejemplos — R16: Argentina vs Francia (90': 2-2, ARG gana penales)

| Predicción marcador | Ganador pred. | Nivel | Pts |
|---------------------|--------------|-------|-----|
| 2-2 | ARG (gana) | 5 | **6** | Ganador ✅ + exacto 90' ✅ |
| 1-1 | ARG (gana) | 4 | **5** | Ganador ✅ + diff=0 ✅ |
| 3-2 | ARG (gana) | 3 | **4** | Ganador ✅ + marcador ❌ |
| 2-2 | FRA (pierde) | 2 | **2** | Ganador ❌ + exacto 90' ✅ |
| 1-1 | FRA (pierde) | 1 | **1** | Ganador ❌ + diff=0 ✅ |
| 1-0 | FRA (pierde) | 0 | **0** | Nada correcto |

---

## Sistema de puntaje — Predicción de Campeón

### Reglas

| Predicción | Condición de acierto | Puntos |
|-----------|---------------------|--------|
| **Campeón** | El equipo ganó el torneo | **+10** |
| **Finalista** | El equipo llegó a la final (ganó o perdió) | **+4** |

**La predicción de finalista no reemplaza al campeón.** Se evalúan de forma independiente:
- Si predijo el campeón correcto: +10
- Si predijo el finalista correcto (aunque el campeón sea incorrecto): +4
- Si predijo el mismo equipo como campeón y como finalista: solo +10 (no se acumulan)

### Casos especiales

| Situación | Resultado |
|-----------|-----------|
| Equipo elegido campeón queda eliminado antes de la final | 0 puntos campeón + 0 puntos finalista (aunque llegara a final) |
| Equipo elegido finalista resulta ser el campeón | +4 puntos por finalista (el equipo llegó a la final) pero 0 por campeón (si eligió otro campeón) |
| Eligió mismo equipo como campeón Y como finalista | Si gana: +10 (no +14). +4 solo si eligió equipo DIFERENTE que llega a final |

### Cuándo se calcula

```
Trigger:  match_id = 'FINAL' → status = 'completed'
Cron detecta el partido FINAL completado
→ Lee ganador de FINAL (home o away según score)
→ Lee champion_predictions de todos los usuarios
→ Calcula bonus y escribe en prediction_scores (separate rows con match_id = 'CHAMPION_BONUS')
→ La VIEW prediction_leaderboard ya incluye estos puntos
```

### Ventana de predicción de campeón

```
Abre:     Desde que la app está disponible (ahora mismo)
Cierra:   Jun 11 2026, 13:00 CT - 60s = 17:59 UTC
           (60 segundos antes del kickoff de MEX-RSA, match_id = 'A-1-1')
```

Si el usuario no elige campeón antes del cierre, no puntúa en este bonus (no hay valor por defecto).

---

## Puntos máximos posibles

### Por fase

| Fase | Partidos | Pts máx/partido | Total máx |
|------|----------|-----------------|-----------|
| Grupos | 72 | 5 | 360 |
| R32 | 32 | 6 | 192 |
| R16 | 16 | 6 | 96 |
| Cuartos | 8 | 6 | 48 |
| Semis | 4 | 6 | 24 |
| Tercer lugar | 1 | 6 | 6 |
| Final | 1 | 6 | 6 |
| **Subtotal partidos** | **134** | — | **732** |

### Bonus

| Bonus | Puntos |
|-------|--------|
| Campeón correcto | +10 |
| Finalista correcto | +4 |
| **Total máximo** | **746** |

### Rango realista para usuarios activos

| Perfil | Rango esperado |
|--------|----------------|
| Experto que predice todos los partidos | 350-500 pts |
| Usuario casual (solo partidos de favoritos) | 80-180 pts |
| Experto con campeón correcto | 360-510 pts |

---

## Implementación en código

```typescript
// src/lib/quiniela/scoring.ts

export type ScoreTier = 'exact' | 'result_diff' | 'result' | 'diff' | 'none'

export interface ScoreResult {
  tier: ScoreTier
  basePoints: number
}

/**
 * Score a group stage match prediction against the real result.
 */
export function scoreGroupMatch(
  pred: { home: number; away: number },
  real: { home: number; away: number }
): ScoreResult {
  const exactMatch = pred.home === real.home && pred.away === real.away
  if (exactMatch) return { tier: 'exact', basePoints: 5 }

  const outcome = (h: number, a: number) => h > a ? 'L' : h < a ? 'V' : 'E'
  const resultMatch = outcome(pred.home, pred.away) === outcome(real.home, real.away)
  const diffMatch = Math.abs(pred.home - pred.away) === Math.abs(real.home - real.away)

  if (resultMatch && diffMatch) return { tier: 'result_diff', basePoints: 4 }
  if (resultMatch)              return { tier: 'result',      basePoints: 3 }
  if (diffMatch)                return { tier: 'diff',        basePoints: 1 }
  return                               { tier: 'none',        basePoints: 0 }
}

/**
 * Score a knockout match prediction.
 * @param winnerPred  - FIFA 3-letter code of predicted advancing team
 * @param winnerReal  - FIFA 3-letter code of actual advancing team
 * @param pred        - Predicted score at 90'
 * @param real        - Real score at 90' (NOT including AET/penalties)
 */
export function scoreKnockoutMatch(
  winnerPred: string,
  winnerReal: string,
  pred: { home: number; away: number },
  real: { home: number; away: number }
): ScoreResult {
  const winnerMatch = winnerPred === winnerReal
  const exactMatch  = pred.home === real.home && pred.away === real.away
  const diffMatch   = Math.abs(pred.home - pred.away) === Math.abs(real.home - real.away)

  if (winnerMatch && exactMatch) return { tier: 'exact',       basePoints: 6 }
  if (winnerMatch && diffMatch)  return { tier: 'result_diff', basePoints: 5 }
  if (winnerMatch)               return { tier: 'result',      basePoints: 4 }
  if (exactMatch)                return { tier: 'diff',        basePoints: 2 }  // "diff" repurposed for knockout "exactOnly"
  if (diffMatch)                 return { tier: 'diff',        basePoints: 1 }
  return                                { tier: 'none',        basePoints: 0 }
}

/**
 * Score champion + finalist predictions.
 */
export function scoreChampionPrediction(
  pred: { championCode: string; finalistCode?: string },
  realChampion: string,
  realFinalist: string    // the team that lost the final
): number {
  let bonus = 0
  if (pred.championCode === realChampion) bonus += 10
  if (pred.finalistCode) {
    // Finalista: either team that appeared in the final
    const appearedInFinal = pred.finalistCode === realChampion || pred.finalistCode === realFinalist
    if (appearedInFinal && pred.finalistCode !== pred.championCode) bonus += 4
  }
  return bonus
}
```

### Complejidad del scoring

```
scoreGroupMatch    → 6 condiciones, ~15 líneas ✅
scoreKnockoutMatch → 6 condiciones, ~15 líneas ✅
scoreChampionPrediction → 3 condiciones, ~10 líneas ✅
Total scoring logic: ~40 líneas sin dependencias
```

---

## Sistema de desempate en el ranking

Cuando dos usuarios tienen los mismos puntos totales:

| Prioridad | Criterio |
|-----------|---------|
| 1 | Mayor cantidad de marcadores exactos (`exact_count`) |
| 2 | Mayor cantidad de resultados acertados (`result_count`) |
| 3 | Mayor cantidad de partidos predichos (`matches_scored`) |
| 4 | Registro más antiguo en `predictions` (quién jugó antes) |

Los criterios 1-3 están en la VIEW. El criterio 4 no se implementa para MVP (es irrelevante en la práctica).

---

## Transparencia con el usuario

### Qué se muestra después de cada partido

```
Tu predicción: 2-1
Resultado real: 2-1
✅ Marcador exacto — +5 puntos
```

```
Tu predicción: 3-2
Resultado real: 2-1
✅ Resultado acertado + diferencia — +4 puntos
```

```
Tu predicción: 2-2
Resultado real: 2-1
❌ No acertado — 0 puntos
```

### Qué se muestra en el perfil de usuario

```
Total: 234 puntos  (#12 de 89 participantes)

Marcadores exactos:    8  × 5 pts = 40 pts
Resultado + diferencia: 12 × 4 pts = 48 pts
Solo resultado:         18 × 3 pts = 54 pts
Solo diferencia:         5 × 1 pt  =  5 pts
Campeón correcto:        1 × 10 pts = 10 pts
Otros:                   0
─────────────────────────────────────────
Total:                                234 pts  ✓
```

---

## Comparativa con el sistema anterior (Sistema A — Clásico)

| Criterio | Sistema A (solo 1X2) | Sistema B (este) |
|----------|---------------------|-------------------|
| Puntos por marcador exacto | 3 | **5** |
| Diferenciación en ranking | Baja | Alta |
| Complejidad de reglas | Muy baja | Baja |
| Input del usuario | Selector L/E/V | Un marcador (deríva L/E/V) |
| UX | 1 click | 2 números |
| Implementación | ~10 líneas | **~40 líneas** |

La diferencia de complejidad es mínima (30 líneas adicionales). La mejora en diferenciación del ranking justifica el uso del Sistema B.
