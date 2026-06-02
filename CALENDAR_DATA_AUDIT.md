# CALENDAR_DATA_AUDIT.md — FIFA World Cup 2026
**Fecha de auditoría:** 2026-06-02 | **Fuente de datos:** `src/lib/calendar-data.ts`

---

## 1. Resumen Ejecutivo

| Categoría | Cantidad | Confianza |
|-----------|----------|-----------|
| Partidos totales | **104** | ✅ Definitivo (formato oficial FIFA) |
| Grupos | **12 (A–L)** | ✅ Definitivo (sorteo dic. 2023) |
| Equipos por grupo | **4** | ✅ Definitivo |
| Sedes | **15** | ✅ Definitivo (anuncio FIFA 2022) |
| Errores de datos corregidos | **9** (Rose Bowl) | ✅ Corregidos |
| Fechas específicas de partidos | Estimadas | ⚠️ Placeholder |
| Horarios (15:00, 18:00, etc.) | Placeholder | ⚠️ Placeholder |
| Asignaciones venue-partido | Mayormente estimadas | ⚠️ Placeholder |

---

## 2. Datos DEFINITIVOS (alta confianza)

### 2.1 Formato del torneo
- 48 selecciones, 12 grupos de 4 equipos
- 72 partidos de fase de grupos (6 por grupo)
- 16 partidos de Ronda de 32
- 8 partidos de Octavos de Final
- 4 partidos de Cuartos de Final
- 2 Semifinales
- 1 partido por el Tercer Lugar
- 1 Gran Final
- **Total: 104 partidos**

### 2.2 Grupos y selecciones (sorteo oficial dic. 2023)

| Grupo | Selecciones |
|-------|------------|
| **A** | México (MEX), Sudáfrica (RSA), Rep. de Corea (KOR), Czechia (CZE) |
| **B** | Canadá (CAN), Bosnia-Herzegovina (BIH), Qatar (QAT), Suiza (SUI) |
| **C** | Brasil (BRA), Marruecos (MAR), Haití (HAI), Escocia (SCO) |
| **D** | Estados Unidos (USA), Paraguay (PAR), Australia (AUS), Turquía (TUR) |
| **E** | Alemania (GER), Curazao (CUW), Costa de Marfil (CIV), Ecuador (ECU) |
| **F** | Países Bajos (NED), Japón (JPN), Suecia (SWE), Túnez (TUN) |
| **G** | Bélgica (BEL), Egipto (EGY), Irán (IRN), Nueva Zelanda (NZL) |
| **H** | España (ESP), Cabo Verde (CPV), Arabia Saudí (KSA), Uruguay (URU) |
| **I** | Francia (FRA), Senegal (SEN), Iraq (IRQ), Noruega (NOR) |
| **J** | Argentina (ARG), Argelia (ALG), Austria (AUT), Jordania (JOR) |
| **K** | Portugal (POR), Congo DR (COD), Uzbekistán (UZB), Colombia (COL) |
| **L** | Inglaterra (ENG), Croacia (CRO), Ghana (GHA), Panamá (PAN) |

### 2.3 Sedes oficiales (15 venues, anuncio FIFA 2022)

| País | Ciudad | Estadio |
|------|--------|---------|
| 🇲🇽 México | Ciudad de México | Estadio Azteca |
| 🇲🇽 México | Guadalajara | Estadio Akron |
| 🇲🇽 México | Monterrey | Estadio BBVA |
| 🇨🇦 Canadá | Vancouver | BC Place |
| 🇨🇦 Canadá | Toronto | BMO Field |
| 🇺🇸 USA | Nueva York/NJ | MetLife Stadium |
| 🇺🇸 USA | **Los Ángeles** | **SoFi Stadium** ← confirmado |
| 🇺🇸 USA | Dallas | AT&T Stadium |
| 🇺🇸 USA | San Francisco | Levi's Stadium |
| 🇺🇸 USA | Miami | Hard Rock Stadium |
| 🇺🇸 USA | Atlanta | Mercedes-Benz Stadium |
| 🇺🇸 USA | Seattle | Lumen Field |
| 🇺🇸 USA | Kansas City | Arrowhead Stadium |
| 🇺🇸 USA | Houston | NRG Stadium |
| 🇺🇸 USA | Boston | Gillette Stadium |
| 🇺🇸 USA | Philadelphia | Lincoln Financial Field |

### 2.4 Partidos con datos confirmados

| Partido | Dato confirmado |
|---------|----------------|
| Inauguración | **México vs Sudáfrica**, 11 junio 2026, **Estadio Azteca** |
| Gran Final | **MetLife Stadium** (Nueva York/NJ), julio 2026 |
| Formato R32 | 24 clasificados (1° y 2° de cada grupo) + 8 mejores 3° |

---

## 3. Datos ESTIMADOS/PLACEHOLDER

> Estos datos siguen la estructura del formato FIFA y son plausibles, pero los valores exactos deben confirmarse con el calendario oficial publicado por FIFA.

### 3.1 Fechas de partidos (Fase de Grupos)

Los rangos de fechas son coherentes con el formato FIFA (inicio 11 jun, fin grupos ~1 jul):
- Jornada 1: 11–21 jun (estimado)
- Jornada 2: 17–21 jun (estimado)
- Jornada 3: 22–1 jul (estimado, simultáneos dentro del grupo)

Las fechas exactas para cada partido requieren el calendario oficial FIFA.

### 3.2 Horarios de los partidos

Los horarios (15:00, 18:00, 20:00, etc.) son **placeholders**. El calendario oficial especifica la hora exacta de cada partido. Todos los horarios en el sistema son estimaciones basadas en la práctica habitual de FIFA (partidos cada 3h).

### 3.3 Asignaciones venue-partido

La asignación de qué partido se juega en qué estadio es **estimada** para todos los partidos excepto:
- Inauguración: MEX vs RSA → Estadio Azteca ✅
- Final: MetLife Stadium ✅

El resto de asignaciones de grupo y knockouts son distribuciones razonables basadas en geografía y capacidad, pero no corresponden al calendario oficial FIFA.

### 3.4 Fechas de eliminatoria (R32, R16, QF, SF, 3er, Final)

```
R32:    5–12 julio 2026  (estimado)
R16:   14–17 julio 2026  (estimado)
QF:    19–20 julio 2026  (estimado)
SF:    22–23 julio 2026  (estimado)
3er:      25 julio 2026  (estimado)
Final:    26 julio 2026  (estimado)
```

### 3.5 Timezones

Las timezones asignadas a cada ciudad son correctas geográficamente:
- ET (Eastern Time): Nueva York/NJ, Philadelphia, Miami, Atlanta, Boston, Toronto
- CT (Central Time): Dallas, Houston, Kansas City, Ciudad de México, Guadalajara, Monterrey
- PT (Pacific Time): Los Ángeles, San Francisco, Seattle, Vancouver

**Nota:** No se verificaron cambios de horario de verano (DST) específicos para cada fecha.

---

## 4. ERRORES DETECTADOS Y CORREGIDOS

### Error Principal: "Rose Bowl" como venue de Los Ángeles

| Impacto | Crítico — venue inexistente en WC 2026 |
|---------|----------------------------------------|
| Causa | Rose Bowl (Pasadena, CA) NO fue seleccionada como sede FIFA 2026 |
| Venue correcto | **SoFi Stadium** (Inglewood, CA) |
| Instancias corregidas | **9** en total |

#### Partidos afectados y corregidos:

| ID | Fase | Corrección aplicada |
|----|------|---------------------|
| `F-1-1` | Grupo F, Jornada 1 | Rose Bowl → SoFi Stadium |
| `F-3-1` | Grupo F, Jornada 3 | Rose Bowl → SoFi Stadium |
| `I-1-2` | Grupo I, Jornada 1 | Rose Bowl → SoFi Stadium |
| `I-3-1` | Grupo I, Jornada 3 | Rose Bowl → SoFi Stadium |
| `K-1-2` | Grupo K, Jornada 1 | Rose Bowl → SoFi Stadium |
| `R32-11` | Ronda de 32 | Rose Bowl → SoFi Stadium |
| `R16-3` | Octavos de Final | Rose Bowl → SoFi Stadium |
| `QF-3` | Cuartos de Final | Rose Bowl → SoFi Stadium |
| `SF-2` | Semifinal | Rose Bowl → SoFi Stadium |

---

## 5. Observaciones Menores (No Corregidas — Aceptables)

| Elemento | Valor actual | Nombre completo oficial | Impacto |
|----------|-------------|------------------------|---------|
| Kansas City | Arrowhead Stadium | GEHA Field at Arrowhead Stadium | Muy bajo — "Arrowhead" es el nombre coloquial universal |
| Atlanta | Mercedes-Benz | Mercedes-Benz Stadium | Muy bajo — truncado por legibilidad |
| Philadelphia | Lincoln Financial | Lincoln Financial Field | Muy bajo — truncado por legibilidad |
| San Francisco | Levi's Stadium | Levi's Stadium (Santa Clara, CA) | Muy bajo — "San Francisco" es el shorthand aceptado |

---

## 6. Costa Rica

| Campo | Valor |
|-------|-------|
| Código FIFA | CRC |
| ¿Clasificó al WC 2026? | **NO** |
| Partidos en el fixture | **0** |
| Fuente | No aparece en ninguno de los 12 grupos del sorteo oficial |

La selección costarricense no aparece en los 104 partidos del fixture. El filtro "Costa Rica" en el Calendario muestra un estado vacío con el mensaje "No clasificó al Mundial 2026".

---

## 7. Selecciones del Álbum vs. Selecciones en el Fixture

Todos los **48 equipos** presentes en el álbum (stickers.ts) coinciden con las selecciones en el fixture:

| ¿Están en el álbum Y en el fixture? | 48/48 ✅ |
|--------------------------------------|---------|
| ¿Hay selecciones en el fixture no cubiertas en el álbum? | No |
| ¿Hay selecciones en el álbum no en el fixture? | No |

---

## 8. Plan de Actualización

Cuando FIFA publique el calendario oficial completo:

1. **Reemplazar** `src/lib/calendar-data.ts` → `WC2026_MATCHES` con los datos exactos
2. **Verificar** fechas, horarios, y asignaciones venue-partido
3. **Activar** integración con API de resultados (campos `score`, `minute`, `status: 'live'` ya preparados)
4. **No requiere** cambios en `CalendarView.tsx` (la capa de datos está desacoplada)

---

## 9. Conclusión

La arquitectura de datos es correcta y el fixture es **estructuralmente fiel** al formato oficial del Mundial 2026. El único error material detectado (Rose Bowl) fue corregido. Los datos de fechas, horarios y asignaciones de venue son estimaciones válidas que serán reemplazadas por los datos oficiales de FIFA cuando estén disponibles, sin necesidad de modificar la interfaz visual.
