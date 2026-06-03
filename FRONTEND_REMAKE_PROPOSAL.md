# FRONTEND_REMAKE_PROPOSAL.md — Album Mundial 2026
**Auditoría:** 2026-06-02 | **Commit base:** `5c65141` | **Autor:** Claude Sonnet 4.6

> Este documento es un análisis y propuesta. No se implementa ningún código hasta decisión confirmada.

---

## PARTE 1 — AUDITORÍA VISUAL ACTUAL

### 1.1 Arquitectura Visual

El frontend actual es una **Single Page Application (SPA)** implementada sobre Next.js 14 App Router. Toda la lógica de UI, estado y routing vive en `src/app/page.tsx` (~820 líneas), un componente monolítico que gestiona:

- Auth state + modales de autenticación
- 4 custom hooks: `useAuth`, `useStickers`, `useTrades`, `usePacks`
- Navegación de 2 niveles (5 secciones principales + 6 sub-tabs de Álbum)
- Renderizado condicional de 12+ secciones de contenido

**Consecuencia:** Cualquier cambio en la navegación o secciones principales toca el mismo archivo grande, dificultando el mantenimiento paralelo.

---

### 1.2 Design System Actual

#### Tokens de color (tailwind.config.js)
```
dark     #081120  ← background principal
surface  #0F172A  ← layer 1
surface2 #132030  ← layer 2
surface3 #1A2840  ← layer 3
surface4 #213255  ← layer 4 (⚠ usado como texto, contraste 1.5:1)
gold     #F5C542  ← acento premium
gold2    #FFD700  ← dorado puro
humo     #F3F4F6  ← texto principal
verde    #0E5A36  ← verde césped
```

**Problema detectado:** `surface4 (#213255)` se usa como color de texto sobre fondos oscuros con contraste 1.45:1 — muy por debajo del mínimo WCAG 3:1 para texto de interfaz. La mayoría fue corregida con inline styles en sesiones anteriores, pero el token sigue siendo ambiguo.

#### Tipografía
- **Bebas Neue** → `font-display` — headers, tabs, números grandes
- **Barlow** → `font-body` — texto general
- Carga actual: Google Fonts CDN en `<head>` (no usa `next/font` optimization)
- **Problema:** FOUT (Flash of Unstyled Text) posible en primera carga

#### Gradientes y efectos
- Background: foto de estadio + overlay oscuro con `background-attachment: fixed`
- Glassmorphism: `backdrop-filter: blur(20-28px) saturate(180-200%)`
- Gold gradient: `linear-gradient(135deg, #F5C542, #FFD700, #FFF5CC)`
- Header: línea dorada + sombra multi-capa
- Cards: dark glass + border sutil + box-shadow

#### Sistema de colores de estado (stickers)
```
🔘 Missing   → gris/surface, opacity baja
🟢 Owned     → verde (#4ade80, rgba(34,197,94))
🟡 Repeated  → ámbar (#fbbf24, rgba(245,158,11))
🥇 Foil      → gold + holo shimmer
🟣 Legendary → purple (#d946ef + holo-wrapper)
```

Este sistema es **consistente y bien implementado** — se replica en StickerCard, TradeCard, StickerGallery y StickerRow.

---

### 1.3 Catálogo de Componentes

| Componente | Tipo | Estado visual | Reutilizable |
|------------|------|---------------|--------------|
| `StickerCard` | Complejo | Muy bueno — 3D tilt, foil, rarity | ✅ Alta |
| `StickerGallery` | Container | Bueno — filtros, search | ✅ Media |
| `TeamOverview` | Grid | Bueno — grupos FIFA, progress | ✅ Media |
| `ProgressBar` | Hero | Recientemente mejorado | ✅ Buena |
| `CalendarView` | Modular | Bueno — Phase 2 completo | ✅ Alta |
| `MarketplaceView` | Complejo | Funcional, denso visualmente | ⚠ Acoplado |
| `DashboardView` | Analítico | Logros/achievements, counters | ✅ Media |
| `StatsPanel` | Datos | Sencillo, cards de datos | ✅ Alta |
| `TradeCard` | Card | Status-coded, completo | ✅ Alta |
| `AuthModal` | Modal | Funcional | ✅ |
| `ProfileModal` | Modal | Funcional | ✅ |
| `BulkEntryModal` | Modal | Funcional | ✅ |
| `ExportModal` | Modal | Funcional, jsPDF | ✅ |
| `NotificationsPanel` | Panel lateral | Funcional | ✅ |
| `StickerSearch` | Modal search | Bueno — Ctrl+K | ✅ |

---

### 1.4 Navegación Actual

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER: [🏆 Álbum · Mundial 2026]  [Buscar][+Rápido][Exportar][🔔][👤][→]│
├──────────────────────────────────────────────────────────────────┤
│ MAIN NAV: [Álbum★] [Calendario] [⏱Quiniela·Pronto] [Mercado] [Dashboard] │
├──────────────────────────────────────────────────────────────────┤
│ SUB-NAV (solo Álbum): Sección: [Intro][Equipos][Final][CC][Extras][Stats]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CONTENT AREA                                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Evaluación:** Funcional y clara. La jerarquía de 2 niveles es inteligente. El problema es que en mobile los 5 tabs del main-nav requieren scroll horizontal. En desktop se ve compacto pero correcto.

---

### 1.5 Estado Responsive

| Breakpoint | Estado actual |
|------------|---------------|
| 375px mobile | Funcional. Nav hace scroll horiz. StickerCard adapta. |
| 768px tablet | Sin breakpoint propio. Mobile y desktop comparten layout |
| 1024px laptop | 2-col calendario (desde xl2=1200px). OK |
| 1280px desktop | Main use case. Se ve bien |
| 1600px ultra | 3-col calendario activo. OK |

**Gap detectado:** No hay un layout de tablet verdadero (768px-1199px). La experiencia en iPad o laptop pequeño se parece demasiado al mobile.

---

### 1.6 Deuda Técnica Visual

| Deuda | Impacto | Urgencia |
|-------|---------|----------|
| `page.tsx` monolítico ~820 líneas | Mantenimiento difícil | Media |
| Google Fonts en `<head>` (sin `next/font`) | FOUT, no preload | Baja |
| Mezcla inline styles + Tailwind | Inconsistencia, difícil de tematizar | Media |
| Sin tokens centralizados (design tokens file) | No se puede cambiar tema globalmente | Alta para opciones 2/3 |
| `surface4` ambiguo como texto/background | Accesibilidad | Resuelta parcialmente |
| Sin skeleton loaders — solo spinners | UX en carga | Baja |
| StickerCard: `onMouseMove` 3D en mobile | Posible jank en mobile low-end | Baja |
| Sin light mode | Limitación de audience | Media para opciones 2/3 |
| Sin `role="tablist"`/`aria-selected` | Accesibilidad | Media |

---

## PARTE 2 — TRES OPCIONES DE EVOLUCIÓN

---

## OPCIÓN 1: EVOLUTION
**"Mejora conservadora — el mismo álbum, más pulido"**

### Filosofía
Mantener el 95% del código actual. Iterar sobre el diseño existente mejorando contraste, spacing, consistencia y micro-detalles visuales. Sin nuevas arquitecturas, sin cambio de paleta, sin rediseño de flujos.

### Navigation Mockup
```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER: [🏆 ÁLBUM 2026]       [🔍 Buscar ⌘K] [+ Rápido] [📄 PDF] [🔔] [👤→]│
│         thin gold accent line                                    │
├──────────────────────────────────────────────────────────────────┤
│  [▣ Álbum]  [📅 Calendario]  [⏱ Quiniela]  [⇄ Mercado]  [◉ Dashboard] │
│   ★active                       · · Pronto                              │
├──────────────────────────────────────────────────────────────────┤
│  Sección →  Intro · Equipos · Final · Coca-Cola · Extras · Stats │
├──────────────────────────────────────────────────────────────────┤
│  [Hero ProgressBar: 934/994 ── 93.9%]                            │
│                                                                  │
│  ╔══════════╗ ╔══════════╗ ╔══════════╗ ╔══════════╗           │
│  ║ StickerCard ║ StickerCard ║ StickerCard ║ StickerCard ║      │
│  ╚══════════╝ ╚══════════╝ ╚══════════╝ ╚══════════╝           │
└──────────────────────────────────────────────────────────────────┘
```

### Cambios Concretos
1. **Design tokens file** (`src/lib/theme.ts`) — centralizar colores e inline styles
2. **Migrar Google Fonts** → `next/font` para eliminar FOUT
3. **Tablet breakpoint** (768px-1199px) — layout intermedio para iPad
4. **Skeleton loaders** en StickerGallery y Dashboard
5. **Unificar approach hover** — inline styles + Framer Motion `whileHover` unificados
6. **Accessibility básico** — `role="tablist"`, `aria-selected`, focus rings visibles
7. **StickerCard mobile** — desactivar 3D tilt en dispositivos touch
8. **ProgressBar** — ya mejorado; afinar animación inicial
9. **Marketplace layout** — aligerar densidad, más breathing room
10. **CalendarView** — ya optimizado (Phase 2.5)

### Componentes Afectados
`ProgressBar`, `StickerCard` (touch fix), `StickerGallery`, `MarketplaceView` (layout), `page.tsx` (tokens), `globals.css` (font import)

### Evaluación

| Criterio | Valoración |
|----------|-----------|
| **Riesgo** | 🟢 Muy Bajo — cambios incrementales sin reestructurar |
| **Tiempo estimado** | 1 semana (5-7 días trabajo) |
| **Regresiones probables** | Mínimas — nada se reescribe |
| **Impacto UX** | Medio — mejoras notables en detalles |
| **Dark mode** | ✅ Ya existe, se mantiene y mejora |
| **Light mode** | ❌ No se implementa |
| **Compatibilidad Live Data** | ✅ Total |
| **Cambio en bundle** | +0-5 kB |

### Adecuado para
Equipos que necesitan estabilidad, releases frecuentes de funcionalidades (Live Data, Quiniela), y no pueden asumir el riesgo de un rediseño mayor mientras el Mundial está en curso.

---

## OPCIÓN 2: MODERN PREMIUM
**"Identidad preservada, experiencia elevada"**

### Filosofía
Mantener la paleta dorado/navy y la identidad mundialista, pero elevar cada componente al siguiente nivel visual. Layout más editorial, tipografía más audaz, jerarquía más clara, sistema de componentes coherente. Introduce un sistema de diseño real y la opción de tema claro.

### Navigation Mockup — Desktop
```
╔════════════════════════════════════════════════════════════════════╗
║  🏆 ÁLBUM                            [🔍] [+] [PDF] [🔔2] [JP▾] ║
║  MUNDIAL 2026                                                      ║
╠══════╦═══════════╦════════════╦══════════╦═══════════╦════════════╣
║ ÁLBUM║ CALENDARIO║  QUINIELA  ║  MERCADO ║ DASHBOARD ║            ║
║  ────╟───────────╟────────────╟──────────╟───────────╟            ║
║  ▼   ║           ║ · · Pronto ║  [🔴 2]  ║           ║            ║
╠══════╩═══════════╩════════════╩══════════╩═══════════╣            ║
║  › Intro  › Equipos  › Final  › Coca-Cola  › Extras  › Stats     ║
╠═════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌──────────── COLECCIÓN ────────────┐  Resumen rápido            ║
║  │  934     de 994 figuritas         │  ● 93.9%                   ║
║  │  █████████████████████░   93.9%  │  ● 12 repetidas            ║
║  │  Tengo: 934  │ Extras: 12  │ Faltan: 60 │  ● 60 faltan        ║
║  └───────────────────────────────────┘                            ║
╚════════════════════════════════════════════════════════════════════╝
```

### Navigation Mockup — Mobile
```
╔══════════════════════════════╗
║ 🏆 ÁLBUM 2026  [🔔][JP]      ║
╠══════════════════════════════╣
║ ┌──────────────────────────┐ ║
║ │ 🔍 Buscar selección...   │ ║
║ └──────────────────────────┘ ║
╠══════════════════════════════╣
║ [Álbum▾] [Cal] [Mdo] [Dash]  ║ ← 4 tabs en mobile (Quiniela en menú)
╠══════════════════════════════╣
║                              ║
║  934 / 994    93.9%         ║
║  ██████████████░  ────────  ║
║                              ║
╚══════════════════════════════╝
```

### Cambios Concretos

**Arquitectura:**
- Separar `page.tsx` en `AppShell.tsx` + secciones como módulos
- `src/lib/design-tokens.ts` — fuente única de verdad para colores y espaciado
- `src/styles/` — CSS variables globales para dark/light theming

**Componentes:**
- **Header:** Más alto, dos filas en desktop (branding + actions separados), compacto en mobile
- **Navigation:** Bottom navigation bar en mobile (patrón moderno: Álbum / Calendario / Mercado / Dashboard)
- **StickerCard:** Nuevo variant "compact" para grid denso, mantiene variant "full" para detalle
- **Dashboard:** Gráficos de progreso con barras animadas (sin deps externas — CSS/SVG puro)
- **Marketplace:** Layout de dos paneles en desktop (lista izquierda, detalle derecho)
- **Calendar:** Sin cambios — ya actualizado
- **Modales:** Sistema unified modal con AnimatePresence consistente

**Sistema visual:**
- CSS custom properties en `:root` para dark/light:
  ```css
  :root { --color-bg: #081120; --color-surface: #0F172A; ... }
  [data-theme="light"] { --color-bg: #F8FAFC; --color-surface: #EFF4FB; ... }
  ```
- Fuentes con `next/font` (Bebas Neue + Barlow como variables CSS)
- `@layer components` para clases utilitarias reutilizables

**Quiniela (solo visual):**
```
[⏱ Quiniela]
 └─ Coming soon overlay elegante sobre un mockup borroso de la UI
    "La quiniela llega antes del primer partido"
    [Notificarme] ← placeholder sin funcionalidad
```

### Componentes Afectados
`page.tsx` (refactor parcial), `src/app/layout.tsx` (theme system), `StickerCard` (nuevo variant), `MarketplaceView` (layout 2-panel desktop), `DashboardView` (barras SVG), `globals.css` (CSS variables completo), **nuevo:** `AppShell.tsx`, `BottomNav.tsx` (mobile), `ThemeProvider.tsx`

### Evaluación

| Criterio | Valoración |
|----------|-----------|
| **Riesgo** | 🟡 Medio — refactor significativo pero no reescritura |
| **Tiempo estimado** | 2.5–4 semanas (con testing) |
| **Regresiones probables** | Moderadas — navegación y modales requieren QA completo |
| **Impacto UX** | Alto — experiencia notablemente más moderna y fluida |
| **Dark mode** | ✅ Mejorado significativamente |
| **Light mode** | ✅ Implementado (CSS variables) |
| **Compatibilidad Live Data** | ✅ Total |
| **Cambio en bundle** | +10-25 kB (CSS variables + componentes nuevos) |

### Adecuado para
Una vez que el Mundial comience y Live Data esté integrado. El rediseño puede hacerse en paralelo a otras features si se estructura bien por módulos. Permite lanzar light mode como feature nueva.

---

## OPCIÓN 3: FIFA+ / ONEFOOTBALL INSPIRED
**"Remake editorial — el álbum como experiencia multimedia"**

### Filosofía
Diseño orientado al contenido editorial de fútbol. Inspirado en FIFA+, OneFootball, ESPN Digital. Tipografía grande y audaz, tarjetas tipo "broadcast", mucho whitespace, experiencia de scroll narrativa. El álbum se percibe como un producto premium de medios deportivos, no solo como una herramienta de registro. Backend completamente intacto.

### Design Language

```
ANTES (actual):          DESPUÉS (opción 3):
─────────────────        ────────────────────────
Dark glass cards         Bold editorial cards con imagen
Small dense text         Large hero typography
Gold tabs horizontal     Vertical side-nav + breadcrumb
Static grid              Animated scroll sections
Compact header           Full-width hero sections
```

### Navigation Mockup — Desktop
```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  ┌──────────┐  ┌─────────────────────────────────────────────────┐  ║
║  │          │  │  ÁLBUM MUNDIAL 2026                             │  ║
║  │  ÁLBUM   │  │  Juan Pablo · 93.9% completado                 │  ║
║  │ ─────── │  └─────────────────────────────────────────────────┘  ║
║  │          │                                                        ║
║  │ EQUIPOS  │  ┌───────────────────────────────────────────────┐    ║
║  │          │  │  ████████████████████░░░░  934/994           │    ║
║  │ MERCADO  │  └───────────────────────────────────────────────┘    ║
║  │          │                                                        ║
║  │ CALENDAR │  ╔═══════╗ ╔═══════╗ ╔═══════╗ ╔═══════╗            ║
║  │          │  ║GRUPO A║ ║GRUPO B║ ║GRUPO C║ ║GRUPO D║            ║
║  │ DASHBOARD│  ╚═══════╝ ╚═══════╝ ╚═══════╝ ╚═══════╝            ║
║  │          │                                                        ║
║  │  ────── │                                                        ║
║  │ Quiniela │                                                        ║
║  │ [PRONTO] │                                                        ║
║  └──────────┘                                                        ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Navigation Mockup — Mobile (Bottom Bar)
```
╔══════════════════════════╗
║                          ║
║  ══ ÁLBUM MUNDIAL 2026 ══ ║  ← hero section scrollable
║                          ║
║  934/994  93.9%         ║  ← stat hero
║  ██████████████████░    ║
║                          ║
║  ┌──────────────────┐   ║
║  │  Grupo A — 4/4   │   ║  ← swipeable sections
║  │  MEX · RSA · ... │   ║
║  └──────────────────┘   ║
║                          ║
╠══════════════════════════╣
║ [📚] [📅] [⇄] [◉] [...]  ║  ← Bottom nav iOS-style
╚══════════════════════════╝
```

### Concepto por Sección

**Álbum → Página de Equipo (estilo editorial):**
```
╔═══════════════════════════════════════════════╗
║  🇲🇽 MÉXICO          Grupo A · 20 figuritas  ║
║  ════════════════════════════════════════════ ║
║  [Escudo FOIL]                               ║
║  14 ████████████████░░░░  70% completado     ║
║                                              ║
║  ┌──────┬──────┬──────┬──────┬──────┐        ║
║  │ Card │ Card │ Card │ Card │ Card │        ║
║  │      │      │      │      │      │        ║
║  └──────┴──────┴──────┴──────┴──────┘        ║
╚═══════════════════════════════════════════════╝
```

**Dashboard → Broadcast Style:**
```
╔════════════════════════════════════════╗
║  RANKING GLOBAL                        ║
║  ══════════════                        ║
║  #3  Juan Pablo  ████████████  93.9%  ║
║  #1  Usuario X   ██████████████ 98.2%  ║
║  #2  María Y     █████████████  96.1%  ║
║                                        ║
║  LOGROS RECIENTES         🏆🥇⭐       ║
╚════════════════════════════════════════╝
```

**Calendario → Match Day View:**
```
╔═══════════════════════════════════╗
║  FASE DE GRUPOS — Jornada 1       ║
║  ─────────────────────────────── ║
║                                   ║
║  JUE 11 JUN                       ║
║  ┌───────────────────────────┐    ║
║  │  🇲🇽 México  vs Sudáfrica 🇿🇦│    ║
║  │  Azteca · Ciudad de México │    ║
║  │  20:00 CT        PRÓXIMO  │    ║
║  └───────────────────────────┘    ║
║                                   ║
║  VIE 12 JUN                       ║
║  ┌───────────────────────────┐    ║
║  │  ...                      │    ║
╚═══════════════════════════════════╝
```

### Cambios Concretos

**Arquitectura:**
- Next.js App Router con rutas reales: `/album`, `/calendar`, `/market`, `/dashboard`
- Cada sección es una página (`page.tsx` por ruta) → code splitting automático
- Shared layout (`layout.tsx`) con sidebar + bottom nav
- `src/design-system/` — tokens, componentes primitivos, utilities

**Sistema visual:**
- Variables CSS full en 3 capas: brand, semantic, component
- Grid de 4/8/12 columnas según viewport
- Spacing scale 4px base
- Tipografía escalada: Display (48-96px), Heading (24-36px), Body (14-16px), Caption (10-12px)
- Motion system: spring physics consistentes via `framer-motion` variants exportadas

**Componentes nuevos:**
- `HeroSection` — sección editoral con gradiente y texto grande
- `MatchDayCard` — tarjeta de partido estilo broadcast
- `TeamHeroCard` — tarjeta de equipo con imagen de fondo
- `StatHero` — número grande animado estilo counter
- `SidebarNav` — navegación lateral en desktop
- `BottomNav` — barra de navegación mobile iOS-style
- `BreadcrumbBar` — contexto de navegación en mobile
- `LiveBadge` — badge animado para datos en vivo

**Quiniela:**
```
╔════════════════════════════════╗
║  ⚡ QUINIELA                   ║
║                                ║
║  [PREVIEW BORROSA DEL UI]      ║
║  ███████ blurred overlay ████  ║
║                                ║
║  "Activa para el primer        ║
║   partido: 11 junio 2026"      ║
║                                ║
║  [🔔 Notificarme cuando abra] ║
╚════════════════════════════════╝
```

### Componentes Afectados
**Prácticamente todos** — es un remake. Backend, Supabase, hooks y servicios **intactos**. Las pages/layouts y todos los componentes visuales se reescriben.

### Evaluación

| Criterio | Valoración |
|----------|-----------|
| **Riesgo** | 🔴 Alto — reescritura total del frontend |
| **Tiempo estimado** | 4–8 semanas (con QA exhaustivo) |
| **Regresiones probables** | Altas durante transición — requiere rama feature larga |
| **Impacto UX** | Muy Alto — experiencia de clase mundial |
| **Dark mode** | ✅ Diseñado desde cero para dark/light |
| **Light mode** | ✅ Native, no afterthought |
| **Compatibilidad Live Data** | ✅ Total — diseñado específicamente para live data |
| **Cambio en bundle** | +50-100 kB (routing, nuevos componentes, design system) |

### Adecuado para
Post-mundial. Si la aplicación tiene tracción de usuarios y se decide elevarla a producto de largo plazo. Requiere tiempo y puede hacerse en rama paralela sin afectar producción actual.

---

## PARTE 3 — COMPARATIVA FINAL

### Tabla de Decisión

| Criterio | Opción 1 Evolution | Opción 2 Modern Premium | Opción 3 FIFA+ |
|----------|-------------------|-------------------------|----------------|
| Riesgo | 🟢 Muy bajo | 🟡 Medio | 🔴 Alto |
| Tiempo | ~1 semana | ~3 semanas | ~6 semanas |
| Impacto UX | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Light mode | ❌ No | ✅ Sí | ✅ Sí |
| Tablet layout | ⚠ Parcial | ✅ Completo | ✅ Completo |
| Código existente reusado | ~95% | ~55% | ~20% |
| Ideal para lanzar con Live Data | ✅ | ✅ | ⚠ Depende del timing |
| Compatibilidad backend | ✅ Total | ✅ Total | ✅ Total |
| Requiere design freeze | No | 2 semanas | 4 semanas |

---

## PARTE 4 — RECOMENDACIÓN

### Escenario A: El Mundial comienza y quieres integrar Live Data rápidamente
→ **Opción 1 (Evolution)** mientras se desarrolla Live Data. Una vez estabilizado, pasar a Opción 2 en iteración posterior.

### Escenario B: Quieres lanzar un producto premium antes del inicio del Mundial (11 jun)
→ **Opción 2 (Modern Premium)** — tiempo ajustado pero factible en 2-3 semanas si se prioriza.

### Escenario C: El álbum es un proyecto de largo plazo y hay tiempo post-mundial
→ **Opción 3 (FIFA+ Inspired)** — hace el remake completo cuando la presión del Mundial ya pasó.

### Decisión Propuesta: **Opción 1 → Opción 2 (bifásico)**
1. **Ahora:** Opción 1 — ajustes finos + Live Data Integration (Calendar Phase 3)
2. **Post Mundial o en paralelo:** Opción 2 — light mode, tablet layout, componentes modernos, refactor de `page.tsx`
3. **Futuro:** Evaluar Opción 3 si hay crecimiento de usuarios

---

## PARTE 5 — MEJORAS COMUNES A TODAS LAS OPCIONES

Independientemente de la opción elegida, estas mejoras son recomendadas y de bajo riesgo:

1. **`next/font`** en lugar de Google Fonts CDN → eliminar FOUT, mejor Core Web Vitals
2. **Desactivar 3D tilt en StickerCard en touch devices** → `window.matchMedia('(hover: none)')`
3. **`aria-label`, `role="tablist"`, `aria-selected`** → accesibilidad básica sin impacto visual
4. **Focus ring visible** en todos los elementos interactivos para keyboard navigation
5. **Skeleton loaders** en StickerGallery (2–3 rows de placeholders animados)
6. **`loading="lazy"`** en imágenes de jugadores si se añaden

---

*Propuesta lista para revisión. Ningún código ha sido modificado.*
