# Sprint 5 — Roadmap de Expansión
**Fecha:** 2026-06-03  
**Estado:** Propuesta — pendiente de aprobación  
**Prerrequisito:** Sprint 4 desplegado ✅

---

## Contexto

La infraestructura de datos en tiempo real está completa y en producción (Sprints 1-4). Los datos de apifootball.com fluyen correctamente: scores, estados, minutos y eventos. El roadmap de Sprint 5 propone cinco líneas de expansión, ordenadas por impacto/esfuerzo.

---

## Opción 1: Timeline Expandible de Eventos

**Impacto:** Alto · **Esfuerzo:** Bajo-Medio · **Prioridad sugerida:** 1

### Descripción
Al hacer clic en una tarjeta de partido (WC o Amistoso), expandir un panel con el timeline completo de eventos del partido: todos los goles, tarjetas y sustituciones ordenados cronológicamente.

### Qué requiere
- `useLiveMatchDetail(fixtureId)` — hook que fetcha `/api/live/match/{id}` on demand
- `MatchDetailPanel` — componente de panel expandible (sin modal completo)
- Estado de `expandedMatchId` en CalendarView y FriendliesView
- Animación de apertura con Framer Motion (ya disponible)

### Lo que ya tenemos
- `/api/live/match/{id}` ya existe y retorna `events[]` con 23 tipos
- `LiveEventsBlock` ya existe (versión de 3 eventos) — extensión directa
- Tipos `LiveEvent` y `LiveEventType` ya definidos

### Lo que NO incluiría
- No alineaciones (no disponible en apifootball.com sin plan premium)
- No estadísticas avanzadas (posesión, tiros)
- No comentarios minuto a minuto

### Estimación
2-3 horas de implementación. Sin cambios de backend.

---

## Opción 2: Dashboard Live Avanzado

**Impacto:** Medio · **Esfuerzo:** Medio · **Prioridad sugerida:** 3

### Descripción
Expandir el bloque "Partidos en Vivo" del Dashboard con información adicional:
- Últimos 3 eventos del partido (goles/tarjetas) debajo de cada fila
- Indicador de fase del torneo (Amistoso / Fase de Grupos / etc.)
- Badge de competición (WC 2026 vs Friendly)
- Botón "Ver más" que navega al tab Calendario/Amistosos

### Qué requiere
- Modificar `LiveMatchRow` en `DashboardView.tsx`
- Ampliar `useLiveAll` para incluir `events[]` via detail fetch para matches live
- Agregar `source` label (WC vs Amistoso) al tipo que retorna `useLiveAll`

### Lo que ya tenemos
- `LiveMatchesBlock` y `useLiveAll` ya funcionando
- `LiveEventsBlock` reutilizable

### Estimación
3-4 horas. Posible impacto en rate limit (N detail fetches adicionales).

---

## Opción 3: Quiniela

**Impacto:** Muy Alto · **Esfuerzo:** Alto · **Prioridad sugerida:** 2

### Descripción
Sistema de predicciones para partidos del Mundial. El usuario predice resultado (local/empate/visitante) o marcador exacto antes de que empiece cada partido. Al finalizar, se compara con el resultado real vía la API live.

### Qué requiere
- **Supabase:** tabla `predictions(user_id, match_id, home_pred, away_pred, created_at)`
- **RLS:** usuario solo puede ver y crear sus propias predicciones
- **Lock:** predicciones cerradas al kickoff (comparar con `calendar-data.ts` timestamps)
- **Scoring:** 3 pts resultado correcto, 5 pts marcador exacto
- **LeaderBoard:** ranking de quiniela (Supabase query agregada)
- **UI:** QuinielaView — formulario por partido, tabla de resultados, ranking
- **Integración live:** actualizar resultados automáticamente via polling existente

### Dependencias críticas
- Aprobación de schema de Supabase (nueva tabla y políticas RLS)
- Definición de reglas de scoring
- Quiniela actualmente en la nav como placeholder — activar el tab

### Lo que ya tenemos
- Polling live para resultados automáticos
- Sistema de auth y usuarios (Supabase)
- Calendario completo de 104 partidos

### Estimación
8-12 horas (backend + UI + testing). Mayor esfuerzo del roadmap.

---

## Opción 4: Bracket Eliminatorio Dinámico

**Impacto:** Alto · **Esfuerzo:** Medio · **Prioridad sugerida:** 4

### Descripción
Visualización del bracket de la fase eliminatoria (R32 → Final) que se actualiza automáticamente conforme avanza el torneo. Muestra equipos clasificados, resultados, y partidos pendientes (TBD).

### Qué requiere
- `BracketView` — componente visual tipo árbol de eliminación
- Lógica de propagación: ganador de R32-X juega R16-Y
- Fetch de resultados eliminatorios vía `/api/live/wc` por fechas
- Handling de TBD (equipos no clasificados todavía)
- Datos estáticos del bracket structure de `calendar-data.ts` (ya existe `r32`, `r16`, `qf`, `sf`, `final`)

### Lo que ya tenemos
- 104 partidos en `calendar-data.ts` con IDs de fase
- Filtros por fase en CalendarView
- Datos live de resultados eliminatorios vía API

### Restricciones
- La API solo tiene datos de equipos clasificados (knockout fixtures se agregan conforme clasifican)
- No disponible hasta que empiece la fase de grupos (Jun 12+)

### Estimación
5-7 horas de UI. Sin cambios de backend.

---

## Opción 5: Alineaciones Básicas

**Impacto:** Medio · **Esfuerzo:** Medio-Alto · **Prioridad sugerida:** 5

### Descripción
Mostrar la alineación titular de cada equipo en partidos que ya empezaron o finalizaron. Solo 11 titulares y banco de suplentes — sin gráfico de campo (eso requeriría plan premium).

### Qué requiere
- Nuevo endpoint `/api/live/lineup/[id]` — Route Handler server-side
- Integración con apifootball.com: `?action=get_lineups&match_id={id}&APIkey={key}`
- `LineupBlock` — componente con dos columnas (local / visitante), nombre + número
- `useMatchLineup(fixtureId)` — hook con fetch on-demand (no polling)

### Restricciones críticas
- apifootball.com **no incluye alineaciones** en el plan gratuito/básico actual
- Requiere verificar si el plan actual cubre `get_lineups` endpoint
- Si no está cubierto, requeriría upgrade de plan (~$20-30/mes)

### Estimación
4-6 horas si el plan cubre alineaciones. Verificar cobertura antes de implementar.

---

## Resumen comparativo

| # | Opción | Impacto | Esfuerzo | Bloqueantes | Tiempo est. |
|---|--------|---------|----------|------------|-------------|
| 1 | Timeline expandible de eventos | Alto | Bajo | Ninguno | 2-3h |
| 2 | Dashboard Live avanzado | Medio | Medio | Ninguno | 3-4h |
| 3 | Quiniela | Muy Alto | Alto | Schema Supabase, reglas scoring | 8-12h |
| 4 | Bracket eliminatorio | Alto | Medio | Disponible Jun 28+ | 5-7h |
| 5 | Alineaciones básicas | Medio | Medio-Alto | Verificar cobertura API | 4-6h |

---

## Recomendación de priorización

### Fase inmediata (antes de Jun 11 — apertura del Mundial)
**→ Opción 1: Timeline expandible de eventos**  
Sin bloqueantes, bajo esfuerzo, impacto visible inmediato. Completa la experiencia live que los Sprints 1-4 dejaron lista.

### Fase apertura (Jun 11-15 — primeros partidos del grupo)
**→ Opción 3: Quiniela**  
El período entre la apertura y el final de la fase de grupos (Jun 11 - Jul 2) es la ventana de mayor engagement. Activar quiniela en este período maximiza el valor de la plataforma.

### Fase eliminatoria (después de Jun 28)
**→ Opción 4: Bracket eliminatorio**  
Se activa naturalmente cuando clasifican los primeros equipos. Los datos ya están en `calendar-data.ts`.

### Opcional
**→ Opción 2 y 5** según disponibilidad y feedback de usuarios.

---

## Qué NO se implementa en Sprint 5

- Heatmaps
- Estadísticas avanzadas (posesión, tiros, faltas)
- Comentarios minuto a minuto
- Notificaciones push
- Integración con redes sociales
- Fantasy football
