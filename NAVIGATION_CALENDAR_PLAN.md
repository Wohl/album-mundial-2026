# NAVIGATION_CALENDAR_PLAN.md — Álbum Mundial 2026
**Fecha:** 2026-06-02

---

## 1. Estructura de Navegación Propuesta

### Antes (8 tabs planos en main)
```
[intro] [equipos] [final] [coca-cola] [extras] [stats] [dashboard] [market]
```

### Después (2 niveles)
```
NAV PRINCIPAL:
[Álbum ★] [Calendario] [Quiniela 🔒] [Mercado] [Dashboard]

SUB-NAV (solo cuando Álbum activo):
Sección: [Intro] [Equipos] [Final] [Coca-Cola] [Extras] [Stats]
```

---

## 2. Nuevos Tipos TypeScript

```typescript
// Reemplaza: type Tab = 'intro' | 'equipos' | 'final' | 'cocacola' | 'repetidas' | 'stats' | 'dashboard' | 'market'

type MainTab = 'album' | 'calendario' | 'quiniela' | 'mercado' | 'dashboard'
type AlbumTab = 'intro' | 'equipos' | 'final' | 'cocacola' | 'repetidas' | 'stats'
```

---

## 3. Cambios de Estado

```typescript
// Antes:
const [activeTab, setActiveTab] = useState<Tab>('equipos')

// Después:
const [activeMain, setActiveMain] = useState<MainTab>('album')
const [activeAlbum, setActiveAlbum] = useState<AlbumTab>('equipos')
```

---

## 4. Componentes Afectados

| Componente | Tipo de cambio | Descripción |
|------------|---------------|-------------|
| `src/app/page.tsx` | Modificación | Nuevo tipo, estado, navegación, content routing |
| `src/components/CalendarView.tsx` | Nuevo | Módulo calendario completo |
| `src/app/globals.css` | Modificación | Header más ligero, nuevas clases nav |
| Resto de componentes | Sin cambio | Toda la lógica de stickers, trades, etc. se preserva |

---

## 5. Mapa de Renderizado de Contenido

```typescript
activeMain === 'album'      → Sub-nav + contenido álbum
  activeAlbum === 'intro'   → <StickerGallery intro />
  activeAlbum === 'equipos' → <TeamOverview /> o <StickerGallery equipo />
  activeAlbum === 'final'   → <StickerGallery final />
  activeAlbum === 'cocacola'→ <StickerGallery coca-cola />
  activeAlbum === 'repetidas'→ <StickerGallery repeated />
  activeAlbum === 'stats'   → <StatsPanel />

activeMain === 'calendario' → <CalendarView />
activeMain === 'quiniela'   → Panel "Próximamente" (deshabilitado)
activeMain === 'mercado'    → <MarketplaceView />
activeMain === 'dashboard'  → <DashboardView />
```

---

## 6. Handlers Actualizados

```typescript
// Búsqueda global (Ctrl+K navega a pestaña de álbum)
const handleSearchNavigate = (tab: 'intro'|'equipos'|'final'|'cocacola', teamCode?: string) => {
  setActiveMain('album')
  setActiveAlbum(tab)
  if (tab === 'equipos' && teamCode) setSelectedTeam(teamCode)
}

// Toast de trade → va a Mercado
onClick={() => setActiveMain('mercado')

// Progress bar → solo en álbum y no en stats
{activeMain === 'album' && activeAlbum !== 'stats' && <ProgressBar />}
```

---

## 7. Diseño Visual — Barra Principal

### Header (mejoras)
```
Actual:  rgba(8,17,32,0.92) — muy opaco, pesado
Nuevo:   linear-gradient(180deg, rgba(12,22,40,0.97) 0%, rgba(8,17,32,0.92) 100%)
         + borderBottom: 1px solid rgba(56,73,105,0.25)
         + backdropFilter: blur(24px) saturate(200%)
         + boxShadow mejorado con menos opacity en blur externo
```

### Nav Principal (5 tabs)
```
Inactivo:  bg rgba(16,28,48,0.7) | borde rgba(42,60,90,0.5) | texto surface4
Hover:     borde gold/30 | texto humo | glow suave gold
Activo:    bg linear-gradient(135deg, #F5C542, #FFD700) | texto dark | shadow dorado
Tamaño:    px-5 py-2.5 | text-sm font-display uppercase tracking-widest
```

### Quiniela (deshabilitado)
```
opacity-40 | cursor-not-allowed | badge "Próximamente" rojo/naranja
```

### Badge Mercado
```
Badge rojo absoluto arriba-derecha con conteo de trades pendientes
```

### Sub-nav Álbum (6 tabs)
```
Inactivo:  bg rgba(12,22,38,0.6) | borde rgba(35,52,80,0.5) | texto surface4
Activo:    borde gold/30 | texto gold | bg rgba(245,197,66,0.08)
Tamaño:    px-3 py-1.5 | text-xs tracking-wide
Label:     "SECCIÓN" prefix en gris ultrapequeño
```

---

## 8. Módulo Calendario — Arquitectura

### Estructura del Componente
```
CalendarView
├── PhaseFilterBar (Grupos | Ronda 32 | Octavos | Cuartos | Semis | Final)
├── GroupFilterBar (A–L, solo en fase de grupos)
├── MatchesByDateSection
│   ├── DateHeader (lun 11 jun 2026)
│   └── MatchCardGrid
│       └── MatchCard ×N
└── EmptyState (si no hay partidos en esa fase/grupo)
```

### MatchCard — Campos Mostrados
| Campo | Descripción | Fuente |
|-------|-------------|--------|
| `date` | Fecha del partido | Static fixture data |
| `time` | Hora local del estadio | Static fixture data |
| `timezone` | ET / CT / MT / PT | Static fixture data |
| `stadium` | Nombre del estadio | Static fixture data |
| `city` | Ciudad sede | Static fixture data |
| `home` | Selección local (código + nombre) | Static fixture data |
| `away` | Selección visitante (código + nombre) | Static fixture data |
| `group` | Grupo (A–L) si aplica | Static fixture data |
| `phase` | Fase del torneo | Static fixture data |
| `matchday` | Jornada 1/2/3 | Static fixture data |
| `status` | upcoming / live / completed / postponed | Static (upcoming) |
| `score` | Marcador (undefined hasta integración live) | Preparado |
| `minute` | Minuto actual si LIVE (undefined por ahora) | Preparado |

### Tipos TypeScript del Calendario
```typescript
type MatchStatus = 'upcoming' | 'live' | 'completed' | 'postponed'
type Phase = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
type GroupLetter = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'

interface CalMatch {
  id: string
  date: string          // 'YYYY-MM-DD' — para sorting y agrupación
  time: string          // 'HH:MM' — hora local del estadio
  timezone: string      // 'ET' | 'CT' | 'MT' | 'PT'
  stadium: string
  city: string
  home: { code: string; name: string; score?: number }
  away: { code: string; name: string; score?: number }
  group?: GroupLetter
  phase: Phase
  matchday?: 1 | 2 | 3
  status: MatchStatus
  minute?: number       // para integración futura LIVE
}
```

### Preparado para Integración Futura
- Los tipos ya incluyen `score`, `minute`, y `status: 'live'` / `'completed'`
- La arquitectura del componente separa **datos** de **presentación**
- `MATCHES` array puede ser reemplazado por una llamada a API sin rediseño
- El componente acepta props opcionales `matches?: CalMatch[]` para override externo
- Status badge ya maneja los 4 estados: upcoming, live, completed, postponed

---

## 9. Calendario — Sedes del Mundial 2026

| País | Ciudad | Estadio |
|------|--------|---------|
| 🇺🇸 USA | Nueva York/NJ | MetLife Stadium |
| 🇺🇸 USA | Los Ángeles | SoFi Stadium / Rose Bowl |
| 🇺🇸 USA | Dallas | AT&T Stadium |
| 🇺🇸 USA | San Francisco | Levi's Stadium |
| 🇺🇸 USA | Miami | Hard Rock Stadium |
| 🇺🇸 USA | Atlanta | Mercedes-Benz Stadium |
| 🇺🇸 USA | Seattle | Lumen Field |
| 🇺🇸 USA | Kansas City | Arrowhead Stadium |
| 🇺🇸 USA | Houston | NRG Stadium |
| 🇺🇸 USA | Philadelphia | Lincoln Financial Field |
| 🇨🇦 Canadá | Vancouver | BC Place |
| 🇨🇦 Canadá | Toronto | BMO Field |
| 🇲🇽 México | Ciudad de México | Estadio Azteca |
| 🇲🇽 México | Guadalajara | Estadio Akron |
| 🇲🇽 México | Monterrey | Estadio BBVA |

---

## 10. Grupos WC 2026 (en el Álbum)

| Grupo | Equipos |
|-------|---------|
| A | México, Sudáfrica, Rep. de Corea, Czechia |
| B | Canadá, Bosnia-Herz., Qatar, Suiza |
| C | Brasil, Marruecos, Haití, Escocia |
| D | Estados Unidos, Paraguay, Australia, Turquía |
| E | Alemania, Curazao, Costa de Marfil, Ecuador |
| F | Países Bajos, Japón, Suecia, Túnez |
| G | Bélgica, Egipto, Irán, Nueva Zelanda |
| H | España, Cabo Verde, Arabia Saudí, Uruguay |
| I | Francia, Senegal, Iraq, Noruega |
| J | Argentina, Argelia, Austria, Jordania |
| K | Portugal, Congo DR, Uzbekistán, Colombia |
| L | Inglaterra, Croacia, Ghana, Panamá |

---

## 11. Impacto en UX

### Mejoras
- **Reducción visual:** De 8 tabs a 5 en la nav principal → menos saturación
- **Jerarquía clara:** Álbum → sub-sección vs todo al mismo nivel
- **Escalabilidad:** Nuevos módulos (Quiniela, futuras secciones) no saturan la nav
- **Contexto:** Usuario siempre sabe dónde está (sección principal + subsección)
- **Mercado y Dashboard:** Ahora son ciudadanos de primera clase en nav principal

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Usuario no encuentra sub-nav álbum | Media | Label "Sección:" + animación de entrada |
| Pérdida de pestaña activa al cambiar sección | Baja | `activeAlbum` persiste hasta refresco |
| Quiniela deshabilitada genera confusión | Baja | Badge "Próximamente" + cursor disabled |
| Regresión en búsqueda global (Ctrl+K) | Baja | `handleSearchNavigate` actualizado para setActiveMain('album') |

---

## 12. Estrategia de Migración

1. **Paso 1 — Tipos:** Cambiar `Tab` → `MainTab` + `AlbumTab`
2. **Paso 2 — Estado:** Reemplazar `activeTab` → `activeMain` + `activeAlbum`
3. **Paso 3 — Handlers:** Actualizar search, toast click, selectedTeam reset
4. **Paso 4 — Nav rendering:** Reemplazar tab bar actual por nav principal + sub-nav condicional
5. **Paso 5 — Content routing:** Actualizar switch de contenido para nuevo esquema
6. **Paso 6 — CalendarView:** Crear componente, importar, mostrar cuando `activeMain === 'calendario'`
7. **Paso 7 — CSS:** Mejorar header, añadir estilos para new nav

---

## 13. Validaciones Pre-Implementación

- [x] Repositorio limpio sin conflictos → ✅ Confirmado en REPOSITORY_AUDIT.md
- [x] Todos los componentes existentes identificados → ✅ (18 componentes en `src/components/`)
- [x] Todos los hooks identificados → ✅ (useAuth, useStickers, useTrades, usePacks)
- [x] Tipos existentes revisados → ✅ Tab type en línea 35 de page.tsx
- [x] Rutas de búsqueda global revisadas → ✅ `handleSearchNavigate` en línea 143
- [x] Toast de trade revisado → ✅ `onClick={() => setActiveTab('market')}` en línea 661
- [x] ProgressBar condition revisada → ✅ línea 492 de page.tsx
- [x] flag-icons disponible para CalendarView → ✅ `TeamFlag` component reutilizable
- [x] Teams y grupos identificados → ✅ 48 equipos, grupos A-L

---

**Conclusión:** Plan validado. Implementación puede proceder con riesgo bajo. Todos los componentes backend, auth, RLS, RPCs, marketplace y exportaciones PDF permanecen intactos.
