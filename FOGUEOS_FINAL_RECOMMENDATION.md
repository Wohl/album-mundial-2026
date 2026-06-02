# FOGUEOS_FINAL_RECOMMENDATION.md
**Fecha:** 2026-06-02 | **Post-audit commit:** pendiente | **Base:** `3dd5176`

---

## Veredicto

### ✅ LISTO PARA PRODUCCIÓN — con condición

La sección Fogueos Internacionales está lista para producción **después de aplicar las 5 correcciones de esta sesión** (ya aplicadas y verificadas). Sin ellas, el bug de triple display de marcador en partidos completados sería visualmente inaceptable.

---

## Justificación

### Qué funciona correctamente

| Área | Estado |
|------|--------|
| Navegación Mundial ↔ Fogueos | ✅ Fluida, tabs claros, sin regresión en WC |
| Carga de 30 partidos mock | ✅ 15 completados + 15 próximos, todos con banderas |
| Filtros Próximos / Recientes / Todos | ✅ Correctos, con sort apropiado |
| Búsqueda por equipo/estadio/ciudad | ✅ Multi-campo, limpiar con ×, estado vacío informativo |
| Estados visuales Próximo / Finalizado | ✅ Badges correctos, colores diferenciados |
| Marcadores en partidos completados | ✅ (post-fix M1: eliminado triple display) |
| Responsive mobile 1 columna | ✅ |
| Responsive tablet/desktop ≥1024px 2 columnas | ✅ (post-fix M5) |
| Skeleton loader durante carga async | ✅ |
| Empty state por filtro / búsqueda vacía | ✅ Con mensajes específicos y botón reset |
| Data notice "datos de demostración" | ✅ Honesto y claro |
| Identidad visual diferenciada (celeste vs dorado) | ✅ Coherente con el design system |
| TypeScript: 0 errores | ✅ |
| Build: 4/4 páginas | ✅ 166 kB (±0 vs pre-fix) |
| Backend / Supabase / auth / RLS | ✅ Sin tocar |
| calendar-data.ts (WC 2026) | ✅ Sin tocar |

---

## Fixes aplicados en esta sesión (pre-producción)

| Fix | Descripción | Archivo |
|-----|-------------|---------|
| **M1** | Triple score eliminado: `TeamBlock` muestra scores individuales solo en `live`/`halftime`; `completed` usa solo el score central `H–A` | `FriendliesView.tsx` |
| **M2** | Fallback `VS` opaco para `postponed`/`cancelled` en el bloque central de la card | `FriendliesView.tsx` |
| **M3** | Badges de conteo ocultos durante búsqueda activa (evita contradicción "15 próximos" vs "2 resultados") | `FriendliesView.tsx` |
| **M4** | `role="tablist"` + `role="tab"` + `aria-selected` + `aria-label` en sección nav de CalendarView | `CalendarView.tsx` |
| **M5** | Grid pasa a 2 columnas en `lg:` (≥1024px) — antes solo 1 columna hasta 1600px | `FriendliesView.tsx` |

---

## Deuda documentada (post-producción, baja urgencia)

| # | Issue | Prioridad |
|---|-------|-----------|
| D1 | Estado de Fogueos (filtro + búsqueda) no persiste al cambiar de tab y volver | Media |
| D2 | Tab "Todos" muestra partidos pasados antes que futuros (sort cronológico puro) | Baja |
| D3 | Sin animación de transición en el switch Mundial ↔ Fogueos | Baja |
| D4 | Filter tabs de `FriendliesView` sin `role="tab"` ni `aria-selected` (los de CalendarView sí los tienen ahora) | Media accesibilidad |
| D5 | Búsqueda no es case-sensitive para acentos (ej. "México" vs "Mexico") — dependerá de la API real | Baja |

---

## Expectativas de usuario al desplegar

Al entrar a la pestaña **Calendario**, el usuario verá:

1. Dos tabs en la parte superior: **🏆 Mundial 2026** (activo) y **⚽ Fogueos**
2. Al hacer click en **⚽ Fogueos**:
   - El countdown y el fixture del Mundial desaparecen
   - Aparece "Fogueos Internacionales" con acento celeste
   - Por defecto: 15 partidos próximos (Jun 3–10) agrupados por fecha
   - En ≥1024px: grid de 2 columnas
3. El tab **🏆 Mundial 2026** devuelve exactamente la vista anterior sin ningún cambio
4. Un aviso amarillo tenue al fondo advierte que los datos son ilustrativos

**Riesgo de confusión:** Ninguno. El aviso "datos de demostración" previene expectativas de datos reales.

---

## Condición de producción

> **La sección Fogueos puede desplegarse en producción en su estado actual (post-fixes aplicados), con la expectativa comunicada al usuario de que los datos son de demostración hasta que se integre la API real en Fase 3b.**

Recomendación adicional: al desplegar, actualizar el texto del aviso inferior de "datos de demostración" con una fecha estimada de integración si se tiene una ("Datos reales disponibles en julio 2026" o similar), para gestionar expectativas del usuario.

---

*Revisión completada. Fixes aplicados. Build verificado. Listo para push y deploy.*
