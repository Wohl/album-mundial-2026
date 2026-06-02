# EVOLUTION_VISUAL_CHECKLIST.md
**Commit:** `668efce` | **Deploy:** 2026-06-02 | **URL:** https://album-mundial-2026-omega.vercel.app

Checklist de verificación manual post-deploy. Marcar cada ítem al confirmarlo en producción.

---

## HEADER

- [ ] Fuentes cargadas sin flash (Bebas Neue y Barlow visibles desde el primer render)
- [ ] Título "Álbum · Mundial 2026" en header con tipografía correcta
- [ ] Botones de acción (Buscar, +Rápido, Exportar, 🔔, 👤, →) alineados correctamente
- [ ] Sin FOUT al hacer hard refresh (Ctrl+Shift+R)

---

## ÁLBUM — Navegación

- [ ] 5 tabs principales visibles: Álbum, Calendario, Quiniela, Mercado, Dashboard
- [ ] Tab activo muestra fondo dorado con texto oscuro
- [ ] Tab inactivo muestra fondo oscuro con texto gris
- [ ] **NUEVO:** Tab Álbum tiene `aria-selected="true"` al estar activo (verificar con DevTools → Elements)
- [ ] **NUEVO:** Navegar con Tab/Shift+Tab muestra focus ring dorado visible en cada tab
- [ ] Quiniela tab muestra badge "Pronto" y está deshabilitado
- [ ] Sub-nav de secciones aparece al entrar a Álbum: Intro · Equipos · Final · Coca-Cola · Repetidas · Stats
- [ ] **NUEVO:** Sub-nav tabs tienen `role="tab"` y `aria-selected` correcto (DevTools)

---

## ÁLBUM — Carga y Skeleton

- [ ] **NUEVO:** Al hacer login por primera vez, las galerías muestran skeleton cards pulsando (no spinner)
- [ ] Skeleton tiene el mismo grid layout que las cards reales (2 cols mobile, 3 sm, 4 lg, 5 xl)
- [ ] Skeleton desaparece y muestra las figuritas reales al terminar la carga
- [ ] ProgressBar hero aparece debajo del sub-nav en todas las secciones excepto Stats
- [ ] Sección Intro muestra figuritas FWC (portada, escudos)
- [ ] Sección Equipos muestra TeamOverview con grupos FIFA
- [ ] Sección Final, Coca-Cola, Repetidas cargan correctamente
- [ ] Sección Stats muestra panel de estadísticas

---

## ÁLBUM — StickerCard (Desktop)

- [ ] Cards muestran efecto 3D tilt al mover el mouse sobre ellas (owned/repeated)
- [ ] Cards missing no tienen tilt (correcto, no es regresión)
- [ ] Cards foil muestran efecto dorado
- [ ] Cards legendarias muestran borde morado
- [ ] Botones +/− en cards funcionan y actualizan estado

---

## CALENDARIO

- [ ] Calendario carga sin errores
- [ ] Layout 3 columnas en pantallas grandes (≥1600px)
- [ ] Layout 2 columnas en pantallas medianas (≥1200px)
- [ ] Layout 1 columna en mobile
- [ ] Partidos muestran fecha, equipos, hora y sede
- [ ] Tabs de fases funcionan (Grupos, Octavos, etc.)
- [ ] Sin regresiones vs deploy anterior

---

## MERCADO

- [ ] Marketplace carga sin errores
- [ ] Lista de figuritas repetidas de otros usuarios visible
- [ ] Cards de trade muestran estado (pending, countered, accepted)
- [ ] Botones de oferta / contraoferta funcionan
- [ ] Badge rojo en tab Mercado aparece cuando hay trades pendientes
- [ ] Sin regresiones vs deploy anterior

---

## DASHBOARD

- [ ] Dashboard carga sin errores
- [ ] Logros / achievements visibles
- [ ] Ranking de usuarios carga
- [ ] Figuritas más buscadas / más disponibles carga
- [ ] Counters animados funcionan
- [ ] Sin regresiones vs deploy anterior

---

## MOBILE (≤480px — teléfono)

- [ ] Fuentes correctas y legibles (Barlow body, Bebas Neue headers)
- [ ] **NUEVO:** Sin efecto 3D tilt en StickerCards al hacer scroll o tocar cards
- [ ] Main nav hace scroll horizontal sin cortar tabs
- [ ] Header compacto y legible
- [ ] Sub-nav de secciones hace scroll horizontal
- [ ] Modales (auth, profile) ocupan pantalla completa y son usables
- [ ] StickerGallery muestra 2 columnas correctamente

---

## TABLET (768px–1199px — iPad)

- [ ] Fuentes correctas
- [ ] Nav no se corta ni desborda
- [ ] StickerGallery muestra 3 columnas (sm:grid-cols-3)
- [ ] Header no tiene overflow
- [ ] **Nota de deuda conocida:** No hay breakpoint propio de tablet — la experiencia se parece al mobile. Esto está documentado como deuda pendiente, no es regresión.

---

## DESKTOP (≥1280px)

- [ ] Fuentes correctas (Bebas Neue visible en headers y tabs)
- [ ] StickerGallery muestra 4–5 columnas según viewport
- [ ] Calendario muestra 2–3 columnas
- [ ] Header con todos los botones de acción visibles sin overflow
- [ ] Hover sobre tabs muestra feedback visual (borde dorado, texto más claro)
- [ ] Tilt 3D en StickerCards funciona correctamente con mouse

---

## REGRESIONES A VERIFICAR EXPLÍCITAMENTE

Estos flujos no fueron tocados pero deben confirmarse sin cambios:

- [ ] Login / Signup fluye correctamente
- [ ] Logout funciona y redirige
- [ ] Marcar figurita como owned/missing/repeated persiste en Supabase
- [ ] Entrada masiva de figuritas (BulkEntry modal) funciona
- [ ] Buscar figurita con Ctrl+K abre el modal
- [ ] Crear trade funciona
- [ ] Aceptar / rechazar / contraofertar trade funciona
- [ ] Notificaciones bell (🔔) abre panel lateral
- [ ] Exportar PDF abre modal

---

## NOTAS

- El feed de notificaciones de trades (`fetchRecentTrades`) retorna `[]` silenciosamente — bug pre-existente, no parte de este deploy.
- El efecto de skeleton solo es visible durante la primera carga después de login; en navegación entre tabs con datos ya cargados no aparece (correcto, `loading` ya es false).

---

*Usar DevTools → Elements para verificar atributos ARIA. Usar DevTools → Network → disable cache para verificar fonts preloaded.*
