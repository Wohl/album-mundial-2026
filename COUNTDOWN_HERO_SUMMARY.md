# COUNTDOWN_HERO_SUMMARY.md
**Fecha:** 2026-06-02 | **Base commit:** `1cb787e`

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/CountdownHero.tsx` | (**nuevo**) Componente hero con contador en tiempo real |
| `src/components/CalendarView.tsx` | Import + inserción de CountdownHero; `matchesRef` para scroll; mejoras visuales header/search |

**Sin modificaciones en:** page.tsx, hooks, supabase, auth, RLS, RPCs, datos del álbum, trades, backups, quiniela, calendar-data.ts.

---

## Componente creado: `CountdownHero`

### Estructura visual
```
┌─────────────────────────────────────────────────────────────┐
│  [🏆] FIFA World Cup          [globe icon]                  │
│  MUNDIAL 2026                                               │
│  11 Jun – 19 Jul · USA · CAN · MEX                         │
│                                                             │
│  ┌──────┐ : ┌──────┐ : ┌──────┐ : ┌──────┐                │
│  │  08  │   │  14  │   │  23  │   │  47  │                │
│  └──────┘   └──────┘   └──────┘   └──────┘                │
│   DÍAS       HORAS       MIN        SEG                     │
│                                                             │
│              [ Ver partidos ↓ ]                             │
└─────────────────────────────────────────────────────────────┘
```

### Props
| Prop | Tipo | Descripción |
|------|------|-------------|
| `onCTAClick` | `() => void` (opcional) | Handler del botón "Ver partidos" — hace scroll suave |

### Identidad visual
- Fondo: navy gradient `rgba(10,20,42)` → `rgba(8,17,32)` con borde dorado sutil
- Glow ambiental dorado top-right: `radial-gradient` de 280px
- Textura diagonal: líneas doradas al 2.5% de opacidad
- Dígitos: bloques navy oscuros `#F5C542` con separador horizontal al 50% (efecto flip-clock)
- CTA: gradiente dorado `#F5C542 → #FFD700` con hover `translateY(-1px)` y sombra más intensa
- Fuente: Bebas Neue (`font-display`) para todos los elementos tipográficos del hero

---

## Lógica del contador

### Fecha objetivo
```typescript
const WC_START = new Date('2026-06-11T00:00:00')
// Medianoche local del 11 de junio — safe cross-timezone
// No depende de TZ del servidor; el cálculo se ejecuta 100% en cliente
```

### Prevención de hydration mismatch (Next.js)
```typescript
// Estado inicial null → SSR renderiza "--" en todos los dígitos
const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

// Solo en cliente (useEffect), se calcula el tiempo real
useEffect(() => {
  setTimeLeft(calcTimeLeft())
  const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000)
  return () => clearInterval(id)
}, [])
```
**Resultado:** SSR y cliente nunca divergen en el primer render. No hay `window is not defined` ni content mismatch.

### Estado post-inicio
Cuando `diff <= 0`, muestra el mensaje `"¡El Mundial ha comenzado!"` en lugar de dígitos — sin errores negativos ni NaN.

### Precisión
- Intervalo de 1000ms (±1 segundo de drift acumulable)
- `clearInterval` en cleanup del `useEffect` — sin memory leaks
- Aritmética pura sobre ms: sin dependencias externas, sin `date-fns`, sin `moment`

---

## Integración en CalendarView

### Scroll hacia partidos
```typescript
const matchesRef = useRef<HTMLDivElement>(null)
const handleScrollToMatches = useCallback(() => {
  matchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}, [])
```
- `matchesRef` está en el divider section header (encima del h2 "Calendario 2026")
- El CTA pasa `handleScrollToMatches` como `onCTAClick`

### Posición en el árbol de render
```
<div className="space-y-5">
  <CountdownHero onCTAClick={handleScrollToMatches} />   ← NUEVO
  <div ref={matchesRef}>  <!-- Section divider "PARTIDOS" -->
  <div>  <!-- Header "Calendario 2026" -->
  <div>  <!-- Search + filters box -->
  ...matches...
```

---

## Mejoras visuales del Calendario

| Mejora | Detalle |
|--------|---------|
| **Divider section** | Línea dorada + label "PARTIDOS" separa visualmente el Hero del contenido |
| **Título expandido** | "Calendario 2026" (antes "Calendario") — más informativo |
| **Subtítulo mejorado** | Añade "16 sedes · 3 países anfitriones" — más contexto sin ocupar espacio extra |
| **Contraste leyenda** | Status dots + labels: de `rgba(163,181,211,0.6)` → `rgba(185,205,230,0.75)` + `font-semibold` |
| **Search box envuelto** | Wrapper `rounded-xl` con fondo y borde sutil — agrupa visualmente búsqueda + filtros |
| **Contador de resultados** | De `0.5` → `0.75` opacidad + `font-semibold` — más legible en búsquedas |

---

## Comportamiento responsive

| Breakpoint | Comportamiento |
|------------|---------------|
| Mobile (≤480px) | Dígitos `clamp(52px, 9vw, 80px)` — se achican. Font `clamp(26px, 4.5vw, 44px)`. Globe icon oculto (`hidden sm:flex`). 2 separadores `:` visibles. |
| Tablet (≥640px) | Globe icon aparece. Dígitos a tamaño intermedio. |
| Desktop (≥1280px) | Dígitos a máximo 80px. Font 44px. Layout horizontal cómodo. |
| Sin overflow horizontal | `clamp` garantiza que los dígitos no excedan el viewport. |

---

## Validaciones realizadas

| Validación | Resultado |
|------------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ compilado, 4/4 páginas estáticas |
| Hydration errors (Next.js) | ✅ Ninguno — estado inicial `null`, cálculo solo en `useEffect` |
| Bundle size | ✅ +2 kB (161 kB vs 159 kB anterior) |
| Sin modificaciones backend | ✅ Solo archivos de componentes visuales |
| Sin modificaciones en calendar-data.ts | ✅ Los 104 partidos intactos |

---

## Riesgos pendientes

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Drift del contador ±1s | Muy baja | Intervalo de 1000ms — normal para countdowns web |
| TZ edge case | Baja | `'2026-06-11T00:00:00'` se interpreta en TZ local del browser; usuarios en UTC+12 o -12 pueden ver contador 0 con 12h de diferencia. Aceptable para este uso. |
| Post-Mundial (jul 19+) | Ninguna | El estado `started: true` ya maneja el caso — muestra mensaje, no dígitos negativos. |

---

## Estado del commit

- ✅ Commit pendiente (no pusheado)
- Sin cambios en: auth, Supabase, RLS, RPCs, trades, marketplace, dashboard, backups, exportaciones

*Listo para revisión y push cuando sea aprobado.*
