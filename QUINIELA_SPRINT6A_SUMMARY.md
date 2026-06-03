# Quiniela — Sprint 6A Summary
**Fecha:** 2026-06-03  
**Estado:** ✅ Fundación completa — pendiente ejecución SQL en Supabase

---

## Objetivo del Sprint

Crear la base técnica de la Quiniela: schema SQL, RLS, tipos TypeScript,
validación de kickoff y servicios base. Sin UI ni scoring automático.

---

## Archivos creados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `quiniela_schema_v1.sql` | SQL | 6 tablas + índices + RLS + triggers |
| `quiniela_seed.sql` | SQL | Pool global inicial (ejecutar después del schema) |
| `src/types/quiniela.ts` | TypeScript | Todos los tipos del dominio Quiniela |
| `src/lib/quiniela/config.ts` | TypeScript | Constantes, puntos por tier, fases knockout |
| `src/lib/quiniela/kickoff.ts` | TypeScript | Validación de bloqueo por kickoff |
| `src/services/quinielaService.ts` | TypeScript | 6 funciones de servicio |

**Archivos protegidos — sin cambios:**  
Supabase existente / auth / RLS existente / RPCs / marketplace / trades /
backups / restore / exportaciones PDF / álbum / live data / favoritos /
quiniela / navegación principal → ✅ INTACTOS

---

## Tablas creadas (SQL)

| Tabla | Propósito | Filas esperadas en MVP |
|-------|-----------|------------------------|
| `pools` | Define quinielas (global, pública, privada) | 1 (global) |
| `pool_members` | Relación usuario ↔ pool | 1 por usuario activo |
| `predictions` | Predicciones de marcador por usuario/partido | 134 × N usuarios |
| `user_match_scores` | Puntaje calculado por partido/usuario | Igual que predictions |
| `standings` | Leaderboard cacheado por pool | 1 por usuario activo |
| `scoring_runs` | Auditoría de runs de scoring | 1 por partido finalizado |

### Constraints clave

```sql
-- Unicidad: un usuario solo puede tener una predicción por partido por pool
UNIQUE (pool_id, user_id, match_id)  -- en predictions y user_match_scores

-- Rango de marcador: 0 a 30 goles por equipo
CHECK (home_score_pred >= 0 AND home_score_pred <= 30)

-- Tipos válidos de pool
CHECK (type IN ('global', 'public', 'private'))

-- Tier de scoring válido
CHECK (score_tier IN ('exact', 'result_diff', 'result', 'diff', 'none'))

-- total_points calculado automáticamente
total_points GENERATED ALWAYS AS (base_points + bonus_points) STORED
```

---

## RLS Policies implementadas

| Tabla | Operación | Regla |
|-------|-----------|-------|
| `pools` | SELECT | Autenticados ven globales/públicas + las suyas |
| `pools` | INSERT/UPDATE | Solo el creador |
| `pool_members` | SELECT | Ver propias membresías + miembros de mis pools |
| `pool_members` | INSERT | Solo el propio usuario (join) |
| `pool_members` | DELETE | El propio usuario (leave) |
| `predictions` | SELECT | Propias siempre; ajenas solo si `locked_at IS NOT NULL` |
| `predictions` | INSERT | Solo si `locked_at IS NULL` |
| `predictions` | UPDATE | Solo si `auth.uid() = user_id AND locked_at IS NULL` |
| `predictions` | DELETE | ❌ Prohibido (auditoría) |
| `user_match_scores` | SELECT | Todos los autenticados |
| `user_match_scores` | INSERT/UPDATE/DELETE | Solo service role |
| `standings` | SELECT | Todos los autenticados |
| `standings` | INSERT/UPDATE/DELETE | Solo service role |
| `scoring_runs` | SELECT | Todos los autenticados |
| `scoring_runs` | INSERT/UPDATE | Solo service role |

**Triple capa de seguridad en kickoff lock:**
1. Route Handler valida `now() < kickoffUTC - 60s` antes de cualquier write
2. RLS `USING (locked_at IS NULL)` bloquea UPDATE en rows ya bloqueadas
3. Cron setea `locked_at = now()` cuando el partido inicia (Sprint 6C)

---

## Servicios creados

### `src/services/quinielaService.ts`

| Función | Descripción | Retorna |
|---------|-------------|---------|
| `getGlobalPool()` | Obtiene la pool global activa | `QuinielaResult<Pool>` |
| `joinGlobalPool(userId)` | Auto-join idempotente | `QuinielaResult<PoolMember>` |
| `getUserPredictions(userId)` | Todas las predicciones del usuario | `QuinielaResult<Prediction[]>` |
| `getPrediction(userId, matchId)` | Predicción específica por partido | `QuinielaResult<Prediction\|null>` |
| `savePrediction(userId, input, phase?)` | Crea o actualiza una predicción | `SavePredictionResult` |
| `getStandings(limit?, userId?)` | Top-N + posición del usuario | `QuinielaResult<Standing[]>` |

**Re-exports convenientes:**
```typescript
export { getKickoffInfo, isMatchLocked, getMatchesClosingSoon } from '@/lib/quiniela/kickoff'
```

### Patrón de error tipado en `savePrediction`

```typescript
type SavePredictionError =
  | 'MATCH_LOCKED'       // kickoff ya pasó (validado por calendar-data.ts)
  | 'INVALID_SCORE'      // marcador fuera de rango 0-30
  | 'INVALID_WINNER'     // winner_pred requerido en knockout pero ausente
  | 'NO_POOL'            // pool global no configurada
  | 'NOT_AUTHENTICATED'  // userId vacío
  | 'OFFLINE'            // isOfflineMode activo
  | 'DB_ERROR'           // error inesperado de Supabase
```

---

## Validación de kickoff implementada

### `src/lib/quiniela/kickoff.ts`

**Fuente de verdad:** `WC2026_MATCHES` de `calendar-data.ts` — los mismos 104 partidos del calendario oficial.

**Conversión de timezone a UTC:**

| Abrev. | Significado | Offset en Jun-Jul 2026 (DST) |
|--------|-------------|------------------------------|
| `ET` | Eastern Daylight Time | UTC-4 |
| `CT` | Central Daylight Time | UTC-5 |
| `MT` | Mountain Daylight Time | UTC-6 |
| `PT` | Pacific Daylight Time | UTC-7 |
| `UTC` | Universal | UTC+0 |
| `BRT` | Brasília Time | UTC-3 |

**Ejemplo:** MEX vs RSA, `date: '2026-06-11', time: '13:00', timezone: 'CT'`
```
CT = UTC-5
13:00 CT = 18:00 UTC
lockThreshold = 18:00 UTC - 60s = 17:59 UTC
```

**Funciones exportadas:**
- `getKickoffInfo(matchId)` → `{ isLocked, kickoffUTC, minutesUntilKickoff }`
- `isMatchLocked(matchId)` → `boolean`
- `getMatchesClosingSoon(windowMinutes?)` → `string[]` (IDs de partidos)

**Comportamiento ante ID desconocido:** retorna `isLocked: true` como safe default.

---

## Validaciones realizadas

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ Limpio — 172 kB (igual que Sprint 5) |
| Bundle no aumentó | ✅ Módulos quiniela no importados en páginas aún |
| Archivos protegidos | ✅ NINGUNO modificado |
| SQL idempotente | ✅ `IF NOT EXISTS` + `DO $$ BEGIN...EXCEPTION WHEN duplicate_object` |
| Seed idempotente | ✅ `WHERE NOT EXISTS (SELECT 1 FROM pools WHERE type='global')` |

---

## ⚠️ Pasos manuales necesarios (ejecutar en Supabase Dashboard)

Antes de Sprint 6B (UI), ejecutar en Supabase → SQL Editor:

### Paso 1: Schema

```
Archivo: quiniela_schema_v1.sql
Acción: Copiar contenido → Supabase Dashboard → SQL Editor → Run
```

### Paso 2: Seed

```
Archivo: quiniela_seed.sql
Acción: Copiar contenido → Supabase Dashboard → SQL Editor → Run
Resultado: Copiar el UUID de la pool global del resultado de la query
```

### Paso 3: Variables de entorno

```bash
# .env.local
NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID=<uuid-del-paso-2>

# Vercel → Settings → Environment Variables (Production + Preview)
NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID=<uuid-del-paso-2>
```

### Paso 4: Verificación

Ejecutar en Supabase SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'pools','pool_members','predictions',
    'user_match_scores','standings','scoring_runs'
  )
  ORDER BY table_name;
-- Resultado esperado: 6 filas
```

---

## Limitaciones documentadas

| Limitación | Descripción | Acción |
|-----------|-------------|--------|
| **Ventana de 5min post-kickoff** | El cron de Sprint 6C lockea predicciones 5min después del inicio. En esa ventana, un usuario podría editar via cliente directo si bypassea el Route Handler | Sprint 6C: trigger PG que rechaza UPDATE si `now() > kickoffUTC` |
| **Kickoff timezone hardcodeado** | DST US asumida en Jun-Jul 2026. Si hay partidos con timezone no listado, usa UTC como fallback | Documentado en `kickoff.ts`; fallback es UTC (conservador) |
| **Sin validación de winner_pred** | Cuando `matchPhase` no se pasa a `savePrediction`, no se valida si winner_pred es requerido | Sprint 6B: el formulario siempre pasa la fase del partido |
| **Standings vacíos hasta Sprint 6C** | La tabla `standings` queda vacía hasta que el cron de scoring la llene | Sprint 6B: mostrar "Todavía no hay predicciones scored" |

---

## Riesgos pendientes

| Riesgo | Severidad | Sprint de resolución |
|--------|-----------|---------------------|
| SQL no ejecutado en Supabase | **Crítico** | Debe ejecutarse antes de Sprint 6B |
| `GLOBAL_POOL_ID` no configurado en env | **Crítico** | Servicios devuelven `{ data: null, error: 'NO_POOL' }` gracefully |
| `scoring_runs` FK antes de existir | Bajo | Si Supabase da error, ejecutar `scoring_runs` primero y luego `user_match_scores` |
| Escalabilidad del leaderboard | Bajo | Paginado desde Sprint 6C |
| Rate limit Supabase anon key | Muy bajo | El álbum tiene pocos usuarios; 100ms por query es aceptable |

---

## Próximos pasos (Sprint 6B)

1. Ejecutar SQL en Supabase Dashboard (ver pasos manuales arriba)
2. Configurar `NEXT_PUBLIC_QUINIELA_GLOBAL_POOL_ID` en `.env.local`
3. Implementar `QuinielaView` — lista de partidos con formulario de predicción
4. Implementar `PredictionCard` — estado editable/bloqueado/scored
5. Activar tab "Quiniela" en la navegación principal
6. Hook `usePredictions(userId)` con polling liviano
