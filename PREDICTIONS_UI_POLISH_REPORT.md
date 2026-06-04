# Predictions UI Polish Report
**Fecha:** 2026-06-03  
**Archivo modificado:** `src/components/PredictionsView.tsx`  
**Estado:** ✅ Completo — TypeScript 0 errores, build 176 kB

---

## Resumen de problemas y correcciones

### 1. Desalineación de los inputs de marcador

**Causa raíz:**  
Los inputs usaban `type="number"`, que en WebKit (Chrome, Safari) renderiza spinners ocultos y aplica padding interno propio que rompe el centrado vertical. La propiedad `MozAppearance: 'textfield'` solo suprimía el spinner en Firefox — en Chrome/Safari el texto seguía descentrado.

Adicionalmente, `w-10 h-10` (40 × 40 px) era demasiado pequeño para que la fuente grande (`text-lg`, 18px) se centrara visualmente con su `line-height` por defecto.

**Corrección:**
```
ANTES:
  type="number"
  MozAppearance: 'textfield'
  w-10 h-10 (40px)
  text-lg (18px)
  sin control de lineHeight ni padding

DESPUÉS:
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  width: '48px', height: '48px'
  fontSize: '22px'
  textAlign: 'center'
  lineHeight: '1'
  padding: '0'
```

Con `type="text"` el navegador no añade ningún elemento interno propio. Al fijar `lineHeight: '1'` y `padding: '0'`, el texto queda perfectamente centrado en el cuadro. El tamaño aumentó de 40 px a 48 px, mejorando también el área de toque en mobile.

La función `sanitizeScore` reemplaza a `clampScore` para el nuevo tipo texto:
```typescript
function sanitizeScore(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 2)
  if (!digits) return ''
  return String(Math.min(parseInt(digits, 10), 30))
}
```
- Elimina caracteres no numéricos
- Limita a 2 dígitos máximo
- Clampea en 30 goles

---

### 2. Horarios inconsistentes (CT / ET / PT)

**Causa raíz:**  
El campo `match.timezone` de `calendar-data.ts` almacena la zona horaria del estadio (CT para partidos en México/Dallas, ET para la costa este, PT para la costa oeste). La UI los mostraba directamente como `{match.time} {match.timezone}`, mezclando CT, ET y PT dentro de la misma pantalla.

**Corrección:**  
Nueva función `formatLocalKickoff` que convierte la hora del estadio a la hora local del navegador del usuario:

```typescript
function formatLocalKickoff(date: string, time: string, timezone: string): string {
  try {
    const utcDate = toUTC(date, time, timezone)   // de kickoff.ts
    return utcDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return `${time} ${timezone}`   // fallback si falla la conversión
  }
}
```

Reutiliza `toUTC()` de `src/lib/quiniela/kickoff.ts` (ya implementada con offset table completa).

**Resultado:**
- Todos los horarios aparecen en la zona horaria del usuario (ej. "19:00" si está en España)
- El badge "hora local" bajo el horario comunica la conversión
- El subtítulo del header dice "Horarios convertidos a tu hora local"
- Fallback al formato original si el navegador no soporta `toLocaleTimeString`

---

### 3. Nombres truncados

**Causa raíz:**  
Los nombres de equipo usaban `text-sm truncate` en un `flex-1 min-w-0` horizontal. Con el espacio que ocupan los dos inputs (2 × 48 px + gap + dash ≈ 120 px) en el centro, los equipos en los extremos tenían muy poco espacio y los nombres largos se cortaban:
- "Bosnia y Herzegovina" → "Bosnia-Herz."
- "Estados Unidos" → "Estados Uni..."

**Corrección:**  
Rediseño completo del bloque de equipo: layout vertical (bandera arriba, nombre centrado abajo) con `maxWidth: '96px'` y **sin `truncate`**:

```tsx
ANTES:
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <TeamFlag className="text-2xl shrink-0" />
    <span className="text-sm font-bold truncate">
      {match.home.name}          ← cortado!
    </span>
  </div>

DESPUÉS:
  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
    <TeamFlag className="text-3xl shrink-0" />
    <span className="text-xs font-bold text-center leading-snug"
      style={{ maxWidth: '96px' }}>
      {match.home.name}          ← se envuelve en 2 líneas si es necesario
    </span>
  </div>
```

Con `leading-snug` y `text-center`, nombres como "Bosnia y Herzegovina" o "Estados Unidos" se envuelven naturalmente en 2 líneas sin truncado.

---

### 4. Inputs confundibles con marcadores reales

**Causa raíz:**  
Los inputs vacíos con placeholder "0" se veían idénticos a un marcador real `0 – 0`, sin contexto que indicara que el usuario debía ingresar una predicción.

**Corrección:**  
- Agregada etiqueta "Tu predicción" en azul claro (`rgba(125,211,252,0.5)`) **encima** de los inputs cuando no hay bloqueo
- Placeholder cambiado de `"0"` a `"–"` para indicar campo vacío (no cero)
- En estado bloqueado, el label "Tu predicción" aparece en gris sobre el score guardado

```
ANTES:     [0] – [0]        (ambiguo)
DESPUÉS:   Tu predicción    ← label contextual
           [–] – [–]        ← placeholder neutral
```

---

### 5. Estados visuales del botón

**Causa raíz:**  
El botón tenía un solo estilo con `disabled` cuando no había cambios, luciendo permanentemente apagado incluso cuando había predicción guardada.

**Corrección:**  
Máquina de estados completa con tres vistas mutuamente excluyentes (animadas con `AnimatePresence`):

| Estado | Vista | Estilo |
|--------|-------|--------|
| `justSaved` (1.8s) | `✓ Predicción guardada` | Verde, borde verde |
| `prediction && !hasChanges` | `🎯 2-1 guardado` + botón "Borrar" | Azul claro, sin botón grande |
| `hasChanges` o `!prediction` | `Guardar predicción` / `↑ Actualizar` | Gold cuando hay cambios, azul cuando no |

```
Sin predicción, inputs vacíos: botón dimmed + "Ingresá un marcador"
Con valores nuevos: botón gold highlight + "Guardar predicción"
Guardado, sin cambios: indicador "🎯 X-Y guardado" + "Borrar"
Con cambios vs guardado: botón gold + "↑ Actualizar predicción"
Justo guardado (1.8s): banner verde "✓ Predicción guardada"
```

---

### 6. Feedback post-guardar

**Antes:** banner "✓ Guardado" por 1.8 segundos (genérico)

**Después:** tres niveles de feedback:
1. El botón grande se reemplaza por el banner verde animado: `✓ Predicción guardada`
2. Después de 1.8s, aparece el indicador en reposo: `🎯 2-1 guardado` con el marcador real
3. El borde de la tarjeta cambia a azul `rgba(56,189,248,0.28)` cuando hay predicción guardada

---

### 7. Estado bloqueado

**Antes:** inputs `disabled`, texto pequeño "Sin predicción guardada para este partido"

**Después:** badge prominente en el header:
```
[GRUPO A · J1]     [🔒 Predicciones cerradas]
```
- Badge con icono de candado SVG + texto
- Fondo oscuro + borde sutil
- El centro de la tarjeta muestra el score guardado en lectura (`2 – 1`) o "Sin predicción" si no se guardó
- No se renderizan inputs ni botones

---

### 8. Preparación para Predicciones Sociales

Agregado `CommunityPredictionsPanel` como componente stub totalmente funcional, oculto cuando `data === undefined`:

```typescript
interface CommunityData {
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  totalPredictions: number
}

function CommunityPredictionsPanel({ match, data }: {
  match: CalMatch
  data?: CommunityData
}) {
  if (!data) return null   // oculto hasta Sprint C
  // Renderiza barras de distribución de predicciones
}
```

En Sprint C, solo hace falta:
1. Crear `GET /api/predictions/match/[id]` que retorne porcentajes
2. Pasar `data={communityData}` al componente
3. Las barras, label "👥 Predicciones · N usuarios" y el layout ya existen

El componente se posiciona **dentro de la tarjeta, al final, solo cuando `isLocked`** — respetando la privacidad pre-kickoff.

---

### 9. Auditoría visual completa

| Elemento | Antes | Después |
|----------|-------|---------|
| Input size | 40 × 40 px | **48 × 48 px** (mejor touch target) |
| Input type | `number` | `text + inputMode="numeric"` |
| Team flag size | `text-2xl` | `text-3xl` (más visible) |
| Team layout | Horizontal (flag + name) | **Vertical** (flag encima, nombre centrado) |
| Name wrapping | `truncate` | **`leading-snug` sin truncado** |
| Timezone | Crudo CT/ET/PT | **Hora local del usuario** |
| Placeholder | `"0"` | `"–"` (neutro) |
| Phase label format | "Grupo A · Jornada 1" | "Grupo A · J1" (más compacto) |
| Button states | 2 (disabled/enabled) | **5 estados** (idle/edited/saving/saved/locked) |
| Locked indicator | Solo inputs disabled | **Badge "🔒 Predicciones cerradas"** |
| Card border | Fijo | **Dinámico** según estado (azul=guardado, verde=exacto, gold=result, rojo=wrong) |
| Community panel | Ausente | **Stub listo** para Sprint C |
| Focus ring | ring-sky-400/40 | **ring-sky-400/40** (mantenido) |
| Hover states | Borrar button | Mantenidos en todos los botones |

---

### 10. Consistencia con Calendario y Amistosos

| Patrón | Calendario | Amistosos | Predicciones (antes) | Predicciones (después) |
|--------|-----------|-----------|----------------------|------------------------|
| Team layout | Vertical flag+name | Horizontal | Horizontal | **Vertical (igual a Calendario)** |
| Date groups | ✅ | ✅ | ✅ | ✅ |
| Filter tabs | ✅ | ✅ | ✅ | ✅ |
| Phase badge | ✅ | Competición badge | Sin badge mejorado | **Badge gold como Calendario** |
| Motion entries | ✅ | ✅ | ✅ | ✅ |
| AnimatePresence | ✅ | ✅ | Parcial | **Full (tab switch + button states)** |

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `src/components/PredictionsView.tsx` | **Reescritura completa** del componente `PredictionCard` |

Sin cambios en:
- `src/hooks/usePredictions.ts` — hook sin cambios
- `src/app/page.tsx` — sin cambios
- `src/lib/quiniela/kickoff.ts` — solo se importa `toUTC` (ya exportada)

---

## Validaciones realizadas

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ Limpio — 176 kB (sin cambio) |
| Input centrado (lógica) | ✅ `type="text"` + `lineHeight:1` + `padding:0` |
| Horarios unificados | ✅ `formatLocalKickoff()` → `toLocaleTimeString` del browser |
| Nombres sin truncar | ✅ Layout vertical + `maxWidth:96px` + `leading-snug` |
| Label "Tu predicción" | ✅ Encima de inputs cuando editable |
| Estados de botón | ✅ 5 estados con AnimatePresence |
| Badge bloqueado | ✅ "🔒 Predicciones cerradas" en header |
| Community stub | ✅ `CommunityPredictionsPanel` invisible hasta Sprint C |
| Archivos protegidos | ✅ NINGUNO modificado |

---

## Mejoras pendientes

| Mejora | Cuándo |
|--------|--------|
| Conectar `CommunityPredictionsPanel` con datos reales | Sprint C (Social) |
| Animación de entrada en los inputs al hacer focus | Opcional, Sprint C |
| Tooltip para nombres muy largos en mobile | Bajo impacto, no urgente |
| Skeleton loader mientras carga `useLiveWc` | Sprint C |
| Predicción de campeón (ChampionPredictionCard) | Sprint E |
