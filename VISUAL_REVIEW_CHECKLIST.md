# VISUAL_REVIEW_CHECKLIST.md
**Para revisión en producción — Album Mundial 2026**  
**Deploy:** `665d16d` · `2026-06-02`

> Abrir la URL de producción en Chrome/Safari, realizar cada verificación y marcar ✅/❌.  
> Probar en **desktop (1280px+)** y **mobile (375px)** para cada sección.

---

## INSTRUCCIONES GENERALES

1. Iniciar sesión con cuenta de prueba antes de comenzar
2. Tener DevTools abierto con consola visible → buscar errores en rojo
3. Revisar en modo desktop primero, luego recargar en modo responsive mobile
4. Marcar cada item como ✅ (aprobado) o ❌ (falla) con notas de lo observado

---

## A. HEADER — DESKTOP

**Qué debería verse:**
- Barra fija superior con logo "Álbum / Mundial 2026" a la izquierda
- Botones de acción a la derecha: Buscar · Entrada rápida · Exportar · Campana · Avatar · Logout
- Línea dorada sutil en la parte superior
- Fondo azul-noche con glassmorphism, no completamente opaco

**Comportamiento a validar:**
- [ ] El header permanece sticky al hacer scroll
- [ ] El botón Buscar abre el modal de búsqueda global
- [ ] Ctrl+K abre el modal de búsqueda global
- [ ] El botón Entrada rápida abre el modal de entrada masiva
- [ ] El botón Exportar abre el modal de exportación PDF
- [ ] La campana — si hay trades pendientes, muestra badge rojo
- [ ] Click en avatar abre el modal de perfil
- [ ] Click en logout cierra sesión
- [ ] Hover en botones muestra borde dorado sutil

**Errores visuales a buscar:**
- Fondo del header completamente negro u opaco (regresión)
- Botones superpuestos o cortados
- Texto de username demasiado largo que rompe el layout
- La línea dorada superior invisible o muy gruesa

**Criterios de aprobación:** Header visible, sticky, todos los botones clickeables, glassmorphism visible (estadio de fondo leve)

---

## B. HEADER — MOBILE (375px)

**Qué debería verse:**
- Logo con solo ícono de copa (sin texto "Álbum")
- Solo iconos de botones (sin labels "Buscar", "Entrada rápida", etc.)
- Avatar con solo la inicial (sin nombre)

**Comportamiento a validar:**
- [ ] El header no desborda horizontalmente (sin scroll horizontal)
- [ ] Todos los botones de acción siguen siendo clickeables (no cortados)
- [ ] El avatar muestra solo la inicial
- [ ] La campana con badge es visible en mobile

**Errores a buscar:**
- Botones demasiado pequeños para tocar (< 44px target)
- Header con scroll horizontal
- Avatar y logout superpuestos

**Criterios:** Layout compacto funcional, sin desbordamiento

---

## C. NAVEGACIÓN PRINCIPAL (5 tabs)

**Qué debería verse:**
- Fila de 5 botones: `Álbum · Calendario · Quiniela · Mercado · Dashboard`
- El tab activo en dorado sólido con texto oscuro
- Quiniela con badge "Pronto" naranja y apariencia ghosteada
- Mercado con badge rojo si hay trades pendientes

**Comportamiento a validar:**
- [ ] Click en "Álbum" → muestra sub-nav y contenido del álbum
- [ ] Click en "Calendario" → muestra el módulo Calendario
- [ ] Click en "Quiniela" → NO navega (bloqueado), muestra badge "Pronto"
- [ ] Click en "Mercado" → muestra MarketplaceView
- [ ] Click en "Dashboard" → muestra DashboardView
- [ ] Hover en tabs inactivos → borde dorado sutil + texto más claro
- [ ] Hover NO afecta al tab activo

**Errores a buscar:**
- Quiniela navega y muestra contenido (bug — debe estar bloqueado)
- Tab activo pierde su estado gold al hover
- Badge de trades no aparece en Mercado cuando hay pendientes

**Mobile:**
- [ ] Los 5 tabs tienen scroll horizontal si no caben (no wrapping)
- [ ] Scroll horizontal suave sin scrollbar visible

**Criterios:** 5 tabs visibles, activo en dorado, Quiniela bloqueada visualmente

---

## D. ÁLBUM — SUB-NAVEGACIÓN

**Qué debería verse:**
- Fila secundaria más pequeña debajo del nav principal (solo cuando "Álbum" activo)
- Label "Sección" en gris muy sutil a la izquierda
- 6 tabs: `Intro · Equipos · Final · Coca-Cola · Extras · Stats`
- Tab activo con borde dorado y texto gold

**Comportamiento:**
- [ ] Sub-nav aparece con animación slide cuando se activa "Álbum"
- [ ] Sub-nav desaparece cuando se cambia a otra sección principal
- [ ] Al cambiar subsección, el contenido hace fade-in
- [ ] Hover en sub-tabs cambia color del texto

**Mobile:**
- [ ] Sub-nav tiene scroll horizontal si no caben los 6 tabs

**Errores a buscar:**
- Sub-nav visible cuando no estás en "Álbum"
- Label "Sección" con tamaño de fuente incorrecto o demasiado visible

**Criterios:** Sub-nav aparece/desaparece correctamente, gold en activo

---

## E. ÁLBUM → INTRO

**Qué debería verse:**
- Galería de 9 stickers de introducción (P00, FWC1–FWC8)
- Todos marcados como FOIL (bordes holográficos)
- Barra de progreso visible encima

**Comportamiento:**
- [ ] Click en sticker cambia su estado (missing → owned → repeated)
- [ ] La barra de progreso se actualiza tras marcar
- [ ] Estado persiste al recargar (Supabase sync)

**Errores a buscar:**
- Galería vacía o spinner infinito
- Progreso no actualiza
- Stickers foil sin efecto visual especial

**Criterios:** 9 stickers visibles, click funciona, barra de progreso presente

---

## F. ÁLBUM → EQUIPOS

**Qué debería verse:**
- Grid de 48 equipos organizados por grupos A–L
- Cada equipo muestra bandera, nombre, progreso de figuritas

**Comportamiento:**
- [ ] Click en equipo navega al detalle con sus 20 figuritas
- [ ] Botón "← Volver" regresa al grid de equipos
- [ ] Nombre del equipo y grupo visible en la vista de detalle
- [ ] Stickers del equipo clickeables (cambio de estado)
- [ ] La búsqueda global (Ctrl+K) puede navegar directamente a un equipo

**Errores a buscar:**
- Equipos sin bandera (TeamFlag null)
- Progreso de equipo incorrecto
- "← Volver" no funciona

**Criterios:** 48 equipos visibles, detalle funciona, volver funciona

---

## G. ÁLBUM → FINAL

**Qué debería verse:**
- 11 stickers de la sección Final FWC (FWC9–FWC19)
- Títulos de campeonatos históricos (Italia 1934, Uruguay 1950, etc.)
- Todos FOIL

**Comportamiento:**
- [ ] Galería muestra 11 stickers
- [ ] Click cambia estado

**Errores a buscar:**
- Stickers mezclados con otros grupos
- Galería vacía

**Criterios:** 11 stickers correctos, interactivos

---

## H. ÁLBUM → COCA-COLA

**Qué debería verse:**
- Banner rojo "Coca-Cola Special Edition" encima
- 14 stickers CC1–CC14 (jugadores especiales, todos FOIL)

**Comportamiento:**
- [ ] Banner visible con emoji 🥤
- [ ] 14 stickers visibles
- [ ] Click cambia estado

**Errores a buscar:**
- Banner sin fondo rojo
- Stickers CC equivocados

**Criterios:** Banner + 14 stickers

---

## I. ÁLBUM → EXTRAS (repetidas)

**Qué debería verse:**
- Galería de TODAS las figuritas (994 total) filtrada por "repeated"
- Si no hay repetidas: galería vacía o mensaje

**Comportamiento:**
- [ ] Filtro "repeated" activo por defecto
- [ ] Stickers repetidos con su count de repeticiones
- [ ] Se puede cambiar el filtro a "owned" o "missing"

**Errores a buscar:**
- Galería muestra stickers no repetidos
- Filtro no respeta el estado real

**Criterios:** Solo stickers repetidos visibles (o vacío si ninguno)

---

## J. ÁLBUM → STATS

**Qué debería verse:**
- Panel de estadísticas: progreso general, por sección, rankings de completitud
- Sin barra de progreso encima (Stats no la muestra)

**Comportamiento:**
- [ ] Barra de progreso global AUSENTE en Stats (verificar que no aparece)
- [ ] Porcentajes calculados correctamente
- [ ] Gráficos o cards de estadísticas visibles

**Errores a buscar:**
- Progreso bar aparece en Stats (regresión)
- Porcentajes en 0% o NaN
- Panel vacío

**Criterios:** Stats cargado, progreso bar ausente, números coherentes

---

## K. CALENDARIO

**Qué debería verse:**
- Título "Calendario" en dorado
- Subtitle "FIFA World Cup 2026 · 104 partidos"
- Input de búsqueda
- Botón "⭐ Mis favoritas"
- 7 tabs de fase: Grupos / Ronda 32 / Octavos / Cuartos / Semis / 3er Lugar / Final
- En fase Grupos: filtro adicional A–L
- Cards de partidos agrupadas por fecha

**Comportamiento:**
- [ ] Fase "Grupos" activa por defecto, muestra 72 partidos
- [ ] Filtro por grupo muestra solo 6 partidos
- [ ] Búsqueda "México" muestra 6 partidos (3 jornadas)
- [ ] Búsqueda "azteca" muestra partidos en Estadio Azteca
- [ ] Búsqueda "miami" muestra partidos en Miami
- [ ] Búsqueda "ger" muestra partidos de Alemania
- [ ] Búsqueda vacía restaura vista de fase/grupo
- [ ] Fase "Final" muestra 1 card con borde dorado prominente
- [ ] Fase "3er Lugar" (🥉) muestra 1 card
- [ ] Fase "Ronda 32" muestra 16 cards con TBD
- [ ] Botón "Mis favoritas" muestra empty state "Sin selecciones favoritas"
- [ ] Hover en tabs de fase → borde dorado sutil + texto más claro
- [ ] Badge "en Xd" aparece en partidos a ≤21 días (11–23 jun)

**Errores a buscar:**
- Contador muestra ≠ 104 (error en data)
- "Rose Bowl" aparece en alguna card (error de datos no corregido)
- Búsqueda de "Costa Rica" o "CRC" → 0 resultados es CORRECTO (no debe haber botón CR dedicado)
- Botón 🇨🇷 Costa Rica visible en la UI (debe estar eliminado)
- Tabs de fase sin hover state
- Phase/group filter visible durante búsqueda (debe ocultarse)

**Mobile:**
- [ ] Búsqueda y Mis favoritas en la misma fila (flex-wrap ok)
- [ ] Tabs de fase scrollables horizontalmente
- [ ] Cards en 1 columna (no 2)
- [ ] Nombres largos ("Estados Unidos") sin corte

**Criterios:** 104 partidos en Grupos, búsqueda funcional, sin "Rose Bowl", sin botón CR

---

## L. MERCADO

**Qué debería verse:**
- Vista de marketplace con sub-tabs: Mis intercambios / Explorar / Matches / Solicitar
- Trades pendientes con badge de notificación

**Comportamiento:**
- [ ] Sub-tabs internos del Mercado funcionan
- [ ] Lista de trades (enviados/recibidos) visible
- [ ] Explorar muestra figuritas de otros usuarios
- [ ] Aceptar/rechazar trade funciona
- [ ] Badge rojo de trades pendientes en nav principal se actualiza

**Errores a buscar:**
- Mercado vacío sin spinner (posible error de carga)
- Trades de otros usuarios no cargan
- Badge en nav no desaparece tras leer trades

**Criterios:** Marketplace carga, sub-tabs funcionan, trades operativos

---

## M. DASHBOARD

**Qué debería verse:**
- Estadísticas globales de todos los usuarios
- Ranking de completitud
- Feed de actividad reciente
- Mis figuritas más buscadas / más disponibles

**Comportamiento:**
- [ ] Ranking carga (puede tardar 2-3s por RPC)
- [ ] El usuario actual aparece en el ranking
- [ ] Progreso propio visible con % correcto
- [ ] Feed de actividad con entradas recientes

**Errores a buscar:**
- Dashboard en blanco o spinner infinito (posible fallo de RPC)
- Ranking con 0 usuarios

**Criterios:** Dashboard carga datos reales de Supabase, ranking presente

---

## N. RESPONSIVE GENERAL

**En mobile (375px) — verificar en todas las pantallas:**

- [ ] No hay scroll horizontal en ninguna sección
- [ ] El header no desborda
- [ ] La nav principal scrollea horizontalmente (5 tabs)
- [ ] La sub-nav de Álbum scrollea (6 tabs)
- [ ] El calendario: filtros de fase scrollean, cards en 1 columna
- [ ] El Mercado no desborda
- [ ] Los modales (Exportar, Buscar, Perfil) están centrados y no cortados
- [ ] Los toasts de notificación aparecen en la parte inferior centrados

**En tablet (768px) — punto de quiebre crítico:**

- [ ] Calendario: cards de partido en 2 columnas (grid md:grid-cols-2)
- [ ] Header: labels de botones visibles (sm:inline)
- [ ] Sub-nav de Álbum: todos los tabs visibles sin scroll

---

## O. CONSOLA DE ERRORES — Chequeo Final

En DevTools → Console (todos los paneles, al menos 30 segundos de sesión):

- [ ] **Sin errores rojos** relacionados con Supabase o auth
- [ ] **Sin errores de hydration** de React (Warning: Text content did not match)
- [ ] **Sin 404** en recursos críticos (imágenes, fuentes)
- [ ] **Sin TypeError** de propiedades undefined

Errores aceptables:
- Warnings de Framer Motion sobre prop `any` cast (existían antes)
- Warnings de LF→CRLF de git (no afectan runtime)

---

## RESULTADO FINAL DE LA REVISIÓN

Completar después de la revisión:

| Sección | Desktop | Mobile | Notas |
|---------|---------|--------|-------|
| Header | ☐ | ☐ | |
| Nav Principal (5 tabs) | ☐ | ☐ | |
| Álbum Sub-nav | ☐ | ☐ | |
| Álbum → Intro | ☐ | ☐ | |
| Álbum → Equipos | ☐ | ☐ | |
| Álbum → Final | ☐ | ☐ | |
| Álbum → Coca-Cola | ☐ | ☐ | |
| Álbum → Extras | ☐ | ☐ | |
| Álbum → Stats | ☐ | ☐ | |
| Calendario | ☐ | ☐ | |
| Mercado | ☐ | ☐ | |
| Dashboard | ☐ | ☐ | |
| Consola errores | ☐ | — | |

**Revisado por:** ___________  
**Fecha:** ___________  
**¿Listo para integración de datos en vivo?** ☐ Sí / ☐ No — Razón: ___________
