# COUNTDOWN_HERO_DEPLOY.md
**Deploy fecha:** 2026-06-02 | **Hora UTC:** 18:21 | **Ambiente:** Production — Vercel
**Deploy ID:** 4908706661 | **Estado:** ✅ success

---

## Commit desplegado

```
4a5e7b0  feat: CountdownHero del Mundial 2026 + mejoras visuales Calendario
Base:    1cb787e  docs: Evolution deploy summary and visual checklist
Branch:  main → origin/main
SHA completo: 4a5e7b0f5df5fcec3e523b1da1a2082bebe18d51
```

---

## Archivos modificados en este deploy

| Archivo | Cambio |
|---------|--------|
| `src/components/CountdownHero.tsx` | (**nuevo**) Hero con contador en tiempo real hasta 2026-06-11 |
| `src/components/CalendarView.tsx` | Import CountdownHero; `matchesRef` scroll; mejoras visuales header/search |
| `COUNTDOWN_HERO_SUMMARY.md` | (**nuevo**) Documentación del componente |

**Sin modificaciones en:** page.tsx, layout.tsx, globals.css, supabase.ts, hooks, RPCs, RLS, trades, marketplace, dashboard, backups, restore, quiniela, calendar-data.ts.

---

## Resultado del build

```
▲ Next.js 14.2.3
✓ TypeScript: 0 errores
✓ Compiled successfully
✓ Static pages: 4/4 generadas

Route /                   161 kB    248 kB First Load JS  (+2 kB vs Evolution deploy)
Route /_not-found         871 B      88.1 kB
Shared JS chunks:          87.2 kB
Middleware:                82 kB
```

**Bundle variación:** +2 kB vs deploy anterior (CountdownHero: nuevo componente puro, sin dependencias externas)

---

## Resultado del deploy

| Paso | Estado | Detalle |
|------|--------|---------|
| Push a origin/main | ✅ | `1cb787e..4a5e7b0` |
| Vercel build trigger | ✅ | Deploy ID `4908706661` detectado |
| Build en Vercel | ✅ | `state: success` |
| Production URL responde | ✅ | HTTP 200, título "Álbum Mundial 2026" |
| App hidrata correctamente | ✅ | Estado "Cargando" → SPA client-side esperado |

**URL producción:** https://album-mundial-2026-omega.vercel.app

---

## Mejoras visibles para usuarios

| Mejora | Impacto percibido |
|--------|------------------|
| **CountdownHero** | Al entrar a Calendario, aparece el contador de días/horas/min/seg con diseño navy/gold premium |
| **CTA "Ver partidos"** | Scroll suave hacia la lista de partidos desde el botón del hero |
| **Divider "PARTIDOS"** | Separador visual dorado entre el hero y el contenido del calendario |
| **Título "Calendario 2026"** | Más informativo que el anterior "Calendario" |
| **Subtítulo mejorado** | "16 sedes · 3 países anfitriones" — contexto adicional |
| **Contraste leyenda** | Status dots más legibles: `rgba(185,205,230,0.75)` + `font-semibold` |
| **Search box envuelto** | Wrapper con borde y fondo sutil — agrupa visualmente búsqueda + filtros |

---

## Checklist visual post-deploy — Countdown Hero

### DESKTOP (≥1280px)

- [ ] Al entrar a pestaña **Calendario**, aparece el CountdownHero arriba de todo
- [ ] Fondo navy gradient con borde dorado sutil visible
- [ ] Glow ambiental dorado en esquina superior derecha
- [ ] Trophy icon (🏆) y label "FIFA World Cup" en fila superior izquierda
- [ ] Globe icon en esquina superior derecha visible
- [ ] Título "MUNDIAL 2026" con gradiente dorado (Bebas Neue)
- [ ] Subtítulo "11 Jun – 19 Jul · USA · CAN · MEX" en gris suave
- [ ] 4 bloques de dígitos: DÍAS · HORAS · MIN · SEG con separadores `:`
- [ ] Dígitos en `#F5C542` sobre bloques oscuros con línea divisoria al 50% (flip-clock)
- [ ] Labels debajo de cada bloque: "Días", "Horas", "Min", "Seg" en gris tenue
- [ ] Botón "Ver partidos ↓" con gradiente dorado y texto oscuro
- [ ] Hover sobre botón: `translateY(-1px)` y sombra más intensa visibles
- [ ] Al hacer clic en "Ver partidos", hace scroll suave hacia la lista de partidos
- [ ] Dígitos cambian cada segundo (verificar conteo en tiempo real)

### TABLET (≥640px — iPad)

- [ ] Hero visible y proporcionado — sin overflow horizontal
- [ ] Globe icon visible (`hidden sm:flex` → aparece en ≥640px)
- [ ] Dígitos se adaptan con `clamp()` — tamaño intermedio, no se cortan
- [ ] Botón "Ver partidos" centrado y completamente visible

### MOBILE (≤480px — teléfono)

- [ ] Hero visible y proporcional en pantalla chica
- [ ] Globe icon **oculto** (correcto — `hidden sm:flex`)
- [ ] Dígitos más pequeños (`clamp(52px, 9vw, 80px)`) — ajustados al viewport sin overflow
- [ ] Los 4 bloques caben en una fila horizontal sin scroll
- [ ] Botón "Ver partidos" visible y tappable
- [ ] Sin efecto hover involuntario al hacer scroll sobre el botón (touch)

### POST-MUNDIAL (simulación)

- [ ] Si `diff ≤ 0`, el hero muestra `"¡El Mundial ha comenzado!"` en lugar de dígitos
- [ ] No hay números negativos, NaN ni crasheos en ese estado

---

## Checklist visual — mejoras del Calendario

- [ ] Divider dorado "┄ PARTIDOS ┄" separa visualmente el Hero del calendario
- [ ] Título "Calendario 2026" (no "Calendario") visible
- [ ] Subtítulo "48 equipos · 104 partidos · 16 sedes · 3 países anfitriones" visible
- [ ] Search box tiene wrapper redondeado con borde sutil — se ve como unidad visual
- [ ] Leyenda de estados (pasado/próximo/hoy) tiene mejor contraste que antes
- [ ] Contador de resultados al filtrar es más legible (`0.75` opacidad + `font-semibold`)
- [ ] Los 104 partidos siguen cargando correctamente — sin regresiones en calendar-data

---

## Riesgos pendientes (sin cambios)

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Drift del contador ±1s | Muy baja | Intervalo de 1000ms — normal para countdowns web |
| TZ edge case en `WC_START` | Baja | `'2026-06-11T00:00:00'` interpreta en TZ local del browser. Aceptable. |
| Bug pre-existente `fetchRecentTrades` | Media | Sin cambio — retorna `[]` silenciosamente via catch |

---

*Deploy completado sin incidentes. Backend, Supabase, auth, RLS, RPCs y data layer sin modificaciones.*
