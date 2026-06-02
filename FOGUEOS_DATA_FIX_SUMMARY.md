# FOGUEOS_DATA_FIX_SUMMARY.md
**Fecha:** 2026-06-02 | **Tipo:** Corrección de datos mock
**Base commit:** `0f8ed0b` | **Estado:** ✅ Build limpio, commit local

---

## Resumen ejecutivo

Reemplazo completo de la data mock de Fogueos Internacionales usando la lista oficial de partidos pre-Mundial 2026 como fuente de verdad. La data anterior (30 partidos inventados) fue sustituida por **60 partidos reales** del calendario internacional de mayo–junio 2026.

---

## Totales

| Métrica | Valor |
|---------|-------|
| **Total de partidos** | **60** |
| **Partidos finalizados** (con marcador) | **12** |
| **Partidos próximos** (sin marcador) | **48** |
| **Partidos con marcador verificado** | 12 |
| **Partidos con venue "Por confirmar"** | 60 (todos — hora y estadio exacto no disponibles) |
| **IDs duplicados** | 0 ✅ |
| **Errores TypeScript** | 0 ✅ |

---

## Distribución por fecha

| Fecha | Día | Partidos | Estado |
|-------|-----|----------|--------|
| 2026-05-30 | Sábado | 4 | ✅ Completados |
| 2026-05-31 | Domingo | 8 | ✅ Completados |
| 2026-06-01 | Lunes | 6 | Próximos* |
| 2026-06-02 | Martes | 4 | Próximos |
| 2026-06-03 | Miércoles | 5 | Próximos |
| 2026-06-04 | Jueves | 5 | Próximos |
| 2026-06-05 | Viernes | 3 | Próximos |
| 2026-06-06 | Sábado | 12 | Próximos |
| 2026-06-07 | Domingo | 4 | Próximos |
| 2026-06-08 | Lunes | 3 | Próximos |
| 2026-06-09 | Martes | 3 | Próximos |
| 2026-06-10 | Miércoles | 3 | Próximos |

*Los partidos del Jun 1 se marcan como 'upcoming' (sin marcador en la fuente) según las reglas implementadas.

---

## Partidos completados (12)

| ID | Partido | Marcador |
|----|---------|---------|
| frnd-20260530-sco-cuw | Escocia vs Curazao | **4–1** |
| frnd-20260530-ecu-ksa | Ecuador vs Arabia Saudí | **2–1** |
| frnd-20260530-kor-tto | Corea del Sur vs Trinidad y Tobago | **5–0** |
| frnd-20260530-mex-aus | México vs Australia | **1–0** |
| frnd-20260531-jpn-isl | Japón vs Islandia | **1–0** |
| frnd-20260531-sui-jor | Suiza vs Jordania | **4–1** |
| frnd-20260531-cze-kos | Chequia vs Kosovo | **2–1** |
| frnd-20260531-cpv-srb | Cabo Verde vs Serbia | **3–0** |
| frnd-20260531-pol-ukr | Polonia vs Ucrania | **0–2** |
| frnd-20260531-ger-fin | Alemania vs Finlandia | **4–0** |
| frnd-20260531-usa-sen | Estados Unidos vs Senegal | **3–2** |
| frnd-20260531-bra-pan | Brasil vs Panamá | **6–2** |

---

## Partidos próximos (48)

Incluyen los partidos clave solicitados explícitamente:

| Partido | Fecha |
|---------|-------|
| **Colombia vs Costa Rica** | Jun 1 |
| **Croacia vs Bélgica** | Jun 2 |
| **Inglaterra vs Costa Rica** | Jun 10 |
| **Colombia vs Jordania** | Jun 7 |
| **Argentina vs Honduras** | Jun 6 |
| **Argentina vs Islandia** | Jun 9 |
| **Brasil vs Egipto** | Jun 6 |
| **Estados Unidos vs Alemania** | Jun 6 |
| **Portugal vs Chile** | Jun 6 |
| **Portugal vs Nigeria** | Jun 10 |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/live-data/providers/mock-provider.ts` | Reemplazo completo — 30 matches → 60 matches reales |
| `src/lib/teamFlags.ts` | 29 códigos nuevos agregados (ajuste mínimo de visualización) |

### Códigos nuevos en teamFlags.ts

| Código | Selección | ISO2 |
|--------|-----------|------|
| CRC | Costa Rica | cr |
| ISL | Islandia | is |
| KOS | Kosovo | xk *(no oficial, soportado por flag-icons)* |
| SRB | Serbia | rs |
| POL | Polonia | pl |
| UKR | Ucrania | ua |
| FIN | Finlandia | fi |
| SVK | Eslovaquia | sk |
| MLT | Malta | mt |
| MKD | Macedonia del Norte | mk |
| MAD | Madagascar | mg |
| WAL | Gales | gb-wls |
| DEN | Dinamarca | dk |
| DOM | República Dominicana | do |
| GRE | Grecia | gr |
| GUA | Guatemala | gt |
| NCA | Nicaragua | ni |
| IRL | Irlanda | ie |
| PER | Perú | pe |
| HON | Honduras | hn |
| BOL | Bolivia | bo |
| VEN | Venezuela | ve |
| SVN | Eslovenia | si |
| NIR | Irlanda del Norte | gb-nir |
| CHI | Chile | cl |
| NGA | Nigeria | ng |
| ARU | Aruba | aw |
| SLV | El Salvador | sv |
| TTO | Trinidad y Tobago | tt |

---

## Validaciones ejecutadas

| Validación | Resultado |
|------------|-----------|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ 4/4 páginas estáticas |
| Total de partidos en data | ✅ 60 |
| Partidos completados | ✅ 12 |
| Partidos próximos | ✅ 48 |
| IDs únicos (sin duplicados) | ✅ 60/60 |
| Colombia vs Costa Rica presente | ✅ frnd-20260601-col-crc |
| Croacia vs Bélgica presente | ✅ frnd-20260602-cro-bel |
| Colombia vs Jordania presente | ✅ frnd-20260607-col-jor |
| Inglaterra vs Costa Rica presente | ✅ frnd-20260610-eng-crc |
| Búsqueda 'CRC' encuentra al menos 2 partidos | ✅ Jun 1 + Jun 10 |
| Búsqueda 'COL' encuentra al menos 2 partidos | ✅ Jun 1 + Jun 7 |
| Búsqueda 'BEL' encuentra al menos 2 partidos | ✅ Jun 2 + Jun 6 |
| Búsqueda 'CRO' encuentra al menos 2 partidos | ✅ Jun 2 + Jun 7 |
| Backend / Supabase / auth / RLS / RPCs intactos | ✅ |
| calendar-data.ts (WC 2026) intacto | ✅ |
| CountdownHero intacto | ✅ |

---

## Resultado del build

```
▲ Next.js 14.2.3
✓ TypeScript: 0 errores
✓ Compiled successfully
✓ Static pages: 4/4

Route /                   167 kB    254 kB First Load JS (+1 kB vs anterior)
```

Bundle: +1 kB por los 60 partidos reales vs 30 anteriores + 29 códigos en teamFlags.

---

## Riesgos pendientes

| Riesgo | Severidad | Detalle |
|--------|-----------|---------|
| Venues "Por confirmar" | Baja | Todos los partidos tienen `name: 'Por confirmar'` — datos de estadio/ciudad/hora no disponibles en la fuente |
| Partidos Jun 1 marcados como 'upcoming' | Muy baja | Ya ocurrieron (ayer) pero sin marcador disponible; se sigue la regla "sin marcador = próximo" |
| Kosovo (`xk`) es código no oficial | Muy baja | `flag-icons` lo soporta; si la librería cambia, la bandera no renderiza (sin error) |
| Hora "TBD" visible en cards próximas | Baja | Legible y honesto — se corregirá cuando Fase 3b integre API real con horarios confirmados |

---

## Recomendación de deploy

**✅ Listo para deploy** una vez aprobado.

Los 60 partidos son datos reales verificados de la lista oficial. El build está limpio. Las banderas de todos los equipos nuevos renderizarán correctamente gracias a los 29 códigos agregados a `teamFlags.ts`. Los únicos placeholders son venue/hora, que es honesto con el usuario y consistente con el aviso "datos de demostración" ya en la UI.

**Próxima mejora post-deploy:** cuando Fase 3b conecte la API real, se reemplaza `MockProvider` por `ApiFootballProvider` y todas las horas/estadios se llenan automáticamente sin cambios en la UI.

---

*Commit local únicamente. No pusheado. Pendiente aprobación.*
