# REPOSITORY_AUDIT.md — Álbum Mundial 2026
**Generado:** 2026-06-02 | **Auditor:** Claude Sonnet 4.6

---

## 1. Estado Local vs Remoto

| Indicador | Valor |
|-----------|-------|
| **Rama actual** | `main` |
| **Ahead of origin/main** | **2 commits** |
| **Working tree** | Limpio (sin cambios en archivos rastreados) |
| **Archivos sin trackear** | 9 (no afectan código activo) |
| **Conflictos** | Ninguno |

---

## 2. Commits Locales No Pusheados (2)

| Hash | Mensaje |
|------|---------|
| `539668a` | `feat: weekly backup automation + full restore system` |
| `533a0c5` | `feat: add local backup system for Supabase data` |

### Archivos afectados (no pusheados aún):
```
.env.backup.example          — config de variables para backup
.env.restore.example         — config de variables para restore
.gitignore                   — 6 líneas añadidas (backup artifacts)
BACKUP_PLAN.md               — documentación del sistema
BACKUP_RESULT.md             — resultado de última ejecución
POST_DEPLOY_VALIDATION.md    — guía de validación post-deploy
RESTORE_GUIDE.md             — guía de restauración
package.json                 — scripts: backup, backup:verify, restore...
scripts/backup.mjs           — descarga toda la data Supabase → JSON
scripts/restore_backup.mjs   — restaura desde backup local
scripts/schedule_backup.ps1  — tarea programada semanal (Windows)
```

---

## 3. Archivos Sin Trackear (No Committeados)

| Archivo | Tipo | Impacto |
|---------|------|---------|
| `ALEMANHA_preview_p1/p2.png` | Preview PDF | Ninguno en runtime |
| `ARGENTINA_preview_p1.png` | Preview PDF | Ninguno en runtime |
| `VECTORES/` | Directorio SVGs | Ninguno en runtime |
| `public/2026_FIFA_World_Cup_emblem.svg.png` | Imagen pública | Ya importada en favicon |
| `public/ChatGPT Image...` | Imagen AI | Sin uso actual |
| `scripts/_full_validation.mjs` | Script borrador | Sin impacto |
| `scripts/_run_functional_validation.mjs` | Script borrador | Sin impacto |
| `validation_results.json` | JSON resultados | Sin impacto |

---

## 4. Historial de Commits Recientes (últimos 20)

```
539668a feat: weekly backup automation + full restore system
533a0c5 feat: add local backup system for Supabase data
5e31a43 docs: add API_KEY_AUDIT.md and prod validation results
5d2fe4d fix: use ANON JWT key first; add fallback to all supabase utils
fa876c2 chore: merge remote marketplace/PDF changes + resolve package-lock conflict
c9ad70c chore: migrate to new Supabase project (hngymqusifirjurlyacv)
b4e8ec1 Marketplace redesign: reservas, bypass animación y aceptación masiva
3aa7318 Refactor modo intercambios: lista integrada única con colores diferenciadores
77f6a87 Fix: FWC/CC special sections siempre muestran todos los stickers
8814d74 Mejorar presentación visual de celdas en exportación PDF
dba8977 Reemplazar exportación de texto por PDF: tablas 4x5 por equipo, diseño premium mundial
8c49f6e Fix botón Exportar: estilo glassmorphism dorado + visible desde sm
6edebbb Tres mejoras: entrada rápida, fotos correctas y botón de exportación
...
```

---

## 5. Arquitectura Actual

### Stack Técnico
| Tecnología | Versión | Rol |
|------------|---------|-----|
| Next.js | 14.2.3 | Framework (App Router) |
| React | 18.3.1 | UI |
| Supabase | SSR 0.10.3 | Auth + DB |
| Tailwind CSS | 3.4.3 | Estilos |
| Framer Motion | 11.2.10 | Animaciones |
| jsPDF | 4.2.1 | Exportación PDF |
| flag-icons | 7.5.0 | Banderas nacionales |

### Estructura de Directorios
```
src/
├── app/
│   ├── page.tsx          ← Componente principal (toda la lógica UI)
│   ├── layout.tsx        ← Root layout + fuentes
│   └── globals.css       ← Estilos globales + variables CSS
├── components/           ← 18 componentes React
├── hooks/                ← useAuth, useStickers, useTrades, usePacks
├── lib/                  ← stickers.ts, supabase.ts, teamFlags.ts
├── services/             ← stickerService, tradeService, packService, dashboardService
├── types/                ← TypeScript interfaces
└── stickers.ts           ← Data oficial: 48 equipos × 20 figuritas = 994 stickers
```

### Módulos Activos
| Módulo | Estado | Componente/Hook |
|--------|--------|-----------------|
| Autenticación (sign-in/up/recovery) | ✅ Activo | `useAuth.ts` + `AuthModal` |
| Figuritas CRUD | ✅ Activo | `useStickers.ts` + `StickerGallery` |
| Marketplace / Intercambios | ✅ Activo | `useTrades.ts` + `MarketplaceView` |
| Sobres (packs) | ✅ Activo | `usePacks.ts` |
| Dashboard Global | ✅ Activo | `DashboardView` + RPC aggregates |
| Exportación PDF | ✅ Activo | `ExportModal` + jsPDF |
| Búsqueda Global (Ctrl+K) | ✅ Activo | `StickerSearch` |
| Entrada Masiva | ✅ Activo | `BulkEntryModal` |
| Notificaciones | ✅ Activo | `NotificationsPanel` |
| Backup local | ✅ Local (no pusheado) | `scripts/backup.mjs` |
| Restore | ✅ Local (no pusheado) | `scripts/restore_backup.mjs` |

---

## 6. Navegación Actual

La navegación actual está implementada como pestañas (`tabs`) dentro de `<main>`, **no dentro del header**:

```typescript
type Tab = 'intro' | 'equipos' | 'final' | 'cocacola' | 'repetidas' | 'stats' | 'dashboard' | 'market'
// 8 tabs en línea horizontal — ocupa mucho espacio horizontal
```

**Header actual:** Logo + botones de acción (búsqueda, entrada rápida, exportar, notificaciones, usuario, logout)

---

## 7. Supabase / Backend

| Elemento | Detalle |
|----------|---------|
| Proyecto | `hngymqusifirjurlyacv` |
| Auth | Supabase Auth v2 (migrado mayo 2026) |
| Tabla principal | `sticker_states` con RLS estricto |
| Tabla perfiles | `profiles` (display_name, avatar) |
| RPC activas | `accept_trade`, aggregados para dashboard |
| Middleware | `src/middleware.ts` para rutas protegidas |

---

## 8. Dependencias Actuales

Sin cambios pendientes. El `package.json` local difiere del remote únicamente en los scripts de backup (añadidos en los 2 commits no pusheados). No hay actualizaciones de dependencias ni conflictos de versiones.

---

## 9. Análisis de Impacto — Cambios Propuestos

### Navegación nueva (no afecta backend)
- **Impacto:** Solo `src/app/page.tsx` + nuevo `CalendarView.tsx`
- **Riesgo:** Bajo. Cambio en tipos TypeScript y estado de navegación.
- **Sin impacto en:** Supabase, hooks, RLS, trades, stickers, PDF, autenticación.

### Módulo Calendario
- **Impacto:** Nuevo componente (`CalendarView.tsx`) con data estática.
- **Riesgo:** Mínimo. Sin conexiones a APIs externas ni cambios en DB.
- **Preparado para:** Integración futura con API de resultados en tiempo real.

---

## 10. Conclusión

| Aspecto | Estado |
|---------|--------|
| Conflictos de merge | ✅ Ninguno |
| Código sin commitear | ✅ Ninguno (solo archivos nuevos sin trackear) |
| Sincronización remota | ⚠️ 2 commits locales pendientes de push (backup system) |
| Bloqueadores para implementar | ✅ Ninguno |
| Estado del working tree | ✅ Limpio |

**El repositorio está en estado estable y limpio para proceder con la implementación de la nueva navegación y el módulo Calendario.** Los 2 commits no pusheados son el sistema de backup — funcionalidad completamente independiente de los cambios propuestos.
