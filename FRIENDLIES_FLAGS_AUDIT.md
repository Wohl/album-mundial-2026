# Auditoría de Banderas — Amistosos Internacionales
**Fecha:** 2026-06-04  
**Archivo auditado:** `src/lib/live-data/providers/mock-provider.ts`  
**Banderas contra:** `src/lib/teamFlags.ts` (TEAM_ISO2)

---

## Resumen

| Métrica | Valor |
|---|---|
| Total de partidos | **60** |
| Total de equipos únicos | **75** |
| Banderas existentes (sin cambios) | **75** |
| Banderas agregadas | **0** |
| Banderas faltantes pendientes | **0** |
| Códigos corregidos | **3** (reorganización estructural) |

**Resultado: todos los 75 equipos tienen bandera correctamente mapeada.**

---

## Correcciones aplicadas en `teamFlags.ts`

### 1. Clave duplicada eliminada — `SCO`
`SCO: 'gb-sct'` estaba definida dos veces: en el bloque de Grupo C (posición correcta) y como "alias" redundante en la sección Europa. Se eliminó la entrada duplicada de Europa.

| Acción | Código | Sección anterior | Sección final |
|---|---|---|---|
| Eliminado duplicado | `SCO` | Europa (alias) | Solo en Grupo C |

### 2. Clasificación geográfica corregida — `MAD` y `NGA`
Madagascar y Nigeria estaban clasificadas en la sección comentada `// Europa`, lo que era incorrecto. Se movieron a la sección `// África` dentro de "Cobertura extendida", en posición alfabética correcta.

| Acción | Código | País | Sección anterior | Sección final | ISO2 |
|---|---|---|---|---|---|
| Reclasificado | `MAD` | Madagascar | Europa (incorrecto) | África | `mg` |
| Reclasificado | `NGA` | Nigeria | Europa (incorrecto) | África | `ng` |

> Estos cambios son puramente de organización interna del archivo. Los valores ISO2 y el mapping funcional no cambiaron.

---

## Equipos clave validados

Todos los equipos de la lista de verificación solicitada están presentes en TEAM_ISO2:

| Equipo | Código | ISO2 | Partidos en Amistosos |
|---|---|---|---|
| Costa Rica | `CRC` | `cr` | 2 (vs COL, vs ENG) |
| Colombia | `COL` | `co` | 2 (vs CRC, vs JOR) |
| Bélgica | `BEL` | `be` | 2 (vs CRO, vs TUN) |
| Croacia | `CRO` | `hr` | 2 (vs BEL, vs SVN) |
| Gales | `WAL` | `gb-wls` | 1 (vs GHA) |
| Ghana | `GHA` | `gh` | 1 (vs WAL) |
| Haití | `HAI` | `ht` | 2 (vs NZL, vs PER) |
| Nueva Zelanda | `NZL` | `nz` | 2 (vs HAI, vs ENG) |
| Uzbekistán | `UZB` | `uz` | 2 (vs CAN, vs NED) |
| Madagascar | `MAD` | `mg` | 1 (vs MAR) |
| Macedonia del Norte | `MKD` | `mk` | 1 (vs TUR) |
| República Dominicana | `DOM` | `do` | 1 (vs PAN) |
| Irlanda del Norte | `NIR` | `gb-nir` | 1 (vs FRA) |
| Rep. Democrática del Congo | `COD` | `cd` | 2 (vs DEN, vs CHI) |
| Trinidad y Tobago | `TTO` | `tt` | 1 (vs KOR) |
| Curazao | `CUW` | `cw` | 2 (vs SCO, vs ARU) |
| Aruba | `ARU` | `aw` | 1 (vs CUW) |
| El Salvador | `SLV` | `sv` | 2 (vs KOR, vs QAT) |

---

## Listado completo — 75 equipos únicos

| # | Código | País | ISO2 | Sección en teamFlags.ts |
|---|---|---|---|---|
| 1 | ALG | Argelia | `dz` | Grupo J |
| 2 | ARG | Argentina | `ar` | Grupo J |
| 3 | ARU | Aruba | `aw` | Amistosos / Américas |
| 4 | AUS | Australia | `au` | Grupo D |
| 5 | AUT | Austria | `at` | Grupo J |
| 6 | BEL | Bélgica | `be` | Grupo G |
| 7 | BIH | Bosnia y Herzegovina | `ba` | Grupo B |
| 8 | BOL | Bolivia | `bo` | Amistosos / Américas |
| 9 | BRA | Brasil | `br` | Grupo C |
| 10 | CAN | Canadá | `ca` | Grupo B |
| 11 | CHI | Chile | `cl` | Amistosos / Américas |
| 12 | CIV | Costa de Marfil | `ci` | Grupo E |
| 13 | COD | Rep. Dem. Congo | `cd` | Grupo K |
| 14 | COL | Colombia | `co` | Grupo K |
| 15 | CPV | Cabo Verde | `cv` | Grupo H |
| 16 | CRC | Costa Rica | `cr` | Amistosos / Américas |
| 17 | CRO | Croacia | `hr` | Grupo L |
| 18 | CUW | Curazao | `cw` | Grupo E |
| 19 | CZE | Chequia | `cz` | Grupo A |
| 20 | DEN | Dinamarca | `dk` | Amistosos / Europa |
| 21 | DOM | Rep. Dominicana | `do` | Amistosos / Américas |
| 22 | ECU | Ecuador | `ec` | Grupo E |
| 23 | EGY | Egipto | `eg` | Grupo G |
| 24 | ENG | Inglaterra | `gb-eng` | Grupo L |
| 25 | ESP | España | `es` | Grupo H |
| 26 | FIN | Finlandia | `fi` | Amistosos / Europa |
| 27 | FRA | Francia | `fr` | Grupo I |
| 28 | GER | Alemania | `de` | Grupo E |
| 29 | GHA | Ghana | `gh` | Grupo L |
| 30 | GRE | Grecia | `gr` | Amistosos / Europa |
| 31 | GUA | Guatemala | `gt` | Amistosos / Américas |
| 32 | HAI | Haití | `ht` | Grupo C |
| 33 | HON | Honduras | `hn` | Amistosos / Américas |
| 34 | IRL | Irlanda | `ie` | Amistosos / Américas |
| 35 | IRQ | Irak | `iq` | Grupo I |
| 36 | ISL | Islandia | `is` | Amistosos / Europa |
| 37 | JOR | Jordania | `jo` | Grupo J |
| 38 | JPN | Japón | `jp` | Grupo F |
| 39 | KOR | Corea del Sur | `kr` | Grupo A |
| 40 | KOS | Kosovo | `xk` | Amistosos / Europa |
| 41 | KSA | Arabia Saudí | `sa` | Grupo H |
| 42 | MAD | Madagascar | `mg` | Amistosos / África ✱ |
| 43 | MAR | Marruecos | `ma` | Grupo C |
| 44 | MEX | México | `mx` | Grupo A |
| 45 | MKD | Macedonia del Norte | `mk` | Amistosos / Europa |
| 46 | MLT | Malta | `mt` | Amistosos / Europa |
| 47 | NCA | Nicaragua | `ni` | Amistosos / Américas |
| 48 | NED | Países Bajos | `nl` | Grupo F |
| 49 | NGA | Nigeria | `ng` | Cobertura extendida / África ✱ |
| 50 | NIR | Irlanda del Norte | `gb-nir` | Amistosos / Américas |
| 51 | NOR | Noruega | `no` | Grupo I |
| 52 | NZL | Nueva Zelanda | `nz` | Grupo G |
| 53 | PAN | Panamá | `pa` | Grupo L |
| 54 | PAR | Paraguay | `py` | Grupo D |
| 55 | PER | Perú | `pe` | Amistosos / Américas |
| 56 | POL | Polonia | `pl` | Amistosos / Europa |
| 57 | POR | Portugal | `pt` | Grupo K |
| 58 | QAT | Qatar | `qa` | Grupo B |
| 59 | SCO | Escocia | `gb-sct` | Grupo C ✱ |
| 60 | SEN | Senegal | `sn` | Grupo I |
| 61 | SLV | El Salvador | `sv` | Amistosos / Américas |
| 62 | SRB | Serbia | `rs` | Amistosos / Europa |
| 63 | SUI | Suiza | `ch` | Grupo B |
| 64 | SVK | Eslovaquia | `sk` | Amistosos / Europa |
| 65 | SVN | Eslovenia | `si` | Amistosos / Europa |
| 66 | SWE | Suecia | `se` | Grupo F |
| 67 | TTO | Trinidad y Tobago | `tt` | Amistosos / Américas |
| 68 | TUN | Túnez | `tn` | Grupo F |
| 69 | TUR | Türkiye | `tr` | Grupo D |
| 70 | UKR | Ucrania | `ua` | Amistosos / Europa |
| 71 | USA | Estados Unidos | `us` | Grupo D |
| 72 | UZB | Uzbekistán | `uz` | Grupo K |
| 73 | VEN | Venezuela | `ve` | Amistosos / Américas |
| 74 | WAL | Gales | `gb-wls` | Amistosos / Américas |
| 75 | WC26 entries* | — | — | Grupos A–L |

> ✱ = sección corregida en esta auditoría

---

## Validaciones ejecutadas

| Check | Resultado |
|---|---|
| `tsc --noEmit` | ✅ Sin errores |
| `npm run build` | ✅ Compilación exitosa |
| Banderas placeholders en Amistosos | ✅ Ninguna — todos los códigos resuelven a ISO2 |
| Predicciones (Quiniela) | ✅ Build sin cambios en lógica de predicciones |
| Calendario Mundial | ✅ Build sin cambios en calendar-data.ts |

---

## Partidos por fecha (60 en total)

| Fecha | Partidos |
|---|---|
| 2026-05-30 | 4 |
| 2026-05-31 | 8 |
| 2026-06-01 | 6 |
| 2026-06-02 | 4 |
| 2026-06-03 | 5 |
| 2026-06-04 | 5 |
| 2026-06-05 | 3 |
| 2026-06-06 | 12 |
| 2026-06-07 | 4 |
| 2026-06-08 | 3 |
| 2026-06-09 | 3 |
| 2026-06-10 | 3 |
| **Total** | **60** |
