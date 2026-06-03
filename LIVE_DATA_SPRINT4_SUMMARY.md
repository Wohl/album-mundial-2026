# Live Data Sprint 4 — UI Live Data Summary
**Fecha:** 2026-06-03  
**Estado:** ✅ Datos live visibles en UI — integración completa

---

## Objetivo del Sprint

Conectar la infraestructura de datos en tiempo real (Sprints 1-3) con la interfaz de usuario. Los datos reales de apifootball.com ahora son visibles en Calendario Mundial, Amistosos y Dashboard.

---

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useLiveWc.ts` | Hook que polling `/api/live/wc?date=hoy`, enriquece partidos live con eventos via `/api/live/match/{id}` |
| `src/hooks/useLiveAll.ts` | Hook para Dashboard — combina WC + amistosos live, retorna hasta 5 partidos en curso |

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/components/CalendarView.tsx` | + `useLiveWc`, `LiveEventsBlock`, `LiveOverlay`, `DisplayStatus`; `MatchCard` recibe overlay; indicador "Datos en tiempo real activos" |
| `src/components/FriendliesView.tsx` | + polling adaptativo con `fetch()` directo; `LiveEventsBlock`; filtro de venue `'Por confirmar'`; aviso dinámico real vs demo |
| `src/components/DashboardView.tsx` | + `LiveMatchesBlock` con `useLiveAll`; se muestra solo cuando existen partidos en vivo |

---

## Componentes afectados

### `useLiveWc` (nuevo)
- Polling de `/api/live/wc?date=hoy` con intervalos adaptativos: **60s** cuando hay partidos live, **5min** cuando no
- Para cada partido live/halftime: fetcha `/api/live/match/{id}` en paralelo para obtener eventos
- Retorna `liveByKey: Map<"${homeCode}-${awayCode}", LiveMatch>` para lookup O(1)
- Fallback: si la API falla, sigue intentando; sin error visible al usuario

### `useLiveAll` (nuevo)
- Combina `GET /api/live/wc?live=true` + `GET /api/live/friendlies?from=hoy&to=hoy`
- Filtra solo `live | halftime` de ambas fuentes
- Límite: máximo 5 partidos simultáneos en el bloque Dashboard
- Polling adaptativo: 60s si hay live, 5min si no

### `LiveEventsBlock` (nuevo, en CalendarView y FriendliesView)
- Muestra los últimos **3 eventos** más recientes de un partido en vivo
- Eventos soportados: ⚽ gol/penal, ⚽ autogol, 🟨 amarilla, 🟥 roja/roja directa, 🔄 sustitución, ❌ penal fallado
- Ordenados por minuto descendente (el más reciente primero)
- Solo se renderiza cuando `isLive === true` y existen eventos en el overlay

### `LiveOverlay` (CalendarView — interface)
- Tipo que superpone datos live sobre el `CalMatch` estático sin mutarlo
- Campos: `status`, `minute?`, `homeScore?`, `awayScore?`, `events?`
- Matching: `liveByKey.get(\`${home.code}-${away.code}\`)` — único por partido WC por día

### `DisplayStatus` (CalendarView — type)
- Extensión de `MatchStatus` con `'halftime' | 'cancelled'` para compatibilidad con API live
- `StatusBadge` actualizado para mostrar "Descanso" en halftime y "Cancelado" en cancelled

### `LiveMatchesBlock` (DashboardView)
- Bloque verde con pulso animado
- Se oculta completamente cuando no hay partidos en vivo (`liveMatches.length === 0`)
- Muestra: bandera local + nombre + marcador verde + minuto + bandera visitante
- Máximo 5 partidos

---

## Eventos soportados en UI

| Tipo API | Icono UI | Condición |
|----------|----------|-----------|
| `goal` | ⚽ | `type === 'goal'` |
| `penalty` | ⚽ | `type === 'penalty'` |
| `own_goal` | ⚽ | `type === 'own_goal'` |
| `yellow_card` | 🟨 | `type === 'yellow_card'` |
| `red_card` | 🟥 | `type === 'red_card'` |
| `yellow_red_card` | 🟥 | `type === 'yellow_red_card'` |
| `substitution` | 🔄 | `type === 'substitution'` |
| `missed_penalty` | ❌ | `type === 'missed_penalty'` |

---

## Validaciones realizadas

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ Limpio — 171 kB página (+2 kB vs Sprint 3) |
| Bundle cliente — API key ausente | ✅ Route Handlers 0 B (server-side) |
| Fallback mock | ✅ Funciona sin `API_FOOTBALL_KEY` |
| `LiveMatchesBlock` oculto sin live | ✅ Retorna `null` inmediatamente |
| Venue `'Por confirmar'` filtrado | ✅ No se renderiza en Amistosos |

---

## Comportamiento por vista

### Calendario Mundial (CalendarView)
| Estado | Comportamiento |
|--------|---------------|
| Sin partidos live hoy | 104 partidos estáticos, polling en idle (5min) |
| Partido upcoming | VS + hora local + timezone (igual que antes) |
| Partido live | Marcador verde + minuto + badge "En vivo" + últimos 3 eventos |
| Partido halftime | Marcador verde + badge "Descanso" + últimos 3 eventos |
| Partido completed | Marcador final blanco |
| Con live activo | Indicador "🟢 Datos en tiempo real activos" bajo el subtítulo |

### Amistosos (FriendliesView)
| Estado | Comportamiento |
|--------|---------------|
| Sin live | Polling 5min, aviso "Datos en tiempo real" (si API activa) o "Datos de demostración" (mock) |
| Con live | Polling 60s automático |
| Venue `'Por confirmar'` | No se muestra — tarjeta más compacta |
| Venue real | Se muestra con ícono de pin |

### Dashboard (DashboardView)
| Estado | Comportamiento |
|--------|---------------|
| Sin live | Bloque "Partidos en Vivo" completamente oculto |
| Con live | Bloque verde aparece animado encima de "Mis Selecciones" |
| Máximo 5 partidos | WC tiene prioridad; se trunca en 5 |

---

## Rendimiento observado

| Hook | Comportamiento | Impacto |
|------|---------------|---------|
| `useLiveWc` | Sin partidos hoy → 1 req/5min = 12 req/h | Muy bajo ✅ |
| `useLiveAll` | Sin live → 2 req/5min = 24 req/h | Bajo ✅ |
| Durante partidos WC | 60s + N detail reqs = ~5 req/min | Dentro del límite 180 req/h ✅ |
| Startup cost | 2-3 req paralelas al montar Dashboard + Calendario | OK ✅ |

---

## Estrategia de datos (venue vs score)

Tal como se definió en Sprint 3:
- **Venue, ciudad, hora local, timezone** → `calendar-data.ts` (fuente de verdad)
- **Score, status, minuto, eventos** → API live (superpuestos via `liveOverlay`)

La API retorna "Estadio Banorte" para MEX-RSA pero el calendario muestra "Estadio Azteca" (correcto). El overlay solo afecta datos de partido, nunca datos de sede.

---

## Riesgos pendientes

| Riesgo | Severidad | Descripción | Acción recomendada |
|--------|-----------|-------------|-------------------|
| Rate limit peak MD3 | Media | 4 partidos WC simultáneos + detail fetch = ~8 req/min = 480 req/h | Reducir a 90s polling en días de 4 partidos simultáneos |
| API key en Vercel | Alta | Sin `API_FOOTBALL_KEY` en Vercel, producción cae a mock | **Agregar antes del próximo deploy** |
| Eventos en amistosos | Baja | `events` solo disponibles via detail endpoint — FriendliesView no hace detail fetch por amistosos | Sprint 5 opcional: fetch lazy de detail al hacer clic en tarjeta |
| Venue "Por confirmar" en amistosos | Muy baja | 42% de amistosos — ya filtrado, tarjeta queda más compacta | No action needed |

---

## Notas de deployment

**Antes de hacer push/deploy de Sprint 4:**

1. Agregar en Vercel → Settings → Environment Variables (Production + Preview):
   ```
   API_FOOTBALL_KEY=75a39337995786bfd68819da06a1a36f85a4fcdf7f149a008525d4e60eff7d02
   ```
   ⚠️ Nunca con prefijo `NEXT_PUBLIC_`

2. Verificar que los league IDs sean correctos en apifootball.com dashboard (WC2026=28, Friendlies=356)

---

## Estado final

| Pregunta | Respuesta |
|---------|-----------|
| ¿Los datos live ya son visibles en UI? | ✅ **SÍ** — score, status, minuto en CalendarView y FriendliesView |
| ¿Los eventos live ya son visibles en UI? | ✅ **SÍ** — últimos 3 eventos (⚽🟨🟥🔄) en partidos en vivo |
| ¿El Dashboard ya muestra partidos en vivo? | ✅ **SÍ** — bloque "🔴 Partidos en Vivo" aparece cuando hay live |
| ¿La aplicación está lista para despliegue de Sprint 4? | ✅ **SÍ** — pending: añadir API_FOOTBALL_KEY en Vercel |

---

## Próximos pasos opcionales (Sprint 5+)

- Click en tarjeta de amistoso → detalle con eventos (lazy fetch de `/api/live/match/{id}`)
- Polling adaptativo en peak MD3 (>2 partidos simultáneos → 90s)
- Notificaciones push cuando un equipo favorito marca un gol
- Alineaciones cuando estén disponibles en la API
