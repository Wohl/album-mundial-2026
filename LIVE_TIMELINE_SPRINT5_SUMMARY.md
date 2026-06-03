# Live Timeline — Sprint 5 Summary
**Fecha:** 2026-06-03  
**Estado:** ✅ Timeline expandible implementado — listo para producción

---

## Objetivo

Completar la experiencia Live con acceso al historial completo de eventos de cualquier partido, sin sobrecargar la interfaz ni agregar polling adicional.

---

## Archivos modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/LiveEventsBlock.tsx` | **Nuevo** | Componente compartido — renderiza timeline completo o compacto |
| `src/components/CalendarView.tsx` | Modificado | `LiveOverlay` + `apiId`; `MatchCard` stateful; expand integrado |
| `src/components/FriendliesView.tsx` | Modificado | `FriendlyMatchCard` stateful; expand con lazy fetch; sin `LiveEventsBlock` inline |

**Archivos protegidos — sin cambios:**  
Supabase / auth / RLS / RPCs / marketplace / trades / backups / restore / PDF / álbum / favoritos / quiniela / Dashboard / navegación principal → ✅ INTACTOS

---

## Componentes modificados

### `LiveEventsBlock` (nuevo — compartido)

- Recibe `events: LiveEvent[]` + `maxItems?: number`
- Sin `maxItems` → todos los eventos en orden cronológico ascendente
- Con `maxItems=3` → últimos 3 eventos (más recientes, orden ascendente)
- Columnas: ícono | minuto | jugador/descripción | código de equipo (badge)
- Para sustituciones: `playerIn ← playerOut`
- Accesibilidad: contenido solo-lectura, contraste adecuado

### `MatchCard` (CalendarView — ampliado)

**Estado añadido:**
```typescript
const [expanded, setExpanded] = useState(false)
const [cachedEvents, setCachedEvents] = useState<LiveEvent[] | null>(null)
const [loadingEvents, setLoadingEvents] = useState(false)
```

**Flujo de expand:**
1. Botón visible cuando `liveOverlay` existe y `status !== 'upcoming'`
2. Click → si no hay eventos en memoria, fetch de `/api/live/match/{apiId}`
3. Expande inmediatamente, muestra spinner mientras carga
4. Cuando llegan datos: muestra timeline completo
5. Click en "Ocultar" → colapsa, eventos permanecen en caché

**`LiveOverlay` actualizado:**
```typescript
interface LiveOverlay {
  apiId: string   // ← nuevo: ID numérico del fixture en apifootball.com
  status: LiveMatchStatus
  minute?: number
  homeScore?: number
  awayScore?: number
  events?: LiveEvent[]
}
```

### `FriendlyMatchCard` (FriendliesView — ampliado)

**Estado añadido:** `expanded`, `cachedEvents`, `loadingEvents`

**Lógica de expand:**
- `canToggleTimeline`: visible para `completed | live | halftime` (no para upcoming/postponed/cancelled)
- Sin eventos en memoria → `fetch('/api/live/match/${match.id}')` en click
- Con eventos en memoria → toggle inmediato sin llamada adicional
- Misma UX que `MatchCard`: spinner → timeline → "Ocultar"

---

## Eventos soportados (desde API)

| Tipo | Ícono | Descripción en UI |
|------|-------|-------------------|
| `goal` | ⚽ | Nombre del goleador |
| `penalty` | ⚽ | Nombre del ejecutante |
| `own_goal` | ⚽ | Nombre (autogol) |
| `yellow_card` | 🟨 | Nombre del amonestado |
| `red_card` | 🟥 | Nombre del expulsado |
| `yellow_red_card` | 🟥 | Nombre del expulsado |
| `substitution` | 🔄 | `playerIn ← playerOut` |
| `missed_penalty` | ❌ | Nombre del ejecutante |

---

## Comportamiento UI por estado

| Status | Compact (colapsado) | Expand button | Expanded |
|--------|---------------------|---------------|----------|
| `upcoming` | — | No | — |
| `live` | Últimos 3 (si existen) | Sí, `Ver todos (N)` | Timeline completo |
| `halftime` | Últimos 3 (si existen) | Sí, `Ver todos (N)` | Timeline completo |
| `completed` | Últimos 3 (si existen en caché) | Sí, `Ver eventos` | Timeline completo (fetch lazy) |
| `postponed` | — (Amistosos) | No | — |
| `cancelled` | — (Amistosos) | No | — |

---

## Accesibilidad

| Elemento | Implementación |
|----------|----------------|
| `aria-expanded` | `true` / `false` en el botón toggle |
| `aria-label` | Dinámico: "Ver todos los eventos (23)" / "Ocultar timeline de eventos" |
| `type="button"` | Evita submit accidental en formularios |
| `focus-visible:ring-2` | Anillo de foco visible para navegación por teclado |
| Navegación por teclado | Enter/Space activan el toggle (comportamiento nativo de button) |
| Contraste | Texto de eventos: `rgba(185,205,230,0.85)` sobre fondo oscuro |

---

## Rendimiento observado

### Llamadas adicionales

| Escenario | Llamadas adicionales |
|-----------|---------------------|
| Card colapsada (todos los status) | **0** |
| Expand — eventos ya en memoria (match live WC) | **0** |
| Expand — sin eventos en memoria (primer click) | **1** a `/api/live/match/{id}` |
| Expand — segundo click en el mismo partido | **0** (eventos cacheados en estado local) |
| Polling adicional | **0** — ningún timer adicional |

### Impacto en rate limit (apifootball.com 180 req/h)

- Cada user click en "Ver eventos" → 1 req
- No automático, no periódico
- En un match day típico con muchos usuarios: podría acumular reqs, pero son user-triggered
- Los eventos se cachean en el estado del componente → mismo usuario no paga doble

### Bundle

```
171 kB → 172 kB (+1 kB)  — Delta: LiveEventsBlock.tsx
Route Handlers: 0 B (sin cambios server-side)
```

---

## Validaciones realizadas

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ Limpio — 172 kB |
| Archivos protegidos | ✅ NINGUNO modificado |
| Timeline vacío | ✅ Muestra "Sin eventos registrados" |
| Timeline con 23 eventos (SCO vs CUW) | ✅ Lista cronológica completa |
| Fallback MockProvider | ✅ `setCachedEvents([])` en error → "Sin eventos registrados" |
| `aria-expanded` | ✅ Presente en ambos componentes |
| Focus ring visible | ✅ `focus-visible:ring-2 focus-visible:ring-sky-400/40` |
| Responsive (mobile/tablet/desktop) | ✅ `flex items-center` + `truncate` + `min-w-0` |
| Sin polling adicional | ✅ Solo fetch user-triggered, sin setInterval |

---

## Riesgos pendientes

| Riesgo | Severidad | Acción recomendada |
|--------|-----------|-------------------|
| Rate limit acumulado en MD1+ | Baja | Monitorear reqs/h en apifootball.com dashboard durante Jun 12 |
| Player names con acentos/unicode truncados en mobile | Muy baja | `truncate` CSS — nombres largos se cortan, acceptable |
| Eventos en WC completed (días anteriores) sin apiId | Baja | `canToggleTimeline` solo activa cuando hay `liveOverlay` → OK |
| `match.id` en amistosos futuros no numérico | Muy baja | La validación en `/api/live/match/[id]` retorna 400 → `setCachedEvents([])` |

---

## Recomendaciones para Sprint 6 (Quiniela)

### Estimación real

**8-12 horas** distribuidas:
- Schema Supabase (tabla `predictions` + RLS): 1-2h
- Lock de predicciones por kickoff: 1h
- UI de predicción por partido (formulario): 2-3h
- Scoring automático via polling existente: 1-2h
- LeaderBoard de quiniela: 1-2h
- Testing integrado: 1h

### Prerequisitos antes de Sprint 6

1. Definir reglas de scoring (3 pts resultado, 5 pts exacto, etc.)
2. Aprobar schema Supabase (nueva tabla, sin tocar las existentes)
3. Decidir si quiniela es por grupo, por jornada, o por torneo completo
4. Activar el tab "Quiniela" en la navegación principal (actualmente placeholder)

### Ventana óptima

**Jun 11 - Jun 12** (apertura del Mundial). Después del primer partido es tarde para los primeros 3 partidos.

---

## Estado final

| Pregunta | Respuesta |
|---------|-----------|
| ¿El timeline completo ya es visible? | ✅ **SÍ** — expand muestra todos los eventos en orden cronológico |
| ¿Usa datos reales de API-Football? | ✅ **SÍ** — fetch de `/api/live/match/{id}` con clave real |
| ¿No genera llamadas adicionales? | ✅ **SÍ** — 0 polling; 1 fetch solo en el primer click del usuario |
| ¿Está listo para producción? | ✅ **SÍ** — TypeScript 0 errores, build limpio, fallback funcional |
| ¿Estimación real para Sprint 6 (Quiniela)? | **8-12 horas** — requiere aprobación de schema Supabase |
