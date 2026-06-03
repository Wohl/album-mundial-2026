# Quiniela Mundial 2026 — Scoring System Proposal
**Fecha:** 2026-06-03  
**Sprint:** 6 — Diseño de Sistema de Puntuación

---

## Resumen ejecutivo

Se proponen tres sistemas de puntuación. El **Sistema B (Balanceado)** es la recomendación final para el MVP por su equilibrio entre simplicidad de implementación y profundidad de juego.

---

## Sistema A — Clásico Simple

### Reglas

Solo se evalúa el resultado 1X2:

| Predicción | Resultado real | Puntos |
|-----------|---------------|--------|
| L (gana local) | Local gana | **3** |
| E (empate) | Empate | **3** |
| V (gana visitante) | Visitante gana | **3** |
| Cualquier error | — | **0** |

El marcador exacto no cuenta. Solo importa quién gana (o empata).

**Fase eliminatoria:**
| Predicción | Resultado | Puntos |
|-----------|-----------|--------|
| Ganador correcto | — | **3** |
| Ganador incorrecto | — | **0** |

### Ventajas

- ✅ Extremadamente simple de implementar (2 comparaciones)
- ✅ Todos entienden las reglas inmediatamente
- ✅ Sin debates sobre qué cuenta en OT/penales para el marcador
- ✅ Scoring code: ~10 líneas

### Desventajas

- ❌ Predecir 5-0 es igual que predecir 1-0 → desincentiva pensar en detalle
- ❌ Poca diferenciación entre usuarios → muchos empates en el ranking
- ❌ Menos entretenido después del partido (no hay "casi lo tuve")
- ❌ No recompensa el conocimiento profundo del fútbol

### Complejidad de implementación

```
Route Handler: ★☆☆☆☆  (trivial)
UI:            ★★☆☆☆  (solo selector 1X2)
Scoring:       ★☆☆☆☆  (una comparación)
```

### Evaluación

**Puntuación: 5/10** — Funciona pero desperdicia la oportunidad de hacer la quiniela más interesante.

---

## Sistema B — Balanceado (Recomendado)

### Reglas — Fase de Grupos

Una sola predicción de marcador (e.g., `2-1`) genera automáticamente la predicción 1X2.

#### Evaluación por niveles (solo el nivel más alto alcanzado)

| Nivel | Condición | Puntos |
|-------|-----------|--------|
| **Nivel 4: Exacto** | Marcador exacto (2-1 = 2-1) | **5** |
| **Nivel 3: Resultado + Diferencia** | Ganador ✅ + Diferencia de goles ✅ (3-2 cuando fue 2-1: ambos diff=1) | **4** |
| **Nivel 2: Resultado** | Ganador ✅, diferencia ❌ (2-0 cuando fue 2-1) | **3** |
| **Nivel 1: Diferencia** | Ganador ❌, diferencia ✅ (1-0 cuando fue 0-1: ambos diff=1) | **1** |
| **Nivel 0: Nada** | Nada correcto (3-1 cuando fue 1-3) | **0** |

#### Cálculo de diferencia de goles

```
Diferencia = abs(home_score - away_score)
```

- `2-1` → diferencia = 1
- `3-2` → diferencia = 1 ✅ (misma diferencia que 2-1)
- `2-0` → diferencia = 2 ❌ (distinta que 2-1)

---

#### Ejemplos prácticos (Grupo A, Jornada 1: MEX 2 - 1 RSA)

| Predicción | Nivel | Puntos | Razonamiento |
|-----------|-------|--------|--------------|
| `2-1` (exacto) | 4 | **5** | Marcador exacto |
| `3-2` (local gana, diff=1) | 3 | **4** | Ganador ✅, diff=1 ✅ |
| `1-0` (local gana, diff=1) | 3 | **4** | Ganador ✅, diff=1 ✅ |
| `3-0` (local gana, diff≠1) | 2 | **3** | Ganador ✅, diff=3 ❌ |
| `2-2` (empate) | 0 | **0** | Resultado ❌ |
| `1-3` (visita gana) | 0 | **0** | Resultado ❌ |
| `0-1` (visita gana, diff=1) | 1 | **1** | Ganador ❌, diff=1 ✅ |

---

### Reglas — Fase Eliminatoria

El usuario predice DOS cosas:
1. **Marcador a 90'** (puede ser empate, e.g., 1-1)
2. **Equipo ganador** (quién avanza)

#### Evaluación (solo el nivel más alto)

| Nivel | Condición | Puntos |
|-------|-----------|--------|
| **Nivel 5** | Ganador ✅ + Marcador 90' exacto | **6** |
| **Nivel 4** | Ganador ✅ + Diferencia 90' correcta | **5** |
| **Nivel 3** | Ganador ✅ (cualquier marcador) | **4** |
| **Nivel 2** | Ganador ❌ + Marcador 90' exacto | **2** |
| **Nivel 1** | Ganador ❌ + Diferencia 90' correcta | **1** |
| **Nivel 0** | Nada correcto | **0** |

> **Nota:** El bonus por Nivel 2 (marcador exacto sin ganador) se debe a que predecir un empate exacto en 90' es valioso incluso si no adivinó quién ganó en penales.

---

#### Ejemplos (R32: MEX vs RSA — resultado 90': 1-1, MEX gana penales)

| Predicción | Ganador pred. | Marcador 90' pred. | Nivel | Pts |
|-----------|--------------|-------------------|-------|-----|
| MEX, marcador 1-1 | ✅ | ✅ exacto | 5 | **6** |
| MEX, marcador 0-0 | ✅ | diff=0 ✅ | 4 | **5** |
| MEX, marcador 2-0 | ✅ | diff=2 ❌ | 3 | **4** |
| RSA, marcador 1-1 | ❌ | ✅ exacto | 2 | **2** |
| RSA, marcador 0-0 | ❌ | diff=0 ✅ | 1 | **1** |
| RSA, marcador 3-1 | ❌ | diff=2 ❌ | 0 | **0** |

---

### Código de scoring (pseudo-TypeScript)

```typescript
interface MatchResult {
  homeScore: number
  awayScore: number
  winner?: string    // para eliminatoria
}

interface Prediction {
  homeScorePred: number
  awayScorePred: number
  winnerPred?: string
}

function scoreGroupMatch(pred: Prediction, result: MatchResult): number {
  const { homeScorePred: ph, awayScorePred: pv } = pred
  const { homeScore: rh, awayScore: rv } = result

  const exactMatch = ph === rh && pv === rv
  if (exactMatch) return 5

  const predResult = ph > pv ? 'L' : ph < pv ? 'V' : 'E'
  const realResult = rh > rv ? 'L' : rh < rv ? 'V' : 'E'
  const resultMatch = predResult === realResult

  const predDiff = Math.abs(ph - pv)
  const realDiff = Math.abs(rh - rv)
  const diffMatch = predDiff === realDiff

  if (resultMatch && diffMatch) return 4
  if (resultMatch) return 3
  if (diffMatch) return 1
  return 0
}

function scoreKnockoutMatch(pred: Prediction, result: MatchResult): number {
  const winnerMatch = pred.winnerPred === result.winner
  const { homeScorePred: ph, awayScorePred: pv } = pred
  const { homeScore: rh, awayScore: rv } = result

  const exactMatch = ph === rh && pv === rv
  const predDiff = Math.abs(ph - pv)
  const realDiff = Math.abs(rh - rv)
  const diffMatch = predDiff === realDiff

  if (winnerMatch && exactMatch) return 6
  if (winnerMatch && diffMatch) return 5
  if (winnerMatch) return 4
  if (exactMatch) return 2
  if (diffMatch) return 1
  return 0
}
```

Complejidad total del scoring: **~40 líneas** de lógica pura, sin dependencias.

---

### Ventajas

- ✅ Un solo input de marcador → UX simple
- ✅ Scoring tiered → más justo y entretenido
- ✅ Diferenciación clara en el ranking
- ✅ Implementación limpia (~40 líneas de lógica pura)
- ✅ Las reglas se pueden explicar en 2 párrafos
- ✅ Compatible con OT/penales sin ambigüedades

### Desventajas

- ❌ Explicar el "Nivel 3" (resultado + diferencia = 4 pts) requiere un ejemplo
- ❌ Algunos usuarios esperan que 5-3 = 5 pts (no 4) porque "acerté el resultado"
- ❌ La diferencia de goles en fase eliminatoria puede confundir si el match va a OT (e.g., 1-1 después de 90')

### Complejidad de implementación

```
Route Handler: ★★☆☆☆  (validación de kickoff + guard de OT)
UI:            ★★☆☆☆  (input marcador para grupos, input marcador + selector ganador para knockout)
Scoring:       ★★☆☆☆  (dos funciones de 20 líneas cada una)
```

### Evaluación

**Puntuación: 9/10** — El mejor balance para el MVP.

---

## Sistema C — Complejo (Fantasy-style)

### Reglas adicionales sobre Sistema B

Además del scoring base, se agregan:

#### Predicciones adicionales por partido
| Predicción extra | Ventana | Puntos |
|-----------------|---------|--------|
| Primer goleador | -5 min kickoff | **+8** |
| Goleador en cualquier momento | -5 min kickoff | **+4** |
| Cantidad de goles totales (over/under 2.5) | Antes del kickoff | **+2** |
| Tarjetas totales (over/under 3.5) | Antes del kickoff | **+2** |

#### Predicciones de torneo (antes del 11 Jun)
| Predicción | Puntos |
|-----------|--------|
| Campeón | **+15** |
| Finalista (cualquiera de los dos) | **+7** |
| Top 4 completo (en orden) | **+20** |
| Top 4 (sin orden) | **+10** |
| Máximo goleador del torneo | **+10** |
| Portero menos goleado | **+6** |

#### Bonus de racha
| Racha | Bonus |
|-------|-------|
| 3 partidos seguidos con puntos | **+2** |
| 5 partidos seguidos con puntos | **+5** |
| Semana perfecta (todos los partidos de una jornada) | **+8** |

### Ventajas

- ✅ Máximo engagement — siempre hay algo que predecir
- ✅ Alta diferenciación en el ranking
- ✅ Enorme potencial de virality (primer goleador correcto)
- ✅ Compatible con jugadores hardcore de fútbol

### Desventajas

- ❌ Implementación compleja (3-4x más código)
- ❌ La UI se complica significativamente
- ❌ Requiere datos de goleadores de la API (disponibles en `/api/live/match/{id}` pero necesita mapeo adicional)
- ❌ Las reglas son difíciles de comunicar a usuarios casuales
- ❌ Scoring de racha requiere state tracking complejo
- ❌ Riesgo de bugs en casos borde (OT, penales, goles anulados)
- ❌ Tiempo de implementación: 15-20h adicionales

### Complejidad de implementación

```
Route Handler: ★★★★☆  (múltiples tipos de predicción)
UI:            ★★★★★  (formulario multi-campo por partido)
Scoring:       ★★★★☆  (múltiples funciones + racha tracking)
```

### Evaluación

**Puntuación: 6/10 para MVP** — Excelente para Sprint 7+. Demasiado para Jun 11.

---

## Tabla comparativa de sistemas

| Criterio | Sistema A | Sistema B | Sistema C |
|----------|-----------|-----------|-----------|
| Tiempo de implementación | 3-5h | 8-11h | 20-30h |
| Complejidad UI | Baja | Media | Alta |
| Complejidad scoring | Muy baja | Baja | Alta |
| Diferenciación en ranking | Baja | Alta | Muy alta |
| Facilidad de entender | Muy alta | Alta | Media |
| Compatibilidad con OT/penales | Alta | Alta | Media (goleadores complica) |
| Datos de API necesarios | Solo status+score | Solo status+score | Score + events + players |
| Escalabilidad | ★★★★★ | ★★★★★ | ★★★☆☆ |
| Engagement esperado | Bajo | Medio-Alto | Muy Alto |
| Recomendado para Jun 11 | Sí (backup) | **Sí ✅** | No |

---

## ✅ Recomendación final: Sistema B (Balanceado)

### Por qué Sistema B

1. **UX limpia:** Un único input de marcador en cada tarjeta. El usuario escribe `2-1` y ya tiene todo.
2. **Reglas memorables:** "Marcador exacto: 5pts. Resultado: 3pts. Algo: 1pt." — Se aprende en 30 segundos.
3. **Diferenciación real:** Los rankings no se llenan de empates, el experto que prevé `2-1` gana más que el que prevé `3-0`.
4. **Implementación alcanzable:** 8-11h de trabajo para el equipo, antes del 11 de junio.
5. **Escalable a Sistema C:** La arquitectura de tablas soporta agregar campos extra (goleador predicho, over/under) sin migración de datos.

### Nota sobre empates en marcador

Si hay empate en puntos totales, el desempate es:
1. Mayor cantidad de marcadores exactos (`exact_count`)
2. Mayor cantidad de resultados correctos (`result_count`)
3. Mayor cantidad de predicciones realizadas (`total_preds`) — premia la participación

Esto ya está modelado en la tabla `standings`.

---

## Reglas especiales a comunicar al usuario

### Qué cuenta para el marcador en eliminatoria

> "Predicís el resultado a los 90 minutos regulares. Si el partido va a prórroga y penales, eso no afecta tu marcador predicho. Pero sí tenés que predecir qué equipo avanza (incluyendo si pasara por penales)."

### Ejemplo comunicable

```
Partido: Argentina vs Francia — Final
Tu predicción: 2-1 Argentina gana
Resultado 90': 2-2 (empate)
Resultado final: Argentina gana por penales (1-0 en la tanda)

Evaluación:
→ Ganador: ✅ Argentina (4 pts base)
→ Marcador 90': ❌ (no exacto, diff tampoco coincide)
→ Total: 4 puntos
```

```
Tu predicción: 2-2 Argentina gana
Resultado 90': 2-2
Resultado final: Argentina gana por penales

Evaluación:
→ Ganador: ✅ Argentina
→ Marcador 90': ✅ exacto (2-2)
→ Total: 6 puntos (nivel máximo)
```

---

## Comparativa de puntos máximos por sistema

| Sistema | Máximo teórico | Con participación completa |
|---------|----------------|---------------------------|
| A | 134 × 3 = 402 pts | Todos aciertan resultado |
| **B** | **134 × 6 ≈ 732 pts** | **Todos aciertan exacto** |
| C | 134 × 6 + bonus ≈ 1200 pts | Todos aciertan todo |

El Sistema B tiene suficiente rango para diferenciar a los mejores sin que los números se vuelvan incomprensibles.
