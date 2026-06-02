# UI_POLISH_PLAN.md — Post-Deploy Visual Polish + Calendar Phase 2.5
**Fecha:** 2026-06-02 | **Basado en auditoría de:** `665d16d` (producción actual)

---

## 1. Auditoría Visual — Problemas Detectados

### 1.1 Calendario — Aprovechamiento del espacio

**Problema:** El grid de partidos usa `grid-cols-1 md:grid-cols-2` (2 cols desde 768px). En pantallas de 1440px+ las cards son muy anchas (70-80% del ancho disponible) dejando espacio inútil.

**Impacto UX:** Alto. En desktop 1440px el usuario ve solo 2 partidos por fila, obligándole a hacer scroll excesivo para ver el calendario completo.

**Solución:** Grid responsivo de 3 niveles:
- `< 1200px` → 1 columna
- `1200px–1599px` → 2 columnas  
- `≥ 1600px` → 3 columnas

Implementación: Custom breakpoints en `tailwind.config.js` + nueva clase de grid.

---

### 1.2 Calendariio — Header poco legible

**Problema:** `"FIFA World Cup 2026 · 104 partidos"` usa `color: rgba(163,181,211,0.5)` → 50% opacity, apenas visible.

**Impacto UX:** Bajo-medio. El usuario no ve el total de partidos a primera vista.

**Solución:** Subir opacity a 0.72, aumentar font-size de `text-xs` a `text-sm`, separar el número de partidos con styling diferente (más dorado/prominente).

---

### 1.3 Navegación principal — Altura excesiva

**Problema:** Botones de nav con `px-5 py-2.5` → 10px padding vertical cada lado. En contexto de la página, la nav ocupa ~44-46px de altura, demasiado para una barra de navegación secundaria.

**Impacto UX:** Medio. Empuja el contenido hacia abajo, reduce el viewport visible de contenido.

**Solución:** Reducir `py-2.5 → py-2` (~20% reducción vertical). Mantener `px-5` para horizontabilidad. Mantener todos los estados hover/active.

---

### 1.4 Quiniela — Diseño "disabled" poco comunicativo

**Problema:** El estado actual es `opacity-40 cursor-not-allowed` + badge "Pronto" con `opacity-50`. No comunica claramente que es una funcionalidad futura, parece un error o un elemento roto.

**Impacto UX:** Medio. Genera confusión: ¿está roto? ¿No está disponible para mí?

**Solución:** Rediseñar con estado "Próximamente" explícito:
- Mantener deshabilitado
- Añadir icono de reloj/candado
- Badge más visible con mejor contraste
- Tooltip implícito en el diseño (sin JS adicional)
- Patrón visual que comunica "coming soon" en lugar de "broken"

---

### 1.5 Álbum Hero / ProgressBar — Sin jerarquía visual clara

**Problema actual:** El componente ProgressBar muestra `percentComplete` en `text-5xl` dorado, pero el recuento `owned / total` (ej. `934 / 994`) está en `text-xs` al lado del badge "🏆 Mundial 2026". Los números críticos de colección no tienen protagonismo.

**Impacto UX:** Alto. El usuario quiere saber cuántas figuritas tiene de cuántas. Actualmente ese dato está escondido junto a un badge decorativo.

**Solución — Nuevo layout del hero:**
```
┌─────────────────────────────────────────────────────────┐
│  [TÍTULO] Tu Colección           [% grande]  [Copa 2026]│
│                                                          │
│  ████ Owned / Total ████████                            │  ← prominente
│  934 de 994 · 93.9%                                     │
│  ═══════════════════════════════════░                   │  ← barra
│                                                          │
│  [✅ 934 Tengo]  [♻ 12 Extras]  [❌ 60 Faltan]         │
└─────────────────────────────────────────────────────────┘
```

Cambios:
- `owned / total` → protagonismo: `text-3xl font-display` en dorado
- Porcentaje se convierte en etiqueta secundaria de la barra
- Estadísticas "Tengo/Extras/Faltan" más compactas pero conservadas
- El badge "🏆 2026" se convierte en un elemento decorativo pequeño

---

### 1.6 Textos "text-surface4" residuales en ProgressBar

**Problema:** `text-surface4` (#213255) aparece en "Tu colección" label y en otros textos dentro del ProgressBar. Con el rediseño se unificarán.

**Solución:** Sustituir por `rgba(163,181,211, X)` según jerarquía (0.5 para labels, 0.35 para subelementos).

---

### 1.7 Responsive — Espacios muertos en ProgressBar mobile

**Problema:** En mobile (375px) el layout de dos columnas en la fila superior del ProgressBar puede colapsar visualmente.

**Solución:** Revisar y ajustar para que en mobile sea stack vertical si es necesario.

---

## 2. Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `tailwind.config.js` | Añadir breakpoints: `'3xl': '1600px'` y `'screen-xl': '1200px'` |
| `src/components/CalendarView.tsx` | Grid 3-col, header legible, `space-y-7 → space-y-5` |
| `src/app/page.tsx` | Nav `py-2.5 → py-2`, Quiniela rediseñada |
| `src/components/ProgressBar.tsx` | Hero premium, jerarquía visual mejorada |

---

## 3. Cambios NO a implementar (fuera de scope)

- API externa / live data
- Nuevas tablas Supabase
- Quiniela funcional
- Alineaciones / eventos
- Backend, auth, RLS, RPCs
- Marketplace, trades, dashboard logic
- Exportaciones PDF, backups, restore

---

## 4. Estrategia de Implementación

1. **tailwind.config.js** → breakpoints `screen-xl` (1200px) y `3xl` (1600px)
2. **CalendarView.tsx** → grid `grid-cols-1 screen-xl:grid-cols-2 3xl:grid-cols-3`
3. **CalendarView.tsx** → header subtitle más visible
4. **page.tsx** → nav `py-2`, Quiniela con nuevo estado visual
5. **ProgressBar.tsx** → rediseño completo del hero

---

## 5. Riesgos

| Riesgo | Nivel | Mitigación |
|--------|-------|------------|
| Custom breakpoints rompen JIT | Bajo | Sintaxis estándar de Tailwind v3 |
| ProgressBar rediseño rompe tipos TypeScript | Muy bajo | Solo estilos, no lógica |
| Nav más compacta en mobile puede perder legibilidad | Bajo | py-2 → 8px sigue siendo usable en mobile |
