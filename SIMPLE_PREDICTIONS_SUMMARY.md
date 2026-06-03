# Predicciones Simples — Summary
**Fecha:** 2026-06-03  
**Estado:** ✅ Implementado — listo para producción

---

## Archivos modificados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/hooks/usePredictions.ts` | Nuevo | Hook localStorage — save/get/remove con kickoff lock |
| `src/components/PredictionsView.tsx` | Nuevo | Vista completa — 104 partidos, 4 filtros, comparación de resultados |
| `SIMPLE_PREDICTIONS_PLAN.md` | Nuevo | Plan de diseño (generado antes de implementar) |
| `src/app/page.tsx` | Modificado | Tab "Predicciones" activado; `PredictionsView` conectado |

**Archivos protegidos — sin cambios:**  
Supabase / auth / RLS / RPCs / marketplace / trades / backups / álbum /
favoritos / Calendario Live / Amistosos / Dashboard → ✅ INTACTOS

---

## Almacenamiento localStorage

```
Key:   'album-wc2026-predictions-v1'
Scope: Solo el dispositivo / navegador actual
Type:  JSON string

Schema:
{
  [matchId: string]: {
    homeScore: number    // 0–30
    awayScore: number    // 0–30
    savedAt:  string     // ISO 8601 (usado como change signal)
  }
}

Ejemplo:
{
  "A-1-1": { "homeScore": 2, "awayScore": 1, "savedAt": "2026-06-10T14:32:00.000Z" },
  "FINAL": { "homeScore": 3, "awayScore": 2, "savedAt": "2026-06-11T08:00:00.000Z" }
}
```

**Capacidad:** ~104 entradas × ~80 bytes = ~8 kB. Muy por debajo del límite de 5 MB de localStorage.

**Persistencia:** Sobrevive recargas, cierres de pestaña y reinicios del navegador.  
**No persiste:** Diferente dispositivo, modo privado de Chrome/Safari, limpieza de caché.

---

## Reglas de bloqueo implementadas

```typescript
// usePredictions.save():
if (isMatchLocked(matchId)) return false

// isMatchLocked() — src/lib/quiniela/kickoff.ts:
now() >= kickoffUTC - 60s
```

| Partido | Kickoff local | Bloqueo (UTC-60s) | Fuente |
|---------|--------------|------------------|----|
| MEX vs RSA | 13:00 CT = 18:00 UTC | 17:59 UTC | calendar-data.ts |
| Todos los 104 | En hora local | -60 segundos | WC2026_MATCHES |

**Comportamiento por estado:**

| Estado del partido | Inputs | Botón guardar | Predicción guardada |
|-------------------|--------|---------------|---------------------|
| Upcoming, sin pred | Editables (vacíos) | "Guardar predicción" | — |
| Upcoming, con pred | Editables (pre-filled) | "Actualizar" / "Borrar" | Visible |
| Locked, sin pred | — | — | "Sin predicción guardada" |
| Locked, con pred | Solo lectura | — | Score en gris |
| Completed, con pred | Solo lectura | — | Pred + Real + Badge |

**Limitación documentada:** La validación es client-side. Un usuario técnico podría modificar localStorage directamente después del kickoff. Aceptable para MVP sin ranking.

---

## Validación de resultados

```typescript
type ResultStatus = 'exact' | 'result' | 'wrong'

function getResultStatus(pred, real): ResultStatus {
  if (pred.home === real.home && pred.away === real.away) return 'exact'
  const outcome = (h, a) => h > a ? 'H' : h < a ? 'A' : 'D'
  return outcome(pred.home, pred.away) === outcome(real.home, real.away)
    ? 'result' : 'wrong'
}
```

| Badge | Condición |
|-------|-----------|
| ✅ Marcador exacto | Predicción = resultado real (e.g., 2-1 = 2-1) |
| ✅ Resultado acertado | Mismo W/D/L (e.g., predijo 3-0, fue 2-0 → ambos local) |
| ❌ No acertado | Resultado diferente |

**Fuente del resultado real:** `useLiveWc()` → `liveByKey` → `status === 'completed'`. Sin llamadas adicionales.

---

## Integración con Live Data

| Función | Fuente | Llamadas adicionales |
|---------|--------|---------------------|
| Kickoff lock | `calendar-data.ts` → `getKickoffInfo()` | 0 |
| Score real | `useLiveWc()` (ya montado) | 0 |
| 104 partidos | `WC2026_MATCHES` (estático) | 0 |

**`useLiveWc()`** se monta en `PredictionsView` — solo cuando el usuario está en el tab Predicciones. Cuando está en Calendario, se monta allí. No hay doble polling (los tabs son mutuamente excluyentes en el render).

---

## Filtros implementados

| Tab | Criterio | Orden |
|-----|----------|-------|
| **Todos** | 104 partidos | Ascendente por fecha |
| **Por predecir** | `!isLocked` | Ascendente (primeros por jugarse) |
| **Mis predicciones** | `predictions[matchId] != null` | Ascendente por fecha |
| **Finalizados** | `liveMatch.status === 'completed'` | Descendente (más recientes primero) |

---

## Estadísticas en header

Se calculan dinámicamente cuando hay resultados reales en `liveByKey`:

```
[N predicciones] · [N exactas] · [N acertadas] · [N falladas]
```

Invisible hasta que el WC produzca partidos completados (Jun 12 en adelante).

---

## Cambios en page.tsx

| Cambio | Detalle |
|--------|---------|
| Import agregado | `import { PredictionsView } from '@/components/PredictionsView'` |
| Guard eliminado | `if (tab === 'quiniela') return` removido de `handleMainTabChange` |
| Tab habilitado | `disabled: true, soon: true` → sin esas props |
| Label renombrado | `'Quiniela'` → `'Predicciones'` |
| Contenido | Placeholder "Próximamente" → `<PredictionsView />` |
| Nav styling | Eliminado el estilo especial naranja/dashed para quiniela |
| Badge "Pronto" | Eliminado |

---

## Validaciones realizadas

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ Limpio — 176 kB (+4 kB vs anterior) |
| Tab navegación activo | ✅ Click → navega a PredictionsView |
| Guardar predicción | ✅ Input → "Guardar" → "✓ Guardado" (1.8s) → estado actualizado |
| Bloqueo de kickoff | ✅ `isMatchLocked()` retorna `true` para pasado |
| Inputs read-only al bloquear | ✅ `disabled` en inputs cuando `isLocked` |
| Empty state | ✅ Mensaje + botón para cambiar de filtro |
| Persistencia al recargar | ✅ `useEffect` carga desde localStorage al montar |
| No afecta Calendario | ✅ `CalendarView` sin cambios |
| No afecta Amistosos | ✅ `FriendliesView` sin cambios |
| No afecta Live Data | ✅ Route Handlers sin cambios |
| No afecta Álbum | ✅ Sin tocar `StickerGallery`, `TeamOverview`, etc. |
| No afecta Marketplace | ✅ Sin cambios |
| No afecta Supabase | ✅ Sin queries, tablas ni RLS modificados |

---

## Limitaciones conocidas

| Limitación | Descripción |
|-----------|-------------|
| Device-only | Las predicciones no se sincronizan entre dispositivos |
| No ranking | Sin puntos ni posición vs otros usuarios |
| Resultado real solo hoy | `useLiveWc()` solo tiene scores del día actual — comparación no disponible para partidos de días anteriores |
| Sin knockout winner | No se predice quién avanza (solo marcador a 90') |
| Sin amistosos | Solo los 104 partidos del Mundial |
| Client-only lock | Usuario técnico podría editar localStorage post-kickoff |

---

## Cómo evolucionar a Supabase

El diseño está preparado para una migración gradual:

```
Paso 1: Crear tabla 'predictions' (ya diseñada en quiniela_schema_v1.sql)
Paso 2: Reemplazar en usePredictions:
  - localStorage.getItem → supabase.from('predictions').select()
  - localStorage.setItem → supabase.from('predictions').upsert()
Paso 3: PredictionsView no necesita cambios (usa el hook)
Paso 4: Agregar ranking/puntos usando user_match_scores + standings
```

La interfaz del hook `{ predictions, save, remove, get, count, loaded }` es idéntica a lo que retornaría una versión Supabase.

---

## Bundle

| Versión | Bundle |
|---------|--------|
| Antes (Sprint 5) | 172 kB |
| Después (Sprint 6 predicciones) | **176 kB** (+4 kB) |
| Route Handlers | 0 B (sin cambios) |
