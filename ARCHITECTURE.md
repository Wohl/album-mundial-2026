# 🏗️ Arquitectura de la Aplicación

## Descripción General

Álbum Mundial 2026 es una aplicación **Next.js 14** con arquitectura moderna que soporta:
- ✅ Funcionamiento offline con localStorage
- ☁️ Sincronización opcional con Supabase
- 🎨 UI reactiva y responsiva
- ⚡ Compilación optimizada para producción

## Estructura de Carpetas

```
src/
├── app/
│   ├── layout.tsx         # Layout principal con tema
│   ├── page.tsx           # Página de inicio
│   └── globals.css        # Estilos globales
│
├── components/            # Componentes React reutilizables
│   ├── StickerCard.tsx    # Tarjeta individual de figurita
│   ├── StickerGallery.tsx # Galería de figuritas
│   ├── ProgressBar.tsx    # Barra de progreso
│   ├── WelcomeModal.tsx   # Modal de bienvenida
│   └── StickerContextMenu.tsx # Menú contextual
│
├── hooks/                 # Hooks personalizados
│   ├── useSession.ts      # Gestión de sesión
│   └── useStickers.ts     # Gestión de figuritas
│
├── lib/                   # Utilidades y funciones
│   ├── supabase.ts        # Cliente de Supabase
│   ├── localStorage.ts    # Funciones de localStorage
│   └── stickers.ts        # Funciones de datos de figuritas
│
├── services/              # Servicios de lógica de negocios
│   ├── sessionService.ts  # Gestión de sesiones
│   └── stickerService.ts  # Gestión de figuritas
│
└── types/                 # Definiciones de tipos TypeScript
    └── index.ts           # Tipos principales
```

## Componentes Principales

### 1. **StickerCard.tsx**
Tarjeta visual de una figurita individual
- Muestra ID, nombre, equipo
- Indica estado: tenida, repetida, faltante
- Efecto shimmer para foils
- Responsive y animado

### 2. **StickerGallery.tsx**
Grid de figuritas organizadas
- Soporta diferentes vistas (intro, equipos, todas)
- Integración con estados del usuario
- Clicable para actualizar estado

### 3. **ProgressBar.tsx**
Indicador de progreso visual
- Barra de progreso animada
- Estadísticas en grid
- Cálculo en tiempo real

### 4. **WelcomeModal.tsx**
Modal de entrada
- Solicita nombre del usuario
- Crea sesión nueva
- Validación de entrada

### 5. **StickerContextMenu.tsx**
Menú contextual para cambiar estado
- Animación suave
- 3 opciones: Tengo, Repetida, No tengo
- Se cierra al hacer clic fuera

## Hooks Personalizados

### `useSession()`
```typescript
const { session, loading, createSession } = useSession()
```
- Inicializa sesión del usuario
- Gestiona localStorage automáticamente
- Sincroniza con Supabase si está configurado

### `useStickers(sessionId, totalStickers)`
```typescript
const { stickers, progress, loading, updateSticker, deleteSticker } = useStickers(sessionId, 960)
```
- Carga figuritas del usuario
- Calcula progreso
- Actualiza estado individual
- Persistencia automática

## Servicios

### `sessionService`
- `getOrCreateSession()`: Crea o recupera sesión
- `updateSession()`: Actualiza timestamp
- `getSession()`: Obtiene datos de sesión

### `stickerService`
- `getUserStickers()`: Obtiene todas las figuritas del usuario
- `updateStickerStatus()`: Cambia estado de figurita
- `deleteSticker()`: Elimina figurita
- `calculateProgress()`: Calcula estadísticas

## Flujo de Datos

```
┌─────────────────┐
│  WelcomeModal   │ ← Usuario ingresa nombre
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  useSession.createSession()     │ → localStorage/Supabase
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────┐
│  useStickers()       │ ← Carga figuritas del usuario
└────────┬─────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  StickerGallery + StickerContextMenu   │
│  → Usuario interactúa                  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌────────────────────────────┐
│  updateSticker()           │ → localStorage/Supabase
└────────┬─────────────────────┘
         │
         ▼
┌────────────────────────────┐
│  Re-render automático      │
│  + ProgressBar actualizado │
└────────────────────────────┘
```

## Modos de Operación

### 🔴 Offline Mode (por defecto)
```typescript
isOfflineMode = !supabaseUrl || !supabaseKey
```
- Usa localStorage
- Datos guardados localmente
- Funciona sin internet

### 🟢 Supabase Mode
Cuando hay credenciales válidas en `.env.local`:
- Sincroniza datos con servidor
- RLS (Row Level Security) automático
- Realtime updates opcionales

## Tipos Principales

```typescript
// Sesión del usuario
interface Session {
  id: string
  display_name: string
  created_at: string
  last_seen: string
}

// Estado de una figurita
interface StickerState {
  id: string
  session_id: string
  sticker_key: string
  status: 'missing' | 'owned' | 'repeated'
  repeat_count: number
  updated_at: string
}

// Definición de figurita
interface Sticker {
  id: string
  name: string
  team?: string
  type: 'regular' | 'intro' | 'special'
  foil: boolean
}

// Progreso del usuario
interface UserProgress {
  total: number
  owned: number
  missing: number
  repeated: number
  percentComplete: number
}
```

## Cálculo de Figuritas

**Total: 960 figuritas**

- **Introducción**: 20 (todas foil)
  - Panini Logo, Emblemas, Mascotas, Históricas

- **Equipos**: 48 × 20 = 960
  - Por equipo:
    - Índice 0: Escudo del equipo (Foil)
    - Índices 1-10: Primeros 10 jugadores
    - Índice 11: Foto del equipo (especial)
    - Índices 12-19: Últimos 8 jugadores

## Estilos y Temas

### Paleta de Colores
```css
--dark: #090D1A          /* Fondo principal */
--surface: #0F1625       /* Superficies */
--surface2: #161E30      /* Superficies secundarias */
--surface3: #1C2640      /* Bordes */
--gold: #C9A227          /* Dorado principal */
--gold2: #F0C940         /* Dorado secundario */
```

### Animaciones
- `shimmer`: Efecto brillante en foils (2s)
- `pop-in`: Entrada suave de elementos (0.2s)
- Transiciones suaves en hover

## Optimizaciones

✅ Lazy loading de imágenes
✅ Caché de localStorage
✅ Memoización de componentes
✅ Código splitting automático de Next.js
✅ Estilos críticos inline
✅ Compresión de assets

## Seguridad

- RLS en Supabase (todos pueden leer, solo escribir lo propio)
- No hay autenticación real (simplemente por nombre)
- Datos guardados localmente en navegador
- CORS habilitado para Supabase

---

**Documentación completa en README.md y QUICKSTART.md**
