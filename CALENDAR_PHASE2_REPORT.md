# CALENDAR_PHASE2_REPORT.md — Fase 2 del Módulo Calendario
**Fecha:** 2026-06-02 | **Última revisión:** 2026-06-02 (ajuste fino — eliminación filtro CR) | **Build:** `✓ Compiled successfully` | **TypeScript:** 0 errores

---

## 1. Resumen Ejecutivo

| Indicador | Valor |
|-----------|-------|
| Build | ✅ `✓ Compiled successfully` |
| TypeScript | ✅ 0 errores |
| Bundle size página | **158 kB** (-1 kB tras eliminar filtro CR) |
| Archivos nuevos | `src/lib/calendar-data.ts` |
| Archivos modificados | `src/components/CalendarView.tsx` |
| Fixtures auditados | 104 — ver `CALENDAR_DATA_AUDIT.md` |
| Errores de datos corregidos | 9 (Rose Bowl → SoFi Stadium) |
| Backend / Supabase | ✅ Sin tocar |

---

## 2. Arquitectura Final — Capa de Datos Desacoplada

### Antes (Phase 1)

```
CalendarView.tsx
├── Types (inline)
├── Constants (inline)
├── MATCHES[] (200+ líneas inline)
├── daysUntil()
├── StatusBadge
├── TeamBlock
├── MatchCard
└── CalendarView (main component)
```

### Después (Phase 2)

```
src/lib/calendar-data.ts        ← NUEVA CAPA DE DATOS
├── Types: MatchStatus, Phase, GroupLetter, CalMatch, CalTeam
├── Constants: PHASE_LABELS, PHASE_SHORT, PHASE_ORDER, GROUPS
├── VENUES: las 15 sedes oficiales con metadatos
├── WC2026_MATCHES[]: 104 partidos (corregidos)
├── COSTA_RICA_CODE, CR_QUALIFIED
└── Utilities: searchMatches(), getTeamMatches(), getFavoriteMatches(), sortByDate(), groupByDate()

src/components/CalendarView.tsx ← SOLO PRESENTACIÓN
├── Imports desde calendar-data.ts
├── daysUntil() (helper de presentación)
├── StatusBadge (sub-component UI)
├── TeamBlock (sub-component UI)
├── MatchCard (sub-component UI)
├── SearchIcon, CloseIcon, StarIcon (icons)
└── CalendarView (main: estado, filtros, búsqueda, renderizado)
```

**Ventaja:** Cuando se integre la API de resultados en tiempo real, solo se modifica `calendar-data.ts` (o se reemplaza `WC2026_MATCHES` por una llamada a API). La UI permanece sin cambios.

---

## 3. Interfaz de Datos (`CalMatch`)

```typescript
export interface CalMatch {
  id: string
  date: string          // 'YYYY-MM-DD' ISO local — para sorting y agrupación
  time: string          // 'HH:MM' hora local del estadio
  timezone: string      // 'ET' | 'CT' | 'PT'
  stadium: string
  city: string
  home: CalTeam         // { code, name, score? }
  away: CalTeam         // { code, name, score? }
  group?: GroupLetter   // 'A'–'L', solo fase de grupos
  phase: Phase          // 'group'|'r32'|'r16'|'qf'|'sf'|'3rd'|'final'
  matchday?: 1 | 2 | 3  // solo fase de grupos
  status: MatchStatus   // 'upcoming'|'live'|'completed'|'postponed'
  minute?: number       // para integración LIVE futura
  // Preparados para Phase 3+:
  // lineupHome?: string[]
  // lineupAway?: string[]
  // events?: MatchEvent[]
}
```

---

## 4. Funciones de Utilidad Exportadas

| Función | Firma | Descripción |
|---------|-------|-------------|
| `searchMatches` | `(query: string, matches: CalMatch[]) → CalMatch[]` | Búsqueda por nombre, código, estadio o ciudad |
| `getTeamMatches` | `(code: string, matches: CalMatch[]) → CalMatch[]` | Todos los partidos de una selección |
| `getFavoriteMatches` | `(codes: string[], matches: CalMatch[]) → CalMatch[]` | Partidos de selecciones favoritas (OR logic) |
| `sortByDate` | `(matches: CalMatch[]) → CalMatch[]` | Ordena por fecha+hora ascendente, immutable |
| `groupByDate` | `(matches: CalMatch[]) → Map<string, CalMatch[]>` | Agrupa en Map ordenado por fecha ISO |

---

## 5. Estado de la Búsqueda y Filtros

### Flujo de estado en `CalendarView`

```
┌─────────────────────────────────────────────────────────────────┐
│  Estado del componente                                          │
│  ─────────────────────                                          │
│  searchQuery: string          ''                                │
│  crFilterActive: boolean      false                             │
│  showFavorites: boolean       false                             │
│  favoriteTeams: string[]      [] (preparado para Phase 3)      │
│  activePhase: Phase           'group'                           │
│  activeGroup: GroupLetter|'all' 'all'                          │
└─────────────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────┐
         │  isSearching = (query||cr||favs)│
         └────────────┬────────────────────┘
                      │
            ┌─────────▼──────────┐
         YES│  filteredMatches   │NO
            │  = búsqueda global │   filteredMatches
            │    sobre TODOS los │   = fase + grupo
            │    104 partidos    │   (comportamiento
            └────────────────────┘   original)
```

### Prioridad de filtros

1. **Búsqueda por texto** — aplica sobre todos los matches (OR entre campos)
2. **Favoritas** — OR sobre `favoriteTeams[]` codes (vacío hasta Phase 3)

> **Nota:** El filtro dedicado a Costa Rica fue eliminado en ajuste fino (2026-06-02). Costa Rica no clasificó al WC 2026 y no debe ocupar espacio visual en la interfaz. Los usuarios pueden buscar cualquier selección (incluyendo CRC) mediante la búsqueda libre; el sistema genérico de favoritas cubrirá el caso de "mis selecciones" en Phase 3.

### Comportamiento en modo búsqueda

- Phase tabs y Group filter se **ocultan** (AnimatePresence)
- Los resultados cruzan todas las fases (un "México" muestra grupos + eliminatorias)
- El contador "N partidos" aparece junto a los filtros activos
- Botón "Limpiar" aparece cuando Favoritas está activo
- Empty states diferenciados por razón (Favoritas / sin resultados / sin partidos)

---

## 6. Búsqueda — Índice y Rendimiento

### Campos indexados por `searchMatches()`

| Campo | Ejemplo | Búsquedas que captura |
|-------|---------|----------------------|
| `home.name` | "México" | Nombre en español |
| `away.name` | "Alemania" | Nombre en español |
| `home.code` | "MEX" | Código FIFA 3 letras |
| `away.code` | "GER" | Código FIFA 3 letras |
| `stadium` | "Estadio Azteca" | Nombre del estadio |
| `city` | "Ciudad de México" | Ciudad sede |

### Ejemplos de búsquedas exitosas

| Query | Resultado |
|-------|-----------|
| `"México"` | 6 partidos (3 jornadas × 1 partido/jornada + posibles knockout si clasifica) |
| `"azteca"` | Todos los partidos en Estadio Azteca (al menos 2 de MEX en grupos) |
| `"dallas"` | Todos los partidos en Dallas (AT&T Stadium) |
| `"arg"` | 3 partidos de Argentina en grupos |
| `"miami"` | Todos los partidos en Miami (Hard Rock Stadium) |
| `"brasil"` | 3 partidos de Brasil en grupos |
| `"Fra"` | 3 partidos de Francia (case-insensitive) |

### Rendimiento

- Corpus: 104 partidos, ~6 strings por partido indexados
- Algoritmo: `.filter()` lineal sobre array en memoria
- Sin índice pre-computado (innecesario para 104 elementos)
- Re-computa en cada keystroke con `useMemo`
- **Estimación:** < 1ms por búsqueda en cualquier dispositivo moderno

---

## 7. Cantidad de Partidos Indexados por Categoría

| Categoría | Cantidad |
|-----------|----------|
| **Fase de Grupos total** | 72 |
| · Grupo A (MEX, RSA, KOR, CZE) | 6 |
| · Grupo B (CAN, BIH, QAT, SUI) | 6 |
| · Grupo C (BRA, MAR, HAI, SCO) | 6 |
| · Grupo D (USA, PAR, AUS, TUR) | 6 |
| · Grupo E (GER, CUW, CIV, ECU) | 6 |
| · Grupo F (NED, JPN, SWE, TUN) | 6 |
| · Grupo G (BEL, EGY, IRN, NZL) | 6 |
| · Grupo H (ESP, CPV, KSA, URU) | 6 |
| · Grupo I (FRA, SEN, IRQ, NOR) | 6 |
| · Grupo J (ARG, ALG, AUT, JOR) | 6 |
| · Grupo K (POR, COD, UZB, COL) | 6 |
| · Grupo L (ENG, CRO, GHA, PAN) | 6 |
| **Ronda de 32** | 16 |
| **Octavos de Final** | 8 |
| **Cuartos de Final** | 4 |
| **Semifinales** | 2 |
| **Tercer Lugar** | 1 |
| **Gran Final** | 1 |
| **TOTAL** | **104** |

**Estadios únicos:** 15 (todos los venues oficiales FIFA 2026)  
**Ciudades únicas:** 15  
**Selecciones únicas en grupos:** 48  
**Timezones:** ET, CT, PT  

---

## 8. Funcionalidades de Phase 2

| Feature | Estado | Notas |
|---------|--------|-------|
| Data layer desacoplada | ✅ Implementado | `src/lib/calendar-data.ts` |
| Rose Bowl → SoFi Stadium fix | ✅ 9 instancias corregidas | Ver `CALENDAR_DATA_AUDIT.md` |
| Búsqueda por selección | ✅ Operativo | Búsqueda en `home.name`, `away.name`, `home.code`, `away.code` |
| Búsqueda por estadio | ✅ Operativo | Búsqueda en `stadium` |
| Búsqueda por ciudad | ✅ Operativo | Búsqueda en `city` |
| Filtro Costa Rica | ~~✅~~ **Eliminado** | CRC no clasificó; búsqueda libre lo cubre si fuese necesario |
| Filtro Favoritas | ✅ Infraestructura lista | UI preparada, gestión de favoritas en Phase 3 |
| Modo búsqueda (cross-phase) | ✅ Implementado | Phase filter se oculta, busca en los 104 partidos |
| Empty states diferenciados | ✅ 3 estados | Favoritas / Sin resultados / Sin partidos |
| Contador de resultados | ✅ Visible en modo búsqueda | |
| Botón "Limpiar" filtros | ✅ Implementado | Aparece cuando Favoritas está activo |

---

## 9. Recomendaciones para Phase 3 — Integración Live

### 9.1 Cambio de datos (mínimo impacto en UI)

```typescript
// Opción A — API REST (polling cada 60s)
async function fetchLiveMatches(): Promise<CalMatch[]> {
  const res = await fetch('https://api.fifa.com/v1/matches?tournament=2026')
  return res.json()
}

// En CalendarView.tsx: reemplazar WC2026_MATCHES por fetchLiveMatches()
// El componente ya acepta props: <CalendarView matches={liveMatches} />
```

```typescript
// Opción B — Supabase edge function + realtime
// supabase.channel('matches').on('postgres_changes', ...) -> setMatches()
```

### 9.2 Activar campos ya preparados en CalMatch

```typescript
// Cuando un partido esté LIVE:
{
  status: 'live',
  minute: 73,
  home: { code: 'BRA', name: 'Brasil', score: 2 },
  away: { code: 'ARG', name: 'Argentina', score: 1 },
}
// → CalendarView ya renderiza el marcador y el minuto sin cambios adicionales
```

### 9.3 Gestión de Selecciones Favoritas (Phase 3)

```typescript
// El estado favoriteTeams: string[] ya existe en CalendarView.
// Solo falta agregar persistencia y UI de gestión:

// 1. Persistir en localStorage:
const [favoriteTeams, setFavoriteTeams] = useLocalStorage<string[]>('fav-teams', [])

// 2. Permitir añadir desde MatchCard (click en estrella junto al equipo)
// 3. Panel de gestión en ProfileModal o página dedicada
```

### 9.4 Alineaciones y eventos

```typescript
// Ya hay comentarios en CalMatch:
// lineupHome?: string[]
// lineupAway?: string[]
// events?: MatchEvent[]

// Solo falta definir MatchEvent y añadir el panel de detalle de partido
```

---

## 10. Archivos Generados en Phase 2

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/lib/calendar-data.ts` | Código | Data layer: tipos, constantes, 104 fixtures, utilidades |
| `src/components/CalendarView.tsx` | Código | Componente UI actualizado (búsqueda, filtros, imports) |
| `CALENDAR_DATA_AUDIT.md` | Documentación | Auditoría de los 104 partidos |
| `CALENDAR_PHASE2_REPORT.md` | Documentación | Este archivo |

---

## 11. Sin Cambios En

| Módulo | Estado |
|--------|--------|
| `src/app/page.tsx` | ✅ Sin tocar |
| Álbum, Mercado, Dashboard | ✅ Sin tocar |
| Supabase, RLS, RPCs | ✅ Sin tocar |
| Backup / Restore | ✅ Sin tocar |
| Exportaciones PDF | ✅ Sin tocar |
| Diseño visual del calendario | ✅ Sin cambios (mismo look and feel) |
