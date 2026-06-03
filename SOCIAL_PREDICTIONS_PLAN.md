# Social Predictions — Plan de Arquitectura
**Fecha:** 2026-06-03  
**Estado:** Propuesta de diseño — pendiente aprobación de implementación  
**Base:** Predicciones Simples ya desplegadas (localStorage MVP)

---

## Principio rector

> Evolucionar desde localStorage hacia Supabase de forma incremental,
> manteniendo la UI actual intacta y agregando la capa social en sprints separados.
> Sin pools privadas, sin ligas múltiples, sin pagos.

---

## 1. Arquitectura recomendada

### 1.1 Qué migra de localStorage a Supabase

| Dato | Hoy (localStorage) | Con Supabase |
|------|--------------------|--------------|
| Predicción de partido (`home_score`, `away_score`) | `album-wc2026-predictions-v1` | Tabla `predictions` |
| Predicción de campeón | ❌ No existe | Tabla `champion_predictions` |
| Puntaje calculado | ❌ No existe | Tabla `prediction_scores` |
| Ranking | ❌ No existe | Vista `prediction_leaderboard` |

**localStorage** pasa a ser solo **caché optimista** — se escribe localmente al instante y se sincroniza con Supabase en background. Si el usuario no tiene sesión, funciona offline.

### 1.2 Qué se mantiene local

| Dato | Razón |
|------|-------|
| localStorage como caché de lectura rápida | Evita flashes vacíos al montar el componente |
| Estado de los inputs (home/away en el momento de tipear) | Estado UI efímero, no necesita persistencia remota |

### 1.3 Cómo se simplifica vs el diseño anterior

El diseño anterior de Quiniela completa tenía 6 tablas (`pools`, `pool_members`, `predictions`, `user_match_scores`, `standings`, `scoring_runs`).

**Este diseño usa 3 tablas + 1 vista:**

```
predictions          ← predicciones de partido
champion_predictions ← predicción de campeón/finalista
prediction_scores    ← puntaje calculado por servicio
─────────────────────────────────────────────────────
prediction_leaderboard  (VIEW, no tabla)  ← ranking on-the-fly
```

**Qué se elimina:**
- ❌ `pools` — no hay pools, es un contexto global único
- ❌ `pool_members` — no hay membresía, todos participan
- ❌ `standings` — se reemplaza por vista calculada en tiempo real
- ❌ `scoring_runs` — el scoring se registra directamente en `prediction_scores`

---

## 2. Modelo mínimo Supabase

### 2.1 Tabla `predictions`

Predicción de marcador por usuario por partido. Misma semántica que localStorage pero persistente y social.

```sql
CREATE TABLE IF NOT EXISTS predictions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id         text        NOT NULL,       -- 'A-1-1', 'R32-1', 'FINAL', etc.
  home_score_pred  smallint    NOT NULL CHECK (home_score_pred BETWEEN 0 AND 30),
  away_score_pred  smallint    NOT NULL CHECK (away_score_pred BETWEEN 0 AND 30),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  locked_at        timestamptz,               -- SET por el trigger/cron al inicio del partido
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS predictions_user_idx   ON predictions(user_id);
CREATE INDEX IF NOT EXISTS predictions_match_idx  ON predictions(match_id);
CREATE INDEX IF NOT EXISTS predictions_locked_idx ON predictions(match_id) WHERE locked_at IS NULL;
```

**Sin `pool_id`** — contexto global único. Si en el futuro se agregan pools, se añade la columna y se migra.

---

### 2.2 Tabla `champion_predictions`

Predicción del campeón y finalista. Se bloquea al inicio del torneo (Jun 11 13:00 CT).

```sql
CREATE TABLE IF NOT EXISTS champion_predictions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  champion_code  char(3)     NOT NULL,     -- FIFA 3-letter code, ej. 'ARG'
  finalist_code  char(3),                 -- opcional: equipo que llega a la final
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  locked_at      timestamptz             -- SET globalmente al kickoff del partido inaugural
);

CREATE INDEX IF NOT EXISTS champ_pred_user_idx ON champion_predictions(user_id);
```

**Lógica de bloqueo global:** El campo `locked_at` se setea para TODOS los usuarios cuando MEX-RSA comienza (`match_id = 'A-1-1'`). Es un bloqueo único para toda la competencia (no por kickoff de partido).

---

### 2.3 Tabla `prediction_scores`

Resultado del scoring por partido por usuario. Escrito solo por el servicio de scoring (service role). Un registro por (user_id, match_id).

```sql
CREATE TABLE IF NOT EXISTS prediction_scores (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id       text        NOT NULL,
  -- Resultado real usado para calcular
  home_score_real smallint,
  away_score_real smallint,
  -- Puntuación
  base_points    smallint    NOT NULL DEFAULT 0,
  bonus_points   smallint    NOT NULL DEFAULT 0,
  total_points   smallint    GENERATED ALWAYS AS (base_points + bonus_points) STORED,
  -- Detalle del tier para UI ("¿qué acertaste?")
  score_tier     text        CHECK (score_tier IN ('exact','result_diff','result','diff','none')),
  -- Auditoría
  scored_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS pred_scores_user_idx   ON prediction_scores(user_id);
CREATE INDEX IF NOT EXISTS pred_scores_match_idx  ON prediction_scores(match_id);
CREATE INDEX IF NOT EXISTS pred_scores_points_idx ON prediction_scores(total_points DESC);
```

---

### 2.4 Vista `prediction_leaderboard`

Ranking calculado en tiempo real, sin tabla cacheada. Para un universo de ≤1000 usuarios, una VIEW es suficiente y elimina la necesidad de un cron de actualización de standings.

```sql
CREATE OR REPLACE VIEW prediction_leaderboard AS
SELECT
  ps.user_id,
  p.display_name,
  SUM(ps.total_points)                                           AS total_points,
  COUNT(*) FILTER (WHERE ps.score_tier = 'exact')               AS exact_count,
  COUNT(*) FILTER (WHERE ps.score_tier IN ('result_diff','result')) AS result_count,
  COUNT(*) FILTER (WHERE ps.score_tier = 'diff')                AS diff_count,
  COUNT(*)                                                       AS matches_scored,
  -- Bonus campeón (si champion_predictions está calculado)
  COALESCE(cp_bonus.bonus_points, 0)                            AS champion_bonus,
  SUM(ps.total_points) + COALESCE(cp_bonus.bonus_points, 0)    AS grand_total,
  RANK() OVER (
    ORDER BY (SUM(ps.total_points) + COALESCE(cp_bonus.bonus_points, 0)) DESC,
             COUNT(*) FILTER (WHERE ps.score_tier = 'exact') DESC
  )                                                              AS rank
FROM prediction_scores ps
JOIN profiles p ON p.id = ps.user_id
LEFT JOIN (
  -- Bonus por campeón acertado (se calcula cuando el campeón es conocido)
  SELECT user_id, 10 AS bonus_points
  FROM champion_predictions
  WHERE champion_code = (
    SELECT home_code_winner  -- campo que se setea cuando el FINAL termina
    FROM match_results
    WHERE match_id = 'FINAL'
    LIMIT 1
  ) AND locked_at IS NOT NULL
) cp_bonus ON cp_bonus.user_id = ps.user_id
GROUP BY ps.user_id, p.display_name, cp_bonus.bonus_points;
```

> **Nota de implementación:** La subquery de campeón se simplifica en Sprint E cuando se confirme el campeón. Para Sprint D (ranking sin campeón), omitir el JOIN de champion bonus.

**Versión MVP (Sprint D) sin campeón:**
```sql
CREATE OR REPLACE VIEW prediction_leaderboard AS
SELECT
  ps.user_id,
  p.display_name,
  SUM(ps.total_points)                                              AS total_points,
  COUNT(*) FILTER (WHERE ps.score_tier = 'exact')                  AS exact_count,
  COUNT(*) FILTER (WHERE ps.score_tier IN ('result_diff','result')) AS result_count,
  COUNT(*)                                                          AS matches_scored,
  RANK() OVER (
    ORDER BY SUM(ps.total_points) DESC,
             COUNT(*) FILTER (WHERE ps.score_tier = 'exact') DESC
  ) AS rank
FROM prediction_scores ps
JOIN profiles p ON p.id = ps.user_id
GROUP BY ps.user_id, p.display_name;
```

---

## 3. Visibilidad social

### 3.1 Mis predicciones

- Accesibles siempre (antes y después del kickoff)
- Guardadas en Supabase + localStorage como caché
- Editables hasta 60s antes del kickoff

### 3.2 Predicciones de otros usuarios

**Política de privacidad:** Las predicciones ajenas son visibles **solo después del kickoff** del partido correspondiente. Antes, nadie puede copiar la predicción de otro.

```
Antes del kickoff:  solo el propio usuario ve su predicción
Después del kickoff: todos los usuarios autenticados ven todas las predicciones del partido
```

Esto se implementa en RLS:
```sql
CREATE POLICY "predictions_read" ON predictions FOR SELECT
USING (
  user_id = auth.uid()           -- siempre puedo ver las mías
  OR locked_at IS NOT NULL       -- ajenas: solo post-kickoff
);
```

### 3.3 Vista por partido

En la UI: al expandir un partido (ya bloqueado), mostrar las predicciones de otros usuarios con su display_name y score_tier (si ya fue calculado).

```typescript
// Query: predicciones de todos los usuarios para un partido específico
SELECT pred.home_score_pred, pred.away_score_pred,
       prof.display_name, sc.score_tier, sc.total_points
FROM predictions pred
JOIN profiles prof ON prof.id = pred.user_id
LEFT JOIN prediction_scores sc ON sc.user_id = pred.user_id AND sc.match_id = pred.match_id
WHERE pred.match_id = $matchId
AND pred.locked_at IS NOT NULL    -- solo si el partido ya comenzó
ORDER BY sc.total_points DESC NULLS LAST, prof.display_name
```

### 3.4 Ranking general

- Vista `prediction_leaderboard` ordenada por `grand_total DESC`
- Paginada: top-20 + posición del usuario actual
- Actualizable en tiempo real (la vista recalcula en cada query)

---

## 4. Sistema de puntaje

Ver `SOCIAL_PREDICTIONS_SCORING.md` para reglas completas. Resumen:

| Nivel | Condición | Puntos |
|-------|-----------|--------|
| Exacto | Marcador exacto | 5 |
| Resultado + diferencia | Mismo W/D/L + mismo Δgoles | 4 |
| Resultado | Mismo W/D/L | 3 |
| Diferencia | Mismo Δgoles, resultado diferente | 1 |
| Nada | — | 0 |
| Campeón correcto | Champion acertado | +10 |
| Finalista correcto | Finalista acertado | +4 |

---

## 5. Predicción de campeón

### 5.1 Ventana de predicción

```
Disponible:  Desde que el usuario abre la app
Se bloquea:  Jun 11 2026, 13:00 CT - 60s (mismo kickoff que MEX-RSA)
Fuente:      calendar-data.ts → match 'A-1-1'
```

El usuario elige:
1. **Campeón** (obligatorio): 1 equipo de los 48 clasificados
2. **Finalista** (opcional): el equipo que llega a la final pero pierde

### 5.2 Qué pasa si el equipo elegido queda eliminado

| Situación | Resultado |
|-----------|-----------|
| Campeón predicho queda eliminado en grupos | 0 puntos. Sin ajuste retroactivo. |
| Campeón predicho pierde en la final | 0 puntos por campeón, pero +4 si también eligió ese equipo como finalista |
| Finalista predicho gana (se convierte en campeón) | Solo puntúa si también lo eligió como campeón |

**Regla de oro:** No hay ajustes retroactivos. Se eligió, se apostó, se acepta el resultado.

### 5.3 Cuándo se calcula el puntaje

```
El scoring del campeón se ejecuta cuando:
  match_id = 'FINAL' → status = 'completed'
  
El cron de scoring detecta el partido FINAL completado,
consulta champion_predictions y actualiza prediction_scores
con los bonus correspondientes.
```

### 5.4 Visibilidad de la predicción de campeón

- **Antes de Jun 11:** Solo el propio usuario la ve (privada)
- **Después de Jun 11:** Visible para todos los usuarios autenticados

```sql
-- RLS para champion_predictions
CREATE POLICY "champ_read" ON champion_predictions FOR SELECT
USING (
  user_id = auth.uid()
  OR locked_at IS NOT NULL
);
```

---

## 6. Seguridad

### 6.1 Bloqueo de predicciones de partido

**Capa 1 — Route Handler (autoridad primaria):**
```typescript
// POST /api/predictions
const { isLocked } = getKickoffInfo(matchId)   // usa calendar-data.ts
if (isLocked) return Response.json({ error: 'MATCH_LOCKED' }, { status: 409 })
```

**Capa 2 — RLS en Supabase:**
```sql
CREATE POLICY "predictions_update" ON predictions FOR UPDATE
USING (user_id = auth.uid() AND locked_at IS NULL)
WITH CHECK (user_id = auth.uid() AND locked_at IS NULL);
```

**Capa 3 — Lock automático por trigger:**
```sql
-- Función que setea locked_at cuando llega la hora
CREATE OR REPLACE FUNCTION lock_predictions_for_match(p_match_id text)
RETURNS void AS $$
  UPDATE predictions SET locked_at = now()
  WHERE match_id = p_match_id AND locked_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;
```
Llamada por el cron de scoring al detectar partido iniciado.

### 6.2 Bloqueo de predicción de campeón

```typescript
// El bloqueo de campeón usa el kickoff del primer partido (A-1-1)
const { isLocked } = getKickoffInfo('A-1-1')
if (isLocked) return Response.json({ error: 'CHAMPION_LOCKED' }, { status: 409 })
```

Una vez que MEX-RSA comienza, nadie puede cambiar su predicción de campeón.

### 6.3 RLS completo por tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `predictions` | Propias siempre; ajenas solo si `locked_at IS NOT NULL` | Solo `auth.uid() = user_id` | Solo si `locked_at IS NULL` | ❌ Prohibido |
| `champion_predictions` | Propias siempre; ajenas si `locked_at IS NOT NULL` | Solo `auth.uid() = user_id` | Solo si `locked_at IS NULL` | ❌ Prohibido |
| `prediction_scores` | Todos los auth | ❌ Solo service role | ❌ Solo service role | ❌ Solo service role |
| `prediction_leaderboard` (VIEW) | Todos los auth | N/A | N/A | N/A |

### 6.4 Prevención de manipulación de locked_at

El campo `locked_at` nunca está en el payload de INSERT/UPDATE del usuario. El Route Handler no lo incluye. Solo el cron (service role) y los triggers lo setean.

---

## 7. Estrategia de migración desde localStorage

```
Fase de transición (Sprint B):

1. Al guardar una predicción:
   a. Escribe en localStorage (inmediato — UX rápida)
   b. POST /api/predictions → guarda en Supabase (background)
   c. Si falla Supabase: localStorage actúa como fallback offline

2. Al cargar predicciones:
   a. Render inicial: lee localStorage (sin flicker)
   b. En background: GET /api/predictions → compara con localStorage
   c. Si Supabase tiene más reciente: actualiza estado y localStorage

3. Primer login:
   a. Detectar si hay predicciones en localStorage
   b. Ofrecer "¿Querés sincronizar tus predicciones existentes?"
   c. Bulk upsert al servidor
```

Este patrón garantiza **offline-first con sync eventual**.

---

## 8. Roadmap de implementación

### Sprint A — Schema Supabase mínimo (1-2h)
```
☐ Crear migrations/social_predictions_v1.sql con:
    predictions (sin pool_id)
    champion_predictions
    prediction_scores
    VIEW prediction_leaderboard (versión MVP sin campeón)
☐ RLS policies para las 3 tablas
☐ Función lock_predictions_for_match()
☐ Verificar en SQL Editor de Supabase
☐ Configurar GLOBAL_POOL_ID → no necesario (sin pools)
```

### Sprint B — Guardar en Supabase (2-3h)
```
☐ Route Handler: POST /api/predictions (con kickoff lock server-side)
☐ Route Handler: GET /api/predictions?userId=...
☐ Actualizar usePredictions: escribe en localStorage + POST a API
☐ Al montar: GET desde API, merge con localStorage
☐ Sync de predicciones existentes al hacer login
☐ Indicador visual de "guardado" vs "guardando..."
☐ Sin cambios en PredictionsView (usa el hook)
```

### Sprint C — Ver predicciones de otros (2h)
```
☐ Route Handler: GET /api/predictions/match/[matchId]
    Retorna predicciones de todos los usuarios (solo si locked_at IS NOT NULL)
☐ Componente MatchPredictionsPanel (expandible, dentro de PredictionCard)
    Muestra lista de: display_name | predicción | score_tier (si ya se calculó)
☐ Solo visible en partidos ya iniciados
```

### Sprint D — Puntaje y ranking (2-3h)
```
☐ Función scoreMatch(matchId, homeReal, awayReal) — lógica de scoring Sistema B
☐ Route Handler: POST /api/scoring/match (service role)
☐ Vercel Cron: cada 5 minutos → detectar matches completed → ejecutar scoring
☐ Route Handler: GET /api/leaderboard → query a VIEW prediction_leaderboard
☐ LeaderboardView componente (puede ser sección en DashboardView o tab Predicciones)
☐ Mi posición: rank + total_points + breakdown (exact/result/diff)
```

### Sprint E — Predicción de campeón (2h)
```
☐ Route Handler: POST /api/predictions/champion
☐ Route Handler: GET /api/predictions/champion
☐ ChampionPredictionCard en PredictionsView (sección especial en la parte superior)
☐ UI: selector de bandera del campeón + opcional finalista
☐ Estado: editable hasta Jun 11, luego read-only con reveal post-torneo
☐ Cron scoring: detectar FINAL completed → calcular bonus campeón → UPDATE prediction_scores
☐ Actualizar VIEW prediction_leaderboard con champion_bonus
```

### Timeline estimado total

| Sprint | Horas | Fecha objetivo |
|--------|-------|----------------|
| A — Schema | 1-2h | Lo antes posible |
| B — Guardar en Supabase | 2-3h | Antes del 8 Jun |
| C — Ver otros | 2h | Antes del 10 Jun |
| D — Puntaje + ranking | 2-3h | Antes del 11 Jun |
| E — Campeón | 2h | Antes del 11 Jun |
| **Total** | **9-12h** | **11 Jun 2026** |

> **Crítico:** Sprint B debe completarse antes del 11 de junio para que las predicciones queden guardadas en Supabase antes del primer partido.

---

## Apéndice: Diferencias clave vs la Quiniela compleja anterior

| Aspecto | Quiniela compleja (cancelada) | Social Predictions (nueva) |
|---------|-------------------------------|---------------------------|
| Tablas | 6 | 3 + 1 vista |
| `pools` | ✅ (múltiples) | ❌ (sin pools) |
| `standings` | ✅ (tabla cacheada) | ❌ (vista calculada) |
| `scoring_runs` | ✅ (auditoría) | ❌ (log en prediction_scores) |
| Predicción campeón | ❌ | ✅ |
| Ranking | Cacheado | On-the-fly |
| Migración desde localStorage | N/A | ✅ Offline-first con sync |
| Complejidad total | Alta | **Baja-Media** |
