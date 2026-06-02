# CALENDAR_VISUAL_POLISH.md
**Fecha:** 2026-06-02 | **Scope:** Pulido visual del módulo Calendario + fix `daysUntil()`

---

## 1. Resumen

| Indicador | Resultado |
|-----------|-----------|
| Build producción | ✅ `✓ Compiled successfully` |
| TypeScript | ✅ 0 errores |
| Bundle size | 157 kB (sin cambio) |
| Archivos modificados | `src/components/CalendarView.tsx` (solo) |
| Backend / Supabase | ✅ Sin tocar |
| Fixtures / Navegación | ✅ Sin tocar |

---

## 2. Cambios Aplicados

### 2.1 `daysUntil()` — Fecha dinámica

**Antes:**
```typescript
const today = new Date(2026, 5, 2) // June 2 2026 — hardcodeado
```

**Después:**
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0) // normaliza a inicio del día local
```

**Impacto:** Los badges "en Xd" junto al venue de cada card ahora reflejan la diferencia real entre hoy y la fecha del partido. La lógica de rango se extendió de ≤14 días a **≤21 días** para mayor visibilidad.

---

### 2.2 Contraste — `text-surface4` eliminado de CalendarView

`surface4` en Tailwind es `#213255` (azul navy oscuro). Usado como texto sobre fondos navy genera un contraste ≈1.5:1 — esencialmente invisible. **Todos los usos de `text-surface4` en CalendarView fueron reemplazados** por colores inline explícitos.

| Elemento | Antes | Después |
|----------|-------|---------|
| "Jornada N" label en card | `text-surface4` → #213255 invis. | `rgba(163,181,211,0.50)` |
| "VS" center text | `text-surface4` | `rgba(163,181,211,0.35)` (sutil intencional) |
| Timezone (ET/CT/PT) | `text-surface4` | `rgba(163,181,211,0.45)` |
| Pin de ubicación (SVG stroke) | `text-surface4` class | `stroke="rgba(163,181,211,0.40)"` inline |
| Estadio + ciudad | `text-surface4` | `rgba(163,181,211,0.58)` |
| Separador "·" venue | `text-surface4 opacity-50` | `rgba(163,181,211,0.28)` |
| Match count header día | `text-surface4` | `rgba(163,181,211,0.45)` |
| Mes en date box | `text-gold/60` | `rgba(245,197,66,0.55)` |
| Subtítulo "FIFA World Cup" | `text-surface4` | `rgba(163,181,211,0.50)` |
| Leyenda Próximo/Finalizado | `text-surface4` | `rgba(163,181,211,0.60)` |
| Label "Grupo" filter | `text-surface4` | `rgba(163,181,211,0.40)` |
| Empty state título | `text-surface4` | `rgba(163,181,211,0.70)` |
| Empty state subtítulo | `text-surface4/60` | `rgba(163,181,211,0.38)` |
| Coming soon features list | `text-surface4` | `rgba(163,181,211,0.50)` |

---

### 2.3 StatusBadge — Colores legibles en todos los estados

| Estado | Antes | Después |
|--------|-------|---------|
| 🔵 Próximo | `text-sky-400/80` (Tailwind modif.) | `color: rgba(125,211,252,0.85)` inline |
| 🟢 En vivo | `text-green-400` (OK) | `color: #4ade80` — reforzado |
| ✅ Finalizado | `text-surface4` — invisible | `rgba(163,181,211,0.55)` — legible |
| 🟡 Aplazado | `text-amber-400/80` | `rgba(251,191,36,0.80)` — más vivo |
| Todos | Mixto de clases/inline | 100% inline para consistencia cross-browser |

---

### 2.4 MatchCard — Diferenciación visual por importancia de fase

#### Borde del card según fase:
| Fase | Borde |
|------|-------|
| Final | `rgba(245,197,66,0.45)` — gold prominente |
| 3er Lugar | `rgba(180,150,60,0.32)` — bronze sutil |
| SF / R16 / QF / R32 (TBD) | `rgba(42,60,90,0.35)` — dimmer |
| Grupo con equipos conocidos | `rgba(52,72,110,0.65)` — estándar |

#### Stripe dorada superior:
| Fase | Antes | Después |
|------|-------|---------|
| Final | ✅ Stripe delgada 0.85 opacidad | ✅ Stripe más brillante 0.9 opacidad |
| 3er Lugar | ❌ Sin stripe | ✅ Stripe gold 0.45 opacidad |
| Semifinales | ✅ Stripe presente | ✅ Stripe gold 0.45 opacidad |

#### Fondo card Final:
- Antes: igual que todas las cards
- Después: `rgba(22,33,55,0.98)` → ligeramente más azulado para diferenciarlo

#### Box shadow Final:
- Después: `0 4px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,197,66,0.07)` — separador gold sutilísimo

#### Separador venue:
- Final: `rgba(245,197,66,0.12)` — toque dorado
- Resto: `rgba(42,60,90,0.32)` — estándar

---

### 2.5 Centro del card — Hora y VS más legibles

| Elemento | Antes | Después |
|----------|-------|---------|
| "VS" | `text-surface4` → invisible | `rgba(163,181,211,0.35)` → visible sutil |
| Hora (ej. "20:00") | `text-humo/80` → depende de Tailwind | `color: #CBD5E1` → sólido, legible |
| Timezone (ET/CT) | `text-surface4` | `rgba(163,181,211,0.45)` + `tracking-widest uppercase` |
| Contenedor central | `shrink-0 px-2` | `shrink-0 px-3 min-w-[52px]` — evita colapso |

---

### 2.6 Filtro de fases — Hover states

Los botones de fase inactivos ahora responden al hover:

```
Inactivo:  bg rgba(14,24,44,0.7)  · color rgba(163,181,211,0.7)  · border rgba(42,60,90,0.45)
Hover:     bg rgba(20,34,58,0.9)  · color #E5E7EB               · border rgba(245,197,66,0.25)
Activo:    bg gold gradient       · color #0B1624               · shadow gold
```

También añadido:
- Icono ⭐ en tab "Final"
- Emoji 🥉 en tab "3er Lugar" para identificación rápida

---

### 2.7 Filtro de grupos — Hover states + refactor

El filter de grupos fue refactorizado: los botones "Todos" y "A–L" ahora se generan en un único `.map()` en lugar de dos bloques separados.

```
Inactivo:  bg rgba(12,22,42,0.6)   · color rgba(163,181,211,0.62) · border rgba(42,60,90,0.38)
Hover:     bg rgba(18,30,52,0.85)  · color #E5E7EB               · border rgba(245,197,66,0.20)
Activo:    bg rgba(245,197,66,0.12)· color #F5C542               · border rgba(245,197,66,0.35)
```

---

### 2.8 TeamBlock — maxWidth ampliado

- Antes: `maxWidth: '80px'` — trunca "Estados Unidos" y otros nombres largos
- Después: `maxWidth: '100px'` — nombres de hasta ~16 chars caben cómodamente
- Añadido `leading-snug` en lugar de `leading-tight` para mejor multiline

---

### 2.9 Date header — Fecha con `truncate`

El texto de la fecha larga (`miércoles, 11 de junio`) ahora tiene `truncate` para evitar overflow en pantallas estrechas. El contenedor también tiene `min-w-0` para que funcione correctamente en flex.

---

### 2.10 Empty state — Legibilidad mejorada

- Título: `rgba(163,181,211,0.70)` (era `text-surface4` invisible)
- Subtítulo: `rgba(163,181,211,0.38)` (era `text-surface4/60` invisible)
- SVG del calendario: stroke levemente más sutil

---

## 3. Checklist Manual Sugerido

> Pasos para validar visualmente en navegador. Usa DevTools para simular distintos anchos.

### Desktop (1280px+)

- [ ] **Calendario carga** con 72 partidos visibles al entrar (filtro "Grupos" activo)
- [ ] **Subtitle** "FIFA World Cup 2026 · 104 partidos" legible en gray muted
- [ ] **Leyenda** Próximo/En vivo/Finalizado: tres puntos de color + labels legibles
- [ ] **Tab "Grupos"** activo en dorado desde inicio
- [ ] **Tabs inactivos** muestran hover (borde dorado sutil + texto más brillante)
- [ ] **Tab "Final"** muestra estrella ⭐ + texto "Final"
- [ ] **Tab "3er Lugar"** muestra 🥉 + texto "3er Lugar"
- [ ] **Filtro grupo "A–L"** aparece animado al estar en fase Grupos
- [ ] **Filtro grupo hover** cambia color (gold outline + texto más claro)
- [ ] **Grupo "Todos"** activo por defecto, dorado
- [ ] **Filtrar Grupo A** → solo 6 partidos (jornadas 1, 2, 3)
- [ ] **Cards grupo**: badge "Grupo A" dorado + "Jornada N" en gris legible
- [ ] **Nombre equipo** en card: texto blanco claro, maxWidth 100px (sin corte en "Estados Unidos")
- [ ] **Hora y timezone** (ej. "20:00 CT") visibles y legibles
- [ ] **"VS"** center: texto muy sutil pero visible
- [ ] **StatusBadge "Próximo"** borde cyan, texto cyan
- [ ] **Venue** (estadio + ciudad) visible en gris muted
- [ ] **Badge "en Xd"** visible en partidos dentro de 21 días
- [ ] **Cambiar a "Semis"** → 2 cards, stripe gold sutil en ambas
- [ ] **Cambiar a "3er Lugar"** → 1 card (Jul 25, Hard Rock Stadium Miami), stripe gold media
- [ ] **Cambiar a "Final"** → 1 card, borde dorado, stripe brillante, fondo ligeramente diferente
- [ ] **Date header** muestra día del mes grande dorado + nombre del día legible
- [ ] **Banner "Próximas funcionalidades"** visible pero discreto al fondo
- [ ] **Ronda 32** → 16 partidos, TBD muestra "?" muy tenue, sin crash

### Mobile (375px)

- [ ] **Header** "Calendario" y subtitle legibles sin overflow
- [ ] **Phase filter** scrollable horizontalmente, tabs con padding correcto
- [ ] **Grupo filter** scrollable, 13 botones (Todos + A–L) sin wrapping
- [ ] **Cards en 1 columna** (no grid 2col en mobile)
- [ ] **TeamBlock** nombre no se corta (maxWidth 100px con wrap natural)
- [ ] **Card Final** — borde dorado visible en mobile
- [ ] **Badge "en Xd"** — aparece para partidos del 11–25 jun
- [ ] **Date header truncate** — fechas largas no causan overflow

### Responsive medio (768px — breakpoint md)

- [ ] **Grid pasa de 1 a 2 columnas** al cruzar breakpoint `md`
- [ ] **2 cards por fila** en días con varios partidos

---

## 4. Validación de Build

```
$ npx tsc --noEmit      → 0 errores  ✅
$ npx next build        → ✓ Compiled successfully  ✅

Route (app)
┌ ○ /           157 kB   245 kB First Load JS
```

El bundle aumentó 1 kB respecto a la implementación inicial (244→245 kB First Load), por la lógica adicional de hover handlers y variables de fase. Dentro de rangos normales.

---

## 5. Sin Cambios En

| Módulo | Estado |
|--------|--------|
| Fixtures de partidos (104 matches) | ✅ Sin tocar |
| Tipos `Phase`, `CalMatch`, `GroupLetter` | ✅ Sin tocar |
| Navegación principal (`page.tsx`) | ✅ Sin tocar |
| Álbum, Mercado, Dashboard | ✅ Sin tocar |
| Supabase, RLS, RPCs | ✅ Sin tocar |
| Backup/Restore, Exportaciones PDF | ✅ Sin tocar |

---

## 6. Recomendaciones Futuras (No Implementadas Aquí)

| Mejora | Complejidad | Prioridad |
|--------|------------|-----------|
| Integrar `new Date()` para cambiar status automáticamente (upcoming→completed) basado en fecha real | Media | Alta — cuando se active el torneo |
| Skeleton loaders para las cards (en lugar de fade-in puro) | Baja | Baja |
| Accordion por mes para grupos con muchos días | Media | Baja |
| Persistir filtro de fase/grupo en URL (`?phase=group&group=A`) | Media | Media |
| Accessibility: `role="tablist"`, `aria-selected`, `aria-controls` en filtros | Baja | Media |
