# Quiniela Mundial 2026 — Architecture Plan
**Fecha:** 2026-06-03  
**Sprint:** 6 — Diseño y Arquitectura  
**Estado:** Propuesta de diseño — pendiente aprobación

---

## 1. Modelo de Juego

### 1.1 Tipos de predicción

#### Fase de Grupos (partidos A-1-1 → L-3-3, 72 matches)

| Tipo | Descripción | Ventana |
|------|-------------|---------|
| **1X2** | Local / Empate / Visitante | Antes del kickoff |
| **Marcador exacto** | 2-1, 0-0, etc. | Antes del kickoff |

El usuario predice **un único marcador** (e.g., `2-1`). El sistema deriva automáticamente la predicción 1X2 del marcador ingresado:
- `2-1` → predicción local (L)
- `0-0` → predicción empate (E)
- `1-3` → predicción visitante (V)

Esto simplifica el formulario: **un solo input de marcador** cubre ambos tipos.

#### Fase Eliminatoria (R32 → Final, 32 matches)

| Tipo | Descripción | Ventana |
|------|-------------|---------|
| **Equipo ganador** | Quién avanza | Antes del kickoff |
| **Marcador exacto (90')** | Resultado al cabo de 90 minutos | Antes del kickoff |

En la fase eliminatoria **no hay empate en el resultado final**, pero sí puede terminar 1-1 en los 90' y decidirse en prórroga o penales. El sistema distingue:

- **Resultado a 90':** puede ser empate (1-1). Es lo que se predice con el marcador.
- **Ganador del partido:** el equipo que avanza. Puede diferir si hay OT/penales.

El usuario predice AMBOS:
1. Marcador a los 90' (puede ser empate)
2. Quién avanza (ya sea si hay empate o no en 90')

#### Tercer Lugar (match `3rd`)

Mismo sistema que la fase eliminatoria. Se predice el marcador a 90' y el ganador.

#### Final

Mismo sistema. Premio adicional si se predijo el campeón correctamente (ver sección de puntuación).

---

### 1.2 Cierre automático antes del kickoff

```
Predicción válida: created_at < kickoff_time - 60 segundos
```

**Fuente del kickoff_time:** `calendar-data.ts` → convierte `date` + `time` + `timezone` a UTC.

El servidor valida en el Route Handler. Si el partido ya comenzó, devuelve HTTP 409 con:
```json
{ "error": "MATCH_LOCKED", "kickoff": "2026-06-11T19:00:00Z" }
```

El cliente muestra el estado "bloqueado" en la tarjeta de predicción.

---

### 1.3 Manejo de prórroga y penales (fase eliminatoria)

| Situación | Resultado predicho vs real | Resultado |
|-----------|---------------------------|-----------|
| Predijo 2-1 (local). Resultado 90': 2-1. Local avanza | Marcador exacto ✅ + Ganador ✅ | Máxima puntuación |
| Predijo 1-1 (empate). Resultado 90': 1-1. Local gana penales. Predijo local gana | Marcador 90' exacto ✅ + Ganador ✅ | Máxima puntuación |
| Predijo 2-0 (local). Resultado 90': 1-1. Local gana penales. Predijo local gana | Marcador ❌ + Ganador ✅ | Puntos por ganador |
| Predijo local gana. Visitante avanza por penales | Ganador ❌ | 0 puntos |

**Regla clave:** El marcador exacto se evalúa siempre al **90'** (o 120' incluyendo prórroga si hubiera), NO al resultado de penales.

Para la MVP: evaluar marcador a 90'. El campo `home_score`/`away_score` de la API siempre refleja el resultado a 90' (`FT` status), con scores adicionales en campos separados para OT/penales.

---

### 1.4 Resumen de predicciones por fase

| Fase | Predicción de marcador | Predicción de ganador | Total matches |
|------|----------------------|----------------------|---------------|
| Grupos | ✅ | N/A (se deriva) | 72 |
| R32 | ✅ (a 90') | ✅ | 32 |
| R16 | ✅ (a 90') | ✅ | 16 |
| Cuartos | ✅ (a 90') | ✅ | 8 |
| Semis | ✅ (a 90') | ✅ | 4 |
| 3er Lugar | ✅ (a 90') | ✅ | 1 |
| Final | ✅ (a 90') | ✅ (campeón) | 1 |
| **Total** | **134** | **62** | **134** |

---

## 2. Sistema de Puntuación

Ver `QUINIELA_SCORING_PROPOSAL.md` para comparativa de sistemas. Esta sección usa el **Sistema Recomendado (Balanceado)**.

### 2.1 Fase de Grupos

El resultado deriva del marcador predicho vs marcador real:

| Condición | Puntos |
|-----------|--------|
| Marcador exacto (e.g., predijo 2-1, fue 2-1) | **5** |
| Resultado correcto, diferencia correcta (predijo 3-2, fue 2-1) | **4** |
| Resultado correcto (predijo 2-0, fue 2-1) | **3** |
| Diferencia de goles correcta, resultado incorrecto (predijo 1-0, fue 0-1) | **1** |
| Sin acierto | **0** |

> **Nota:** Solo se asigna el nivel más alto alcanzado. No se acumulan capas.

### 2.2 Fase Eliminatoria

| Condición | Puntos |
|-----------|--------|
| Ganador correcto + Marcador 90' exacto | **6** |
| Ganador correcto + Diferencia 90' correcta | **5** |
| Ganador correcto (cualquier marcador) | **4** |
| Marcador 90' exacto pero ganador incorrecto | **2** |
| Diferencia 90' correcta pero ganador incorrecto | **1** |
| Sin acierto | **0** |

### 2.3 Bonificaciones especiales

| Evento | Bonus |
|--------|-------|
| Predijo el campeón ANTES del torneo (predicción al abrir quiniela) | **+10** |
| Predijo el finalista ANTES del torneo | **+4** |
| Predijo el ganador de cada grupo correctamente (los 12) | **+2 por grupo** |
| Predicción perfecta de la semana (todos los partidos de la jornada) | **+3 por jornada** |

> **MVP:** Implementar solo las predicciones partido a partido. Los bonos de predicción anticipada van en Sprint 6C.

### 2.4 Resumen de puntos máximos posibles

| Fase | Partidos | Pts máx/partido | Total máx |
|------|----------|-----------------|-----------|
| Grupos (J1+J2+J3) | 72 | 5 | 360 |
| R32 | 32 | 6 | 192 |
| R16 | 16 | 6 | 96 |
| Cuartos | 8 | 6 | 48 |
| Semis | 4 | 6 | 24 |
| 3er Lugar | 1 | 6 | 6 |
| Final | 1 | 6 | 6 |
| **Total** | **134** | — | **732** |

Con bonos anticipados: hasta ~780 pts posibles.

---

## 3. Arquitectura Supabase

### 3.1 Diagrama relacional

```
profiles ──────────────┐
                       │
pools ─────────────────┤
  │                    │
  ├── pool_members ────┘
  │
  ├── predictions (user + match + pool)
  │     └── user_match_scores (resultado calculado)
  │
  └── standings (leaderboard cacheado)
        └── scoring_runs (auditoría)
```

---

### 3.2 Tabla `pools`

**Propósito:** Define una quiniela — puede ser global, pública o privada.

```sql
CREATE TABLE pools (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('global', 'public', 'private')),
  invite_code text UNIQUE,              -- NULL para global/public
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  settings    jsonb DEFAULT '{}',       -- phase_filter, scoring_variant, etc.
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Índices
CREATE UNIQUE INDEX pools_invite_code_idx ON pools(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX pools_type_idx ON pools(type);
```

**RLS:**
- `SELECT`: todos los autenticados (pools globales/públicas), miembros para privadas
- `INSERT`: cualquier usuario autenticado (crear pool privada propia)
- `UPDATE`: solo `created_by`
- `DELETE`: solo `created_by`

---

### 3.3 Tabla `pool_members`

**Propósito:** Relación user ↔ pool. Para MVP, la pool global incluye automáticamente a todos.

```sql
CREATE TABLE pool_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id    uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  timestamptz DEFAULT now(),
  UNIQUE (pool_id, user_id)
);

-- Índices
CREATE INDEX pool_members_pool_idx   ON pool_members(pool_id);
CREATE INDEX pool_members_user_idx   ON pool_members(user_id);
```

**RLS:**
- `SELECT`: el propio usuario + miembros de la misma pool
- `INSERT`: usuario autenticado (join a pool activa)
- `DELETE`: el propio usuario (salir) o `created_by` de la pool

---

### 3.4 Tabla `predictions`

**Propósito:** Una predicción por usuario por partido por pool. Inmutable después del kickoff.

```sql
CREATE TABLE predictions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id          uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Identificador del partido (nuestro ID estático: 'A-1-1', 'R32-1', etc.)
  match_id         text NOT NULL,
  -- Marcador predicho a 90'
  home_score_pred  smallint NOT NULL CHECK (home_score_pred >= 0 AND home_score_pred <= 30),
  away_score_pred  smallint NOT NULL CHECK (away_score_pred >= 0 AND away_score_pred <= 30),
  -- Para fase eliminatoria: quién avanza (código FIFA 3 letras)
  winner_pred      char(3),
  -- Auditoría de bloqueo
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  locked_at        timestamptz,          -- SET cuando el partido empieza
  UNIQUE (pool_id, user_id, match_id)
);

-- Índices
CREATE INDEX predictions_pool_match_idx  ON predictions(pool_id, match_id);
CREATE INDEX predictions_user_pool_idx   ON predictions(user_id, pool_id);
CREATE INDEX predictions_match_idx       ON predictions(match_id);
CREATE INDEX predictions_locked_idx      ON predictions(locked_at) WHERE locked_at IS NULL;
```

**RLS:**
```sql
-- Lectura: propio usuario (sus predicciones) + predicciones ajenas SOLO después de locked_at
CREATE POLICY "predictions_read" ON predictions FOR SELECT
  USING (
    auth.uid() = user_id
    OR locked_at IS NOT NULL
  );

-- Escritura: solo el propio usuario, solo si no está bloqueado
CREATE POLICY "predictions_insert" ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND locked_at IS NULL);

CREATE POLICY "predictions_update" ON predictions FOR UPDATE
  USING (auth.uid() = user_id AND locked_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND locked_at IS NULL);

-- Sin DELETE (auditoría)
```

> **Crítico:** El lock real se valida server-side en el Route Handler comparando `now() UTC` contra `kickoff_time` de `calendar-data.ts`. El campo `locked_at` es el registro del momento en que se bloqueó.

---

### 3.5 Tabla `user_match_scores`

**Propósito:** Resultado del scoring por partido, por usuario. Inmutable una vez calculado (re-run limpia y recalcula).

```sql
CREATE TABLE user_match_scores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id       uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id      text NOT NULL,
  prediction_id uuid REFERENCES predictions(id) ON DELETE SET NULL,
  -- Resultado real (a 90')
  home_score_real  smallint,
  away_score_real  smallint,
  winner_real      char(3),    -- para fase eliminatoria
  -- Puntuación
  base_points      smallint DEFAULT 0,
  bonus_points     smallint DEFAULT 0,
  total_points     smallint GENERATED ALWAYS AS (base_points + bonus_points) STORED,
  -- Detalle del cálculo (qué se acertó)
  score_tier       text CHECK (score_tier IN ('exact', 'result_diff', 'result', 'diff', 'none')),
  winner_correct   boolean,
  -- Auditoría
  scored_at        timestamptz DEFAULT now(),
  scoring_run_id   uuid REFERENCES scoring_runs(id),
  UNIQUE (pool_id, user_id, match_id)
);

-- Índices
CREATE INDEX ums_pool_match_idx    ON user_match_scores(pool_id, match_id);
CREATE INDEX ums_user_pool_idx     ON user_match_scores(user_id, pool_id);
CREATE INDEX ums_pool_points_idx   ON user_match_scores(pool_id, total_points DESC);
```

**RLS:**
- `SELECT`: cualquier miembro de la pool (leaderboard público dentro del pool)
- `INSERT/UPDATE/DELETE`: solo service role (background scoring)

---

### 3.6 Tabla `standings`

**Propósito:** Leaderboard cacheado por pool. Se recalcula después de cada scoring run.

```sql
CREATE TABLE standings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id         uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Puntuación agregada
  total_points    integer DEFAULT 0,
  -- Estadísticas de aciertos
  exact_count     smallint DEFAULT 0,   -- marcadores exactos
  result_count    smallint DEFAULT 0,   -- resultados correctos (sin exacto)
  diff_count      smallint DEFAULT 0,   -- diferencia correcta
  winner_count    smallint DEFAULT 0,   -- ganadores correctos (eliminatoria)
  total_preds     smallint DEFAULT 0,   -- total predicciones realizadas
  -- Ranking
  rank            integer,
  rank_change     smallint DEFAULT 0,   -- cambio desde la última actualización
  -- Metadatos
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (pool_id, user_id)
);

-- Índices
CREATE INDEX standings_pool_rank_idx    ON standings(pool_id, total_points DESC, exact_count DESC);
CREATE INDEX standings_user_pools_idx   ON standings(user_id);
```

**RLS:**
- `SELECT`: cualquier usuario autenticado (para pools públicas) / miembros para privadas
- `INSERT/UPDATE/DELETE`: solo service role

---

### 3.7 Tabla `scoring_runs`

**Propósito:** Log de ejecuciones de scoring. Para auditoría y debugging.

```sql
CREATE TABLE scoring_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         text NOT NULL,
  home_score_final smallint,
  away_score_final smallint,
  winner_final     char(3),
  -- Resultado
  predictions_evaluated smallint DEFAULT 0,
  users_scored          smallint DEFAULT 0,
  -- Metadatos
  run_at           timestamptz DEFAULT now(),
  triggered_by     text CHECK (triggered_by IN ('cron', 'manual', 'api', 'test')),
  duration_ms      integer,
  status           text CHECK (status IN ('success', 'partial', 'error')),
  error_detail     text
);

-- Índice
CREATE INDEX scoring_runs_match_idx ON scoring_runs(match_id, run_at DESC);
```

**RLS:**
- `SELECT`: todos los autenticados
- `INSERT/UPDATE`: solo service role

---

### 3.8 Resumen de índices críticos

| Tabla | Índice | Query que optimiza |
|-------|--------|--------------------|
| `predictions` | `(pool_id, match_id)` | Scoring batch: obtener todas las preds de un partido |
| `predictions` | `(user_id, pool_id)` | "Mis predicciones" view |
| `user_match_scores` | `(pool_id, total_points DESC)` | Leaderboard query |
| `standings` | `(pool_id, total_points DESC, exact_count DESC)` | Top-N ranking |

---

## 4. Modalidades de Quiniela

### Opción A: Quiniela Global Única

Todos los usuarios del álbum participan automáticamente en una pool global. No hay invitaciones, no hay configuración.

**Ventajas:**
- Implementación más simple (sin gestión de pools)
- Fomenta comunidad entre todos los usuarios
- Sin fricciones de onboarding

**Desventajas:**
- Con 1000+ usuarios el leaderboard pierde personalización
- No permite competir solo entre amigos

**Complejidad:** Baja

---

### Opción B: Quinielas Privadas entre Amigos

Cualquier usuario puede crear una pool privada con un código de invitación. Comparte el código con amigos.

**Ventajas:**
- Experiencia más íntima y competitiva
- No requiere un mínimo de usuarios
- Se puede usar el álbum como plataforma de grupo

**Desventajas:**
- Requiere gestión de pools (crear, unirse, salir)
- UI más compleja (selector de pool activa)
- Más tablas y queries

**Complejidad:** Media

---

### Opción C: Global + Privadas (combinadas)

Pool global automática para todos + capacidad de crear pools privadas adicionales.

**Ventajas:**
- Máxima flexibilidad
- Compite en ambos contextos

**Desventajas:**
- Mayor complejidad de UI y backend
- Predicciones duplicadas (una por pool)
- Más carga en Supabase

**Complejidad:** Alta

---

### ✅ Recomendación: Opción A → migrar a C

**Sprint 6A-B:** Implementar Opción A (global única). La tabla `pools` ya está preparada para la expansión. El `pool_id` en `predictions` permite escalar a C sin migrar datos.

**Sprint 7+ (futuro):** Agregar Opción B/C cuando haya suficientes usuarios que lo pidan.

---

## 5. Integración con Live Data

### 5.1 Cuándo se calcula el puntaje

```
Match API status: 'completed' (FT)
        ↓
Route Handler /api/scoring/run detecta el cambio
        ↓
Lock todas las predictions para ese match_id
        ↓
Calcular puntos para cada prediction
        ↓
INSERT/UPSERT en user_match_scores
        ↓
Recalcular standings (UPDATE standings)
        ↓
INSERT en scoring_runs (log)
```

### 5.2 Cómo detectar partido finalizado

**Método 1 — Cron Job (recomendado para MVP):**
- Vercel Cron cada 5 minutos → `/api/scoring/run`
- El handler compara la lista de partidos que deberían haber terminado con los que ya tienen `scoring_run`
- Si encuentra un partido con `status === 'completed'` en la API sin scoring → ejecuta

```typescript
// Pseudo-código del cron
const today = matches from calendar-data for today's date
const apiResults = await fetch('/api/live/wc?date=today')
const completed = apiResults.matches.filter(m => m.status === 'completed')
const unscored = completed.filter(m => !scoring_runs.has(m.id))
for (const match of unscored) { await scoreMatch(match) }
```

**Método 2 — Webhook de Live Data (futuro):**
- Detectar en `useLiveWc` cuando un match pasa de `live/halftime` a `completed`
- Emitir un Server Action o llamar al endpoint de scoring
- Más tiempo real pero requiere estado en el cliente

**Para MVP:** Método 1 (Cron).

### 5.3 Recalcular standings

```sql
-- Después de cada scoring run para un pool_id:
INSERT INTO standings (pool_id, user_id, total_points, exact_count, ...)
SELECT 
  pool_id,
  user_id,
  SUM(total_points),
  COUNT(*) FILTER (WHERE score_tier = 'exact'),
  ...
FROM user_match_scores
WHERE pool_id = $1
GROUP BY pool_id, user_id
ON CONFLICT (pool_id, user_id) DO UPDATE SET
  total_points = EXCLUDED.total_points,
  exact_count = EXCLUDED.exact_count,
  updated_at = now()
```

### 5.4 Idempotencia del scoring

Si el cron corre dos veces para el mismo partido:
```sql
INSERT INTO user_match_scores (...) 
ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET
  base_points = EXCLUDED.base_points,
  scored_at = now()
```

El resultado es el mismo. Seguro re-ejecutar.

---

## 6. Dashboard — Quiniela Block

### 6.1 Datos a mostrar

```
┌─────────────────────────────────────┐
│ 🏆 Quiniela Mundial 2026            │
│                                     │
│  Tu posición    Puntos     Aciertos  │
│    #47 / 312    128 pts   23/67     │
│                                     │
│  📊 Top 5                           │
│  1. JuanPa       245 pts  ████████  │
│  2. Maria_G      238 pts  ███████   │
│  3. FutbolFan    221 pts  ███████   │
│  4. AlbumKing    198 pts  ██████    │
│  5. WorldCup26   187 pts  ██████    │
│                                     │
│  ─────────────────────────────      │
│  47. (Tú)        128 pts  ████      │
│                                     │
│  [ Ver quiniela completa → ]        │
└─────────────────────────────────────┘
```

### 6.2 Queries necesarias

```typescript
// Mi posición
const myStanding = await supabase
  .from('standings')
  .select('total_points, rank, exact_count, total_preds')
  .eq('pool_id', GLOBAL_POOL_ID)
  .eq('user_id', userId)
  .single()

// Top 5 + mi posición (si no está en top 5)
const top5 = await supabase
  .from('standings')
  .select('user_id, total_points, rank, profiles(display_name)')
  .eq('pool_id', GLOBAL_POOL_ID)
  .order('total_points', { ascending: false })
  .limit(5)
```

### 6.3 Inserción en DashboardView

En `DashboardView.tsx`, después de `LiveMatchesBlock`:
```tsx
<QuinielaSummaryBlock userId={userId} />
```

El bloque se oculta si el usuario no tiene predicciones aún.

---

## 7. Escalabilidad

### 7.1 Con 10 usuarios

- No se requieren índices adicionales ni caching
- `standings` puede calcularse on-demand (sin caché)
- Cualquier query < 10ms

### 7.2 Con 100 usuarios

- Los índices actuales son suficientes
- `standings` cacheado en tabla es la opción correcta
- El cron de scoring puede correr en <2s por partido

### 7.3 Con 1000 usuarios

- Necesario: **paginación** en el leaderboard (top-10 visible + posición propia)
- **`rank` pre-calculado** en `standings` (no calcular en query time)
- El scoring cron procesa 1000 predicciones/partido → ~500ms con índices correctos
- Supabase Free tier: 500MB DB, límite de conexiones → suficiente para 1000 users
- Si crece: Supabase Pro (~$25/mes) o connection pooler (PgBouncer)

### 7.4 Estrategia de paginación en leaderboard

```sql
-- Obtener top-N + posición del usuario
WITH ranked AS (
  SELECT *, RANK() OVER (ORDER BY total_points DESC, exact_count DESC) as rank
  FROM standings WHERE pool_id = $pool_id
)
SELECT * FROM ranked WHERE rank <= 10 OR user_id = $user_id
ORDER BY rank
```

---

## 8. Seguridad

### 8.1 Bloqueo después del kickoff

**Capa 1 — Route Handler (principal):**
```typescript
// En POST /api/quiniela/predictions
const match = WC2026_MATCHES.find(m => m.id === matchId)
if (!match) return 409
const kickoff = toUTC(match.date, match.time, match.timezone)
if (Date.now() >= kickoff.getTime() - 60_000) {
  return Response.json({ error: 'MATCH_LOCKED' }, { status: 409 })
}
```

**Capa 2 — RLS (respaldo):**
```sql
-- Update solo si locked_at IS NULL
CREATE POLICY "predictions_update" ON predictions FOR UPDATE
  USING (auth.uid() = user_id AND locked_at IS NULL)
```

**Capa 3 — Lock automático:**
El cron de scoring, antes de calcular puntos, ejecuta:
```sql
UPDATE predictions SET locked_at = now()
WHERE match_id = $match_id AND locked_at IS NULL
```

Esto impide cualquier edición posterior incluso si el Route Handler tuviera un bug.

### 8.2 Auditoría básica

- `predictions.created_at` — timestamp inmutable (vía trigger)
- `predictions.updated_at` — último cambio antes del lock
- `predictions.locked_at` — momento del cierre
- `scoring_runs` — log completo de cada cálculo
- `user_match_scores.scored_at` — cuándo se calculó el puntaje

### 8.3 Prevención de edición post-lock

- No hay endpoint DELETE para predicciones
- El campo `locked_at` se setea por el cron (service role), no por el usuario
- RLS bloquea UPDATE cuando `locked_at IS NOT NULL`
- Las predicciones son visibles para otros usuarios solo después de `locked_at` → evita copiar predicciones ajenas

---

## 9. Roadmap de Implementación

### Sprint 6A — Fundación (2-3h)

**Objetivo:** Predicciones funcionando para fase de grupos.

```
☐ Crear tablas en Supabase (SQL migration):
    pools, pool_members, predictions, scoring_runs
☐ INSERT global pool (id hardcodeada en env: GLOBAL_POOL_ID)
☐ Route Handler: GET /api/quiniela/predictions?matchId=
☐ Route Handler: POST /api/quiniela/predictions
    - Validación de kickoff lock
    - Validación de rango de marcador (0-30)
☐ RLS policies en predictions
☐ usePredictions hook (client-side, con useSWR o fetch directo)
☐ TypeScript types para Quiniela
```

**Entregable:** El usuario puede ingresar predicciones de marcador para los 72 partidos de grupos antes de su inicio.

---

### Sprint 6B — UI Completa (3-4h)

**Objetivo:** Vista completa de quiniela en el tab placeholder.

```
☐ QuinielaView component — lista de partidos por jornada
☐ PredictionCard — muestra partido + input de predicción
☐ Estado: pendiente / predicho / bloqueado / finalizado
☐ PredictionInput — dos inputs numéricos (local-visitante)
☐ Validación UX: números entre 0-30, no negativos
☐ Estado bloqueado: mostrar predicción hecha (no editable)
☐ Estado finalizado: mostrar resultado real + puntos ganados
☐ Activar tab "Quiniela" en navegación
☐ Extensión a fase eliminatoria (selector de ganador + marcador)
```

**Entregable:** Tab de quiniela funcional con predicciones, estados y resultados.

---

### Sprint 6C — Scoring + Leaderboard (3-4h)

**Objetivo:** Puntaje automático y ranking.

```
☐ Crear tabla user_match_scores en Supabase
☐ Crear tabla standings en Supabase
☐ Función scoreMatch() — lógica de puntuación
☐ Route Handler: POST /api/scoring/run (service role)
☐ Vercel Cron: cada 5 minutos → /api/scoring/run
☐ Lock automático de predicciones al inicio del partido
☐ Recalcular standings después de cada scoring
☐ QuinieleLeaderboard component (top-10 + mi posición)
☐ QuinielaSummaryBlock en DashboardView
☐ Página "Mis estadísticas de quiniela"
```

**Entregable:** Quiniela completa con scoring automático, ranking en tiempo real y bloque en el Dashboard.

---

### Timeline estimado total

| Sprint | Horas | Fecha objetivo |
|--------|-------|----------------|
| 6A | 2-3h | Antes del 6 Jun |
| 6B | 3-4h | Antes del 9 Jun |
| 6C | 3-4h | Antes del 11 Jun (apertura) |
| **Total** | **8-11h** | **11 Jun 2026** |

> **Crítico:** La quiniela debe estar activa **antes del 11 de junio** para que los usuarios puedan predecir el partido inaugural MEX vs RSA a las 13:00 CT.

---

## Apéndice: Variables de entorno necesarias

```bash
# .env.local
GLOBAL_POOL_ID=<uuid-de-la-pool-global>     # generado al crear el pool
SCORING_SECRET=<token-secreto>               # para autenticar el cron de scoring
```

```bash
# Vercel Environment Variables
GLOBAL_POOL_ID=...
SCORING_SECRET=...
# (API_FOOTBALL_KEY ya está configurada)
```

---

## Apéndice: Consideraciones futuras (Sprint 7+)

| Feature | Esfuerzo | Impacto |
|---------|----------|---------|
| Pools privadas entre amigos | Medio | Alto |
| Predicción del campeón anticipada | Bajo | Medio |
| Predicción por grupos (quién clasifica) | Medio | Medio |
| Notificaciones de puntos ganados | Medio | Alto |
| Exportar quiniela a PDF | Bajo | Bajo |
| Quiniela de Amistosos (pre-WC) | Bajo | Bajo |
