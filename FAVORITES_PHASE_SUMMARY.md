# FAVORITES_PHASE_SUMMARY.md
**Fase 4 — Selecciones Favoritas**
**Fecha:** 2026-06-02 | **Estado:** ✅ Build limpio, commit local

---

## Arquitectura final implementada

```
localStorage
  └── album-wc2026-favorites-v1  → string[] de códigos FIFA

useFavorites() hook                          [src/hooks/useFavorites.ts]
  ├── favorites: string[]
  ├── toggle(code)
  ├── isFavorite(code)
  ├── clearAll()
  └── loaded: boolean
  
  CustomEvent 'wc-favorites-changed'
  └── Sincroniza instancias del hook en el mismo window sin React Context

MyTeamsView                                  [src/components/MyTeamsView.tsx]
  ├── Grid de equipos favoritos (cards con flag, nombre, grupo, ✖)
  ├── Selector de los 32 equipos del WC (organizados por grupo A–L)
  └── Próximos partidos filtrados por favoritos (Amistosos + WC)

FavoriteMatchesBlock                         [src/components/FavoriteMatchesBlock.tsx]
  ├── Se renderiza solo si hay favoritos y partidos próximos
  └── Muestra hasta 6 próximos partidos de las selecciones favoritas

CalendarView (modificado)
  ├── 3 tabs: [🏆 Mundial 2026] [⚽ Amistosos] [⭐ Mis Selecciones]
  ├── Filtro "Mis favoritas" en WC ya conectado a useFavorites (antes siempre [])
  └── MyTeamsView renderizado en tab 'my_teams'

FriendliesView (modificado)
  ├── 4 filtros: Próximos · Recientes · Todos · ⭐ Mis Selecciones
  ├── Filtro 'favorites' muestra partidos de cualquier status con equipo favorito
  └── Empty state específico cuando no hay favoritos marcados

DashboardView (modificado — solo adición)
  └── FavoriteMatchesBlock insertado antes del header (returns null si sin favoritos)
```

---

## Archivos modificados/creados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/hooks/useFavorites.ts` | Nuevo | Hook con localStorage + CustomEvent sync |
| `src/components/MyTeamsView.tsx` | Nuevo | Gestión de favoritos + próximos partidos |
| `src/components/FavoriteMatchesBlock.tsx` | Nuevo | Bloque de dashboard con próximos de favoritos |
| `src/components/CalendarView.tsx` | Modificado | 3er tab + conectar useFavorites a filtro WC existente |
| `src/components/FriendliesView.tsx` | Modificado | Filtro 'favorites' + useFavorites |
| `src/components/DashboardView.tsx` | Modificado | Import + insertar FavoriteMatchesBlock |
| `FAVORITES_PHASE_PLAN.md` | Nuevo | Arquitectura y roadmap |

**Sin modificaciones en:** supabase.ts, hooks existentes, RPCs, RLS, trades, marketplace, calendar-data.ts, CountdownHero, backups, restore, quiniela, exportaciones.

---

## Flujo del usuario

### Marcar un favorito
1. Calendario → ⭐ Mis Selecciones
2. Click en "Gestionar" → se expande el selector de 32 equipos agrupados por grupo
3. Click en cualquier equipo → queda marcado (⭐ dorado, fondo dorado tenue)
4. Click de nuevo → se desmarca
5. El equipo aparece como card en "Mis equipos" con flag, nombre, grupo
6. Persiste al recargar la página (localStorage)

### Filtrar partidos en Amistosos
1. Amistosos → tab "⭐ Mis Selecciones"
2. Muestra todos los partidos (cualquier status) donde participe un favorito
3. Si no hay favoritos: empty state con instrucción para ir a la gestión
4. Si no hay partidos para los favoritos: empty state informativo

### Filtrar en Mundial 2026
1. Mundial 2026 → chip "Mis favoritas" (ya existía en la UI, ahora funciona)
2. Muestra solo partidos de la fase actual donde participe un favorito
3. Funciona con búsqueda y filtros de fase/grupo

### Dashboard
1. Al entrar al Dashboard, si el usuario tiene favoritos Y hay partidos próximos:
   - Aparece el bloque "⭐ Próximos partidos / mis selecciones" al tope
2. Si no hay favoritos o no hay próximos partidos: el bloque NO aparece (returns null)
3. El resto del Dashboard no se ve afectado

---

## Validaciones realizadas

| Validación | Resultado |
|------------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ 4/4 páginas, 169 kB |
| Persistencia localStorage (SSR safe) | ✅ Inicializa con [] en SSR, popula en useEffect |
| Sync cross-componente en mismo window | ✅ CustomEvent 'wc-favorites-changed' |
| Filtro "Mis favoritas" WC (antes no-op) | ✅ Ahora conectado a useFavorites |
| Filtro "⭐ Mis Selecciones" en Amistosos | ✅ FilterTab 'favorites' implementado |
| Dashboard block se oculta sin favoritos | ✅ returns null si length === 0 |
| Dashboard existente sin regresión | ✅ Solo se añadió import + 1 línea JSX |
| Mobile: grid responsive en selector | ✅ grid-cols-1 sm:grid-cols-2 |
| Tablet: cards de favoritos en grid | ✅ grid-cols-2 sm:grid-cols-3 md:grid-cols-4 |
| Desktop: grid expandido | ✅ hasta grid-cols-6 |
| Countdown Hero, WC calendar, marketplace | ✅ Sin cambios |
| Datos amistosos (60 partidos) | ✅ Sin cambios |

---

## Riesgos pendientes

| Riesgo | Severidad | Detalle |
|--------|-----------|---------|
| Favoritos no sincronizan entre pestañas del navegador | Baja | Solo CustomEvent en mismo window; se puede agregar `storage` event listener |
| Favoritos no persisten al cambiar de dispositivo | Media | localStorage es local; migración a Supabase documentada en plan como Fase 5 |
| Equipos no-WC no aparecen en el selector | Media | El selector solo muestra los 32 equipos WC; equipos de amistosos (Costa Rica, etc.) requieren Fase 4b |
| Estado del filtro 'favorites' se pierde al cambiar de tab | Baja | FriendliesView se remonta al volver; favoritos persisten, filtro vuelve a 'upcoming' |

---

## Próximos pasos recomendados

1. **Aprobar y desplegar** este commit
2. **Fase 4b** — Agregar equipos de Amistosos al selector (no solo WC)
3. **Fase 4b** — Sincronizar favoritos entre tabs del browser (storage event)
4. **Fase 5** — Migrar favorites a Supabase para sync multi-dispositivo
5. **Fase 5b** — Integrar con Quiniela: predicciones ponderadas por favoritos

---

## Resultado del build

```
▲ Next.js 14.2.3
✓ TypeScript: 0 errores
✓ Compiled successfully
✓ Static pages: 4/4

Route /                   169 kB    256 kB First Load JS (+2 kB vs anterior)
```

---

*Commit local únicamente. No pusheado. Pendiente aprobación.*
