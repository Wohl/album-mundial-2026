# FAVORITES_PHASE_PLAN.md
**Fase 4 — Selecciones Favoritas**
**Fecha:** 2026-06-02

---

## Objetivo

Permitir al usuario marcar selecciones favoritas y personalizar las vistas de Calendario, Mundial 2026 y Amistosos con esa información. Sin modificar Supabase ni crear nuevas tablas.

---

## Arquitectura propuesta

```
localStorage
  └── album-wc2026-favorites-v1  → string[] de códigos FIFA (ej. ['ARG','COL','ENG'])

useFavorites() hook
  ├── favorites: string[]        ← estado React sincronizado con localStorage
  ├── toggle(code)               ← add/remove, persiste en localStorage
  ├── isFavorite(code)           ← query de pertenencia
  ├── clearAll()                 ← limpia todo
  └── loaded: boolean            ← false durante SSR/hidratación inicial

CustomEvent 'wc-favorites-changed'
  └── Propaga cambios entre instancias del hook en el mismo window
      (CalendarView + FriendliesView + Dashboard ven el cambio sin Context)
```

### Capas

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| **Hook** | `src/hooks/useFavorites.ts` | localStorage + sync entre componentes |
| **UI gestión** | `src/components/MyTeamsView.tsx` | seleccionar/ver equipos favoritos + próximos partidos |
| **Bloque dashboard** | `src/components/FavoriteMatchesBlock.tsx` | resumen de próximos partidos |
| **CalendarView** | modificación | conectar useFavorites al filtro "Mis favoritas" ya existente + 3er tab |
| **FriendliesView** | modificación | nuevo filtro "⭐ Mis Selecciones" |
| **DashboardView** | modificación mínima | insertar FavoriteMatchesBlock como primer bloque |

---

## Almacenamiento de favoritos

### Decisión: localStorage (Fase 4)

| Opción | Pros | Contras |
|--------|------|---------|
| **localStorage** | Sin DB changes; cero latencia; SSR-safe; off-line | No sincroniza entre dispositivos |
| Supabase (nueva tabla) | Multi-device sync | Requiere migraciones, RLS, nueva tabla — fuera de scope |
| Supabase user metadata | Sin nueva tabla | Formato limitado, difícil query |

**Razón de elección**: El usuario quiere una implementación funcional sin tocar el backend. localStorage es la solución correcta para Fase 4. La migración a Supabase sería Fase 5.

### Estructura
```json
// localStorage key: "album-wc2026-favorites-v1"
["ARG", "BRA", "ESP", "ENG"]
```

Versioned key (`-v1`) permite deprecar la versión anterior sin romper nada si se cambia el formato.

### SSR safety
El hook inicializa con `[]` y popula en `useEffect`. El componente muestra el estado real solo tras hidratación. Un flag `loaded: boolean` permite mostrar skeleton si se necesita.

---

## Integración futura con Live Data (Fase 3b+)

Cuando `ApiFootballProvider` reemplace a `MockProvider`:
- Los datos de amistosos incluirán partidos en tiempo real
- `getAllFriendlies()` ya acepta `teamCode` como filtro
- `getFriendliesByTeam(code)` ya existe en friendlies-service.ts
- El filtro de favoritos en FriendliesView funcionará automáticamente con datos reales sin cambios en la UI

```typescript
// Fase 3b — ya implementado en friendlies-service.ts:
export async function getFriendliesByTeam(teamCode: string): Promise<LiveMatch[]>
```

---

## Integración futura con Quiniela

Cuando se implemente la Quiniela (Fase 5+):
- Los favoritos serán el conjunto de selecciones para las predicciones del usuario
- `useFavorites().favorites` se puede inyectar como la lista de selecciones con preferencia de pronóstico
- Si la quiniela se sincroniza con Supabase, los favoritos también migrarán

---

## Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| localStorage no disponible (private mode, SSR) | Baja | `try/catch` en todas las operaciones; hook devuelve `[]` si falla |
| Datos de favoritos no sincronizan entre tabs del navegador | Baja | Se puede agregar listener de `storage` event para sincronizar entre tabs |
| Cambio en códigos de equipo rompe favoritos guardados | Muy baja | Códigos FIFA son estables; -v1 en la key permite resetear si hay cambio |
| Los favoritos del usuario no migran al cambiar de dispositivo | Media | Documentado como deuda — se resuelve en Fase 5 con Supabase sync |
| Agregar block en DashboardView puede afectar performance | Muy baja | El block returns null si no hay favoritos; no hace fetch adicional |

---

## Validaciones planificadas

- ✅ Persistencia tras reload de página
- ✅ Funciona en mobile / tablet / desktop
- ✅ No afecta rendimiento del álbum
- ✅ No afecta marketplace
- ✅ No afecta dashboard existente (block se oculta si sin favoritos)
- ✅ TypeScript estricto: 0 errores
- ✅ Build limpio

---

## Roadmap de evolución

### Fase 4 (ESTA SESIÓN)
- [x] `useFavorites` hook con localStorage
- [x] `MyTeamsView` — gestión de equipos + próximos partidos
- [x] `FavoriteMatchesBlock` — bloque de dashboard
- [x] Integración CalendarView (WC)
- [x] Integración FriendliesView (Amistosos)
- [x] Dashboard block

### Fase 4b (próxima iteración)
- [ ] Sincronización entre tabs del navegador (storage event)
- [ ] Mostrar también equipos de Amistosos en el selector (no solo WC)
- [ ] Notificación visual cuando un partido de favorito es hoy
- [ ] Persistir estado del filtro "Mis Selecciones" al cambiar de tab

### Fase 5 — Sync con Supabase
- [ ] Tabla `user_favorite_teams(user_id, team_code, created_at)`
- [ ] RPC `toggle_favorite_team(team_code)`
- [ ] Migrar localStorage → Supabase on login
- [ ] Sincronización multi-dispositivo

### Fase 5b — Quiniela integration
- [ ] Usar favoritos como pesos en predicciones
- [ ] Notificaciones push para partidos de favoritos

---

*Documento generado pre-implementación — Fase 4 ejecutada en esta sesión.*
