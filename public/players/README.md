# Imágenes de jugadores — Álbum Mundial 2026

Estructura esperada: `/public/players/{EQUIPO}/{EQUIPO}_{NÚMERO}.png`

## Convención de nombres

- El número corresponde al **ID de display** (1-based): MEX_2 a MEX_20 son los 19 jugadores de México.
- `{EQUIPO}_1` = Escudo (foil) → **sin imagen de jugador**
- `{EQUIPO}_13` = Foto Equipo → **sin imagen de jugador**
- El resto (MEX_2–MEX_12 y MEX_14–MEX_20) son jugadores → deben tener imagen.

## Ejemplo para México

```
public/players/MEX/
  MEX_2.png   → Luis Malagón
  MEX_3.png   → Johan Vásquez
  ...
  MEX_20.png  → Cesar Huerta
```

## Regla de visualización

La UI **solo muestra la imagen si el archivo existe** físicamente. Si el archivo no está,
el espacio de foto queda vacío y la tarjeta del cromo se muestra sin imagen — sin
placeholder, sin error visible.

## Formato recomendado

- Tipo: PNG (o JPG renombrado a .png)
- Proporción: retrato vertical (3:4 aprox.)
- Resolución mínima: 150×200 px
- Fondo: limpio / selección nacional oficial

## Equipos disponibles (48)

MEX RSA KOR CZE CAN BIH QAT SUI BRA MAR HAI SCO USA PAR AUS TUR GER CUW CIV ECU
NED JPN SWE TUN BEL EGY IRN NZL ESP CPV KSA URU FRA SEN IRQ NOR ARG ALG AUT JOR
POR COD UZB COL ENG CRO GHA PAN
