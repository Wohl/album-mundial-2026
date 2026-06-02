# FOGUEOS_REVIEW.md
**Tipo:** Auditoría visual y funcional | **Método:** revisión de código estática
**Commit auditado:** `3dd5176` | **Fecha:** 2026-06-02

---

## 1. Capturas esperadas

### Tab "Mundial 2026" (activo por defecto)

```
┌─────────────────────────────────────────────────┐
│  [🏆 MUNDIAL 2026 ▌]  [ ⚽ FOGUEOS ]            │  ← nav tabs
│                                                  │
│  ┌──── COUNTDOWN HERO ───────────────────────┐   │
│  │ FIFA World Cup      [globe]               │   │
│  │ MUNDIAL 2026                              │   │
│  │ 11 Jun – 19 Jul · USA · CAN · MEX         │   │
│  │  [ 08 ] : [ 14 ] : [ 23 ] : [ 47 ]       │   │
│  │  DÍAS     HORAS     MIN      SEG           │   │
│  │          [ Ver partidos ↓ ]               │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┄┄┄┄┄┄ PARTIDOS ┄┄┄┄┄┄                         │
│  Calendario 2026                                 │
│  [104 partidos] · 16 sedes · 3 países            │
│                                                  │
│  [search box]                                    │
│  [Grupos] [Ronda 32] [Octavos] [Cuartos]...      │
│  [A] [B] [C] ... [L]                            │
│                                                  │
│  [match grid ...]                                │
└─────────────────────────────────────────────────┘
```

### Tab "Fogueos" (click → switch)

```
┌─────────────────────────────────────────────────┐
│  [ 🏆 MUNDIAL 2026 ]  [⚽ FOGUEOS ▌]            │  ← fogueos activo (dorado)
│                                                  │
│  Fogueos Internacionales                         │  ← header celeste
│  Preparación para el Mundial 2026               │
│  [Próximo ●] [En vivo ●] [Final ●]              │  ← leyenda
│                                                  │
│  [PRÓXIMOS 15▌] [RECIENTES 15] [TODOS]          │  ← filtros con count
│                                                  │
│  [search box]                                    │
│                                                  │
│  ┌── 3 jun ────────────────────────────────┐    │
│  │ [Amistoso]              [Próximo]       │    │
│  │  🇫🇷 Francia    VS    🇳🇴 Noruega         │    │
│  │               20:45  CET               │    │
│  │  📍 Stade de France · Saint-Denis      │    │
│  └─────────────────────────────────────────┘    │
│  ... (más partidos agrupados por fecha)          │
│                                                  │
│  [⚠ Datos de demostración]                      │
└─────────────────────────────────────────────────┘
```

### Partido completado (Recientes)

```
┌─────────────────────────────────────────────────┐
│  [Amistoso]                     [Finalizado]    │
│                                                  │
│  🇨🇦 Canadá       2 – 1       🇵🇾 Paraguay       │  ← BUG: score aparece
│     1 (dorado)                0 (dorado)        │  ← 3 veces (ver §7)
│                                                  │
│  📍 BMO Field · Toronto                         │
└─────────────────────────────────────────────────┘
```

---

## 2. Flujo de navegación

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Usuario abre pestaña "Calendario" | `CalendarView` carga; tab "Mundial 2026" activo (dorado) |
| 2 | Hace click en "⚽ Fogueos" | Tab Fogueos se activa (dorado); CountdownHero y WC calendar desaparecen |
| 3 | FriendliesView carga | `loading=true` → 6 skeleton cards pulsando; `loading=false` → 15 partidos próximos |
| 4 | Click en "Recientes" | Grid cambia a 15 partidos completados (más reciente primero) |
| 5 | Click en "Todos" | 30 partidos en orden cronológico ascendente |
| 6 | Busca "Argentina" | Muestra partidos donde home.name o away.name incluye "Argentina" (2 partidos) |
| 7 | Click en "⚽" de búsqueda para limpiar | Vuelve a los 30 partidos del tab activo |
| 8 | Click en "🏆 Mundial 2026" | CountdownHero reaparece; estado de Fogueos NO persiste (filterTab vuelve a `upcoming`) |

**Nota de regresión:** El tab "Mundial 2026" no fue modificado — el calendario de 104 partidos, fases y grupos siguen funcionando exactamente igual.

---

## 3. Cantidad de partidos cargados

| Categoría | Cantidad | Rango de fechas |
|-----------|----------|----------------|
| Completados | 15 | 2026-05-05 → 2026-05-30 |
| Próximos | 15 | 2026-06-03 → 2026-06-10 |
| **Total** | **30** | mayo–junio 2026 |

Verificado en `mock-provider.ts`: 15 objetos con `status: 'completed'`, 15 con `status: 'upcoming'`.

Todas las selecciones usan códigos FIFA incluidos en `teamFlags.ts` — todas las banderas renderizarán correctamente sin necesidad de modificar ese archivo.

---

## 4. Filtros disponibles

| Filtro | Función | Estado |
|--------|---------|--------|
| **Próximos** | `status: 'upcoming' \| 'live' \| 'halftime'` — orden cronológico asc | ✅ Funcional; muestra 15 partidos por defecto |
| **Recientes** | `status: 'completed' \| 'postponed'` — orden desc (más reciente primero) | ✅ Funcional; muestra 15 partidos completados |
| **Todos** | Sin filtro de status — orden cronológico asc | ✅ Funcional; muestra los 30 |
| **Búsqueda** | Filtra sobre el tab activo por nombre, código, estadio, ciudad, país | ✅ Funcional en todos los tabs |

**Comportamiento de búsqueda:** La búsqueda se aplica *encima* del filtro de tab activo. Si estás en "Próximos" y buscas "España", solo busca entre los partidos próximos de España. Correcto y esperado.

---

## 5. Comportamiento responsive

### Mobile (≤480px)
- Las cards se apilan en **1 columna** (`grid-cols-1`) — correcto
- El header "Fogueos Internacionales" usa `clamp(22px, 3.5vw, 30px)` — se achica apropiadamente
- Los filter tabs ("Próximos", "Recientes", "Todos") están en `flex overflow-x-auto` — pueden hacer scroll horizontal si no caben
- La leyenda de estado (Próximo / En vivo / Final) en el header usa `flex-wrap` — se apila en 2 líneas en mobile
- **Riesgo detectado**: Los 3 filter tabs + contadores en mobile (≤320px) podrían requerir scroll horizontal para ver "Todos". Aceptable con `overflow-x-auto scrollbar-none`.

### Tablet (640px–1199px)
- Sigue en **1 columna** (no hay breakpoint de 2 columnas hasta `xl2`)
- Se ve más espaciado de lo ideal — las cards son anchas con mucho whitespace a los lados
- **Oportunidad de mejora**: agregar `md:grid-cols-2` o `lg:grid-cols-2` para tablets medianas

### Desktop (≥1280px)
- Grid pasa a 2 columnas en `xl2` (custom breakpoint ≥1600px) y 3 en `3xl` (≥1920px)
- En 1280–1599px: sigue siendo **1 columna** — las cards quedan muy anchas
- **Oportunidad de mejora**: el mismo gap que el Calendario WC — agregar `xl:grid-cols-2` para ≥1280px

---

## 6. Diferencias visuales respecto al Calendario Mundial

| Elemento | Mundial 2026 | Fogueos Internacionales |
|----------|-------------|------------------------|
| **Color acento** | Dorado `#F5C542` | Celeste `rgba(125,211,252)` |
| **Title gradient** | Dorado→ `#FFD700` | Celeste → `rgba(56,189,248)` |
| **Date header block** | Fondo dorado tenue `rgba(245,197,66,0.07)` | Fondo celeste tenue `rgba(56,189,248,0.07)` |
| **Línea separadora date** | Celeste (sin cambio) | Celeste |
| **Badge competición en card** | `GRUPO X` / `FASE` (dorado) | `AMISTOSO` (celeste) |
| **Hero / countdown** | Presente (CountdownHero) | Ausente |
| **Filtros de fase** | 7 fases (Grupos, R32, Octavos...) | 3 tabs (Próximos, Recientes, Todos) |
| **Filtros de grupo** | A–L | No aplica |
| **Sub-sección divider** | `┄ PARTIDOS ┄` en dorado | No hay divider (FriendliesView empieza directo con el header) |
| **Aviso inferior** | "Próximas funcionalidades" (celeste) | "Datos de demostración" (dorado tenue) |
| **Espaciado interno** | `space-y-5` | `space-y-4` (4px menos) |

**Juicio de coherencia**: La diferenciación celeste/dorado es clara y funciona bien. El usuario sabe visualmente en qué sección está. No hay confusión entre ambas vistas.

---

## 7. Bugs detectados

### Bug 1 — Triple display del marcador en partidos completados ⚠️ CRÍTICO
**Severidad:** Alta visual / Baja funcional

En `FriendlyMatchCard`, para partidos `completed`:
- **TeamBlock izquierdo** muestra el score del local en dorado grande (ej. `2`)
- **Centro** muestra `home.score – away.score` en gris (`2 – 1`)
- **TeamBlock derecho** muestra el score del visitante en dorado grande (ej. `1`)

Resultado: el marcador "2 – 1" aparece **3 veces** en la misma card. Visualmente muy redundante y confuso.

**Causa raíz:** `TeamBlock` tiene `const isLiveOrDone = status !== 'upcoming'`, que incluye `completed`. Debería mostrar scores individuales solo para partidos en `live`/`halftime`, no para `completed`.

**Fix:** En `TeamBlock`, cambiar `isLiveOrDone` a `isLive` (`status === 'live' || status === 'halftime'`).

---

### Bug 2 — Centro vacío para status `postponed`/`cancelled`
**Severidad:** Baja (no visible en mock data actual)

El bloque central de `FriendlyMatchCard` tiene tres condiciones:
- `status === 'upcoming'` → VS + hora
- `isLive` → marcador verde
- `isCompleted` → marcador gris

Para `postponed` o `cancelled`, **ninguna condición es verdadera** → el centro queda en blanco, creando un layout roto.

**Fix:** Agregar fallback `(status === 'postponed' || status === 'cancelled') → VS sin hora`.

---

### Bug 3 — Contadores de filtro no reflejan búsqueda activa
**Severidad:** Media UX

Los badges numéricos en los tabs "Próximos 15" / "Recientes 15" se calculan desde `matches` (total), no desde el resultado de búsqueda. Si el usuario busca "Francia" con el tab "Próximos" activo y ve "2 partidos" en el grid, el badge del tab aún muestra "15" — contradictorio.

**Fix:** Ocultar los count badges cuando `searchQuery.trim().length > 0`.

---

### Bug 4 — ARIA faltante en section nav (CalendarView)
**Severidad:** Baja funcional / Media accesibilidad

Los botones "🏆 Mundial 2026" y "⚽ Fogueos" en CalendarView no tienen `role="tab"`, `aria-selected`, ni el wrapper `role="tablist"`. Los screen readers no anuncian el estado del tab activo.

**Fix:** Añadir `role="tablist"` al wrapper y `role="tab"` + `aria-selected={isActive}` a cada botón.

---

## 8. Posibles problemas UX detectados

### UX-1: Estado de Fogueos no persiste al cambiar de tab
Al cambiar de "⚽ Fogueos" → "🏆 Mundial 2026" → volver a "⚽ Fogueos", el componente `FriendliesView` se **desmonta y remonta** (React destroy/recreate). El filtro seleccionado y el texto de búsqueda se pierden. El usuario vuelve a ver "Próximos" vacío.

**Impacto:** Moderado. Molesto si el usuario alterna entre tabs frecuentemente.
**Solución recomendada:** Levantar `filterTab` y `searchQuery` al componente `CalendarView` y pasarlos como props.
**Decisión:** Se documenta pero no se aplica en esta sesión (requiere refactor moderado).

### UX-2: Tab "Todos" muestra partidos pasados antes de futuros
Con `filterTab === 'all'`, el sort es `a.date.localeCompare(b.date)` — cronológico ascendente. Esto muestra primero los partidos de mayo (ya jugados) y al final los de junio (próximos). Contra-intuitivo: el usuario esperaría ver primero lo próximo.

**Solución:** Para tab "Todos", sort debería ser: upcoming primero (asc), completed después (desc). Requiere un sort en dos pasadas.
**Decisión:** Documentado como mejora post-producción.

### UX-3: Grid de 1 columna en tablet y desktop estándar
En viewports 640px–1599px, el grid de Fogueos es de 1 columna (igual que mobile). Las cards quedan muy anchas (especialmente en 1280px). El Calendario WC tiene el mismo comportamiento (`xl2:grid-cols-2`), pero allí el CountdownHero ocupa el espacio visual superior.

En Fogueos el header es más compacto, dejando más cards visibles a la vez — la 1 columna se nota más.

**Solución:** Añadir `lg:grid-cols-2` para 1024px+.
**Decisión:** Se aplica como mejora de bajo riesgo (ver §9).

### UX-4: Sin animación de transición entre tabs
El switch Mundial ↔ Fogueos es instantáneo (sin `AnimatePresence`). El CalendarView WC usa `AnimatePresence` para los sub-filtros de fase, pero no para el tab principal. Consistencia incompleta.

**Decisión:** No se aplica — agregar `AnimatePresence` al nivel de tabs implicaría lógica de key y podría introducir glitches de scroll position.

---

## 9. Mejoras aplicadas en esta sesión

| # | Mejora | Archivo | Impacto |
|---|--------|---------|---------|
| M1 | **Fix triple score**: `TeamBlock` solo muestra score individual en `live`/`halftime` | `FriendliesView.tsx` | Alta visual |
| M2 | **Fix center vacío**: añadir fallback `VS` para `postponed`/`cancelled` | `FriendliesView.tsx` | Baja (no visible en mock) |
| M3 | **Fix count badge**: ocultar contadores durante búsqueda activa | `FriendliesView.tsx` | Media UX |
| M4 | **ARIA tabs**: `role="tablist"` + `role="tab"` + `aria-selected` en section nav | `CalendarView.tsx` | Accesibilidad |
| M5 | **Grid breakpoint**: `lg:grid-cols-2` para ≥1024px | `FriendliesView.tsx` | Media visual |

---

## 10. Verificación de datos

| Verificación | Estado |
|-------------|--------|
| Todos los códigos de equipo en `teamFlags.ts` | ✅ 30/30 verificados |
| Ningún partido duplicado en mock data | ✅ IDs únicos |
| Partidos completados tienen scores definidos | ✅ 15/15 |
| Partidos próximos sin scores | ✅ 15/15 (sin campo `score`) |
| Rangos de fecha correctos (mayo/junio 2026) | ✅ |
| `getAllFriendlies()` retorna los 30 (window ±60 días) | ✅ |
| `getUpcomingFriendlies()` retorna 15 (Jun 3–10) | ✅ |
| `getRecentFriendlies()` retorna 15 (May 5–30) | ✅ |

---

*Auditoría por revisión de código estática — sin acceso a browser para capturas reales. Las fixes se aplican en el commit posterior a este documento.*
