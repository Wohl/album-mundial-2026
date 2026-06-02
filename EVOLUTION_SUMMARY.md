# EVOLUTION_SUMMARY.md — Álbum Mundial 2026
**Fase:** Opción 1 — Evolution (mejora conservadora)
**Fecha:** 2026-06-02 | **Base commit:** `5c65141`

---

## Cambios implementados

### 1. Migración Google Fonts → `next/font` (`layout.tsx`, `globals.css`)
- Eliminado el `<link>` CDN de Google Fonts del `<head>`
- Cargadas `Bebas_Neue` y `Barlow` vía `next/font/google` con `display: 'swap'`
- Variables CSS `--font-display` y `--font-body` inyectadas en `<html>`
- `globals.css` actualizado para referenciar `var(--font-display)` y `var(--font-body)` con fallbacks
- **Beneficio:** elimina FOUT, mejora Core Web Vitals (LCP, CLS), fuentes pre-cargadas automáticamente

### 2. Desactivar 3D tilt en dispositivos touch (`StickerCard.tsx`)
- Añadido `useEffect` que detecta `window.matchMedia('(hover: none)')` al montar
- `handleMouseMove` y `handleMouseLeave` ahora son no-ops en dispositivos touch
- **Beneficio:** elimina jank potencial en mobile, sin efecto en desktop

### 3. Accesibilidad básica en navegación (`page.tsx`)
- Main nav: `role="tablist"` en el contenedor + `role="tab"`, `aria-selected`, `aria-label` en cada botón
- Album sub-nav: mismo patrón con `role="tablist"` wrapping los tabs de sección
- Focus rings visibles vía `focus-visible:outline-2 focus-visible:outline-gold` en todos los tabs
- **Beneficio:** navegación por teclado funcional, screen readers pueden anunciar tabs activos

### 4. Design tokens centralizados (`src/lib/theme.ts`)
- Archivo nuevo que exporta `colors`, `gradients`, `borders`, `text`, `shadows` como objetos tipados
- Fuente única de verdad para inline styles recurrentes (active tab, card states, etc.)
- **Beneficio:** facilita cambios globales de tema; base para futura migración a CSS variables

### 5. Skeleton loaders en StickerGallery (`StickerGallery.tsx`, `page.tsx`)
- Nuevo componente `SkeletonCard` con animación `animate-pulse` (Tailwind)
- `StickerGallery` acepta prop `loading?: boolean`; cuando es true muestra 10 skeleton cards en el mismo grid layout
- Eliminado el spinner centralizado de `page.tsx`; las galerías muestran el skeleton inline
- Todos los usos de `StickerGallery` actualizados para pasar `loading={loading}`
- **Beneficio:** mejor percepción de rendimiento, layout shift reducido vs spinner

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/layout.tsx` | next/font migration |
| `src/app/globals.css` | font variables |
| `src/components/StickerCard.tsx` | touch tilt detection |
| `src/app/page.tsx` | a11y tabs + skeleton wiring |
| `src/components/StickerGallery.tsx` | skeleton loaders |
| `src/lib/theme.ts` | (**nuevo**) design tokens |

---

## Archivos NO modificados (sin regresiones esperadas)

- `src/lib/supabase.ts`, hooks, RPCs, data layer — sin cambios
- `CalendarView`, `DashboardView`, `MarketplaceView` — sin cambios
- `TradeCard`, `AuthModal`, `ProfileModal` — sin cambios
- `tailwind.config.js` — sin cambios (tokens en `theme.ts` son independientes)

---

## Deuda pendiente (Opción 1 restante)

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| Tablet breakpoint (768–1199px) | Media | Requiere ajuste en layout del main content |
| Unificar hover approach | Baja | inline styles vs Framer `whileHover` aún mixtos |
| Marketplace breathing room | Baja | Densidad visual alta pero funcional |
| `fetchRecentTrades` bug (columnas inexistentes) | Media | Bug pre-existente, no parte de Evolution |

---

*Evolution phase completada. Sin regresiones en backend o data layer.*
