#!/usr/bin/env python3
"""
extract_stickers.py
Extrae cromos individuales desde PDFs de hojas de figuritas Panini.

Instalación (una sola vez):
    pip install pymupdf pillow

────────────────────────────────────────────────────────────────
PASO 1 — Preview: ve el grid numerado para calibrar filas/columnas
    python extract_stickers.py preview URUGUAI.pdf --rows 4 --cols 5

PASO 2 — Extraer: guarda los 18 PNGs en la carpeta correcta
    python extract_stickers.py extract URUGUAI.pdf URU \
        --rows 4 --cols 5 --output ruta/public/players

FLAGS OPCIONALES
  --rows          filas del grid (default: 4)
  --cols          columnas del grid (default: 5)
  --margin-top    píxeles de margen superior a ignorar (default: 0)
  --margin-bottom píxeles de margen inferior a ignorar (default: 0)
  --margin-left   píxeles de margen izquierdo a ignorar (default: 0)
  --margin-right  píxeles de margen derecho a ignorar (default: 0)
  --gutter-x      espacio horizontal entre cromos en px (default: 0)
  --gutter-y      espacio vertical entre cromos en px (default: 0)
  --dpi           resolución de renderizado (default: 200)
  --page          página del PDF a usar, 1-indexed (default: 1)
  --slots         mapeo manual de celdas a slots del álbum,
                  separado por comas. Omitir = secuencial automático.
                  Ej: --slots 2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,x,x
                  (x = celda vacía/skip)

CONVENCIÓN DE NAMING (igual que el proyecto)
  Slot 1  = escudo foil   → NO se exporta (no tiene imagenCromo)
  Slot 13 = foto equipo   → NO se exporta
  Slots 2-12 y 14-20     → se exportan como {TEAM}_{slot}.png
────────────────────────────────────────────────────────────────
"""

import argparse
import sys
import io
import os
from pathlib import Path

# Forzar UTF-8 en stdout para evitar errores de encoding en Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Verificar dependencias ──────────────────────────────────────

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: falta PyMuPDF. Instala con: pip install pymupdf")
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("ERROR: falta Pillow. Instala con: pip install pillow")
    sys.exit(1)

# ── Slots válidos (display key, 1-indexed) ──────────────────────
# Posición 0 interna = escudo (foil, slot display 1) → sin imagen
# Posición 12 interna = foto equipo (slot display 13) → sin imagen
VALID_SLOTS = [s for s in range(2, 21) if s != 13]  # [2..12, 14..20]


def render_page(pdf_path: str, page_num: int, dpi: int) -> Image.Image:
    """Renderiza una página del PDF como imagen PIL."""
    doc = fitz.open(pdf_path)
    if page_num < 1 or page_num > len(doc):
        print(f"ERROR: el PDF tiene {len(doc)} página(s). --page debe ser 1-{len(doc)}.")
        sys.exit(1)
    page = doc[page_num - 1]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    doc.close()
    return img


def compute_cells(img_w, img_h, rows, cols, mt, mb, ml, mr, gx, gy):
    """
    Devuelve lista de (x0,y0,x1,y1) para cada celda del grid,
    recorrido de izquierda a derecha, de arriba a abajo.
    """
    area_w = img_w - ml - mr
    area_h = img_h - mt - mb
    total_gx = gx * (cols - 1)
    total_gy = gy * (rows - 1)
    cell_w = (area_w - total_gx) / cols
    cell_h = (area_h - total_gy) / rows

    cells = []
    for r in range(rows):
        for c in range(cols):
            x0 = ml + c * (cell_w + gx)
            y0 = mt + r * (cell_h + gy)
            x1 = x0 + cell_w
            y1 = y0 + cell_h
            cells.append((round(x0), round(y0), round(x1), round(y1)))
    return cells


def cmd_preview(args):
    """Renderiza la página con el grid superpuesto y lo guarda como PNG."""
    img = render_page(args.pdf, args.page, args.dpi)
    draw = ImageDraw.Draw(img, "RGBA")

    cells = compute_cells(
        img.width, img.height,
        args.rows, args.cols,
        args.margin_top, args.margin_bottom,
        args.margin_left, args.margin_right,
        args.gutter_x, args.gutter_y,
    )

    # Intentar cargar fuente; fallback a default
    try:
        font = ImageFont.truetype("arial.ttf", size=max(14, img.width // 40))
    except Exception:
        font = ImageFont.load_default()

    for i, (x0, y0, x1, y1) in enumerate(cells):
        cell_num = i + 1
        # Rectángulo semitransparente
        draw.rectangle([x0, y0, x1, y1], outline=(255, 80, 0, 220), width=3)
        draw.rectangle([x0, y0, x0 + 60, y0 + 30], fill=(255, 80, 0, 180))
        draw.text((x0 + 4, y0 + 2), f"#{cell_num}", fill="white", font=font)

    out_path = Path(args.pdf).stem + f"_preview_p{args.page}.png"
    img.save(out_path)
    print(f"[OK] Preview guardado en: {out_path}")
    print(f"     Imagen: {img.width}x{img.height}px | Pagina {args.page} | Grid {args.rows}x{args.cols} | {len(cells)} celdas")
    print()
    standard_slots = "x,x," + ",".join(str(s) for s in VALID_SLOTS)
    print(f"Layout estandar Panini (celda1=escudo, celda2=foto-equipo):")
    print(f"  --slots {standard_slots}")
    print()
    print("Revisa el PNG y ajusta --rows, --cols, --margin-*, --gutter-* si el grid no coincide.")
    print("Cuando el grid coincida con los cromos, corre el comando 'extract'.")


def parse_slots(slots_str: str, total_cells: int) -> list:
    """
    Parsea --slots "2,3,4,x,5,..." en una lista donde None = skip.
    Si no se pasa --slots, retorna mapeo automático secuencial.
    """
    if not slots_str:
        # Mapeo automático: llena VALID_SLOTS en orden, el resto es None
        result = []
        slot_iter = iter(VALID_SLOTS)
        for _ in range(total_cells):
            try:
                result.append(next(slot_iter))
            except StopIteration:
                result.append(None)
        return result

    parts = slots_str.split(",")
    result = []
    for p in parts:
        p = p.strip()
        if p.lower() in ("x", "skip", "none", ""):
            result.append(None)
        else:
            try:
                n = int(p)
                if n not in VALID_SLOTS:
                    print(f"ADVERTENCIA: slot {n} no es válido (se omite). Válidos: {VALID_SLOTS}")
                    result.append(None)
                else:
                    result.append(n)
            except ValueError:
                print(f"ADVERTENCIA: valor '{p}' ignorado en --slots.")
                result.append(None)

    # Rellenar si faltan celdas
    while len(result) < total_cells:
        result.append(None)
    return result


def cmd_extract(args):
    """Extrae cada celda y la guarda con el nombre correcto."""
    team = args.team.upper()
    out_dir = Path(args.output) / team
    out_dir.mkdir(parents=True, exist_ok=True)

    img = render_page(args.pdf, args.page, args.dpi)
    cells = compute_cells(
        img.width, img.height,
        args.rows, args.cols,
        args.margin_top, args.margin_bottom,
        args.margin_left, args.margin_right,
        args.gutter_x, args.gutter_y,
    )

    slot_map = parse_slots(args.slots, len(cells))

    saved = 0
    skipped = 0

    for i, (x0, y0, x1, y1) in enumerate(cells):
        slot = slot_map[i] if i < len(slot_map) else None
        cell_num = i + 1

        if slot is None:
            print(f"  Celda #{cell_num:02d} → skip")
            skipped += 1
            continue

        crop = img.crop((x0, y0, x1, y1))

        # Convertir a RGB si es RGBA (para guardar como JPEG si se quiere)
        if crop.mode == "RGBA":
            bg = Image.new("RGB", crop.size, (255, 255, 255))
            bg.paste(crop, mask=crop.split()[3])
            crop = bg

        filename = f"{team}_{slot}.png"
        out_path = out_dir / filename
        crop.save(out_path, "PNG", optimize=True)
        print(f"  Celda #{cell_num:02d} → {filename}  ({x0},{y0},{x1},{y1})")
        saved += 1

    print()
    print(f"[OK] {saved} imagenes guardadas en: {out_dir}")
    if skipped:
        print(f"     {skipped} celdas omitidas.")

    # Verificar si faltan slots
    saved_slots = {slot_map[i] for i in range(len(cells)) if i < len(slot_map) and slot_map[i]}
    missing = [s for s in VALID_SLOTS if s not in saved_slots]
    if missing:
        print(f"\n[!] Slots faltantes (necesitaran otra fuente): {missing}")
    else:
        print(f"\n[COMPLETO] Todos los 18 slots del equipo {team} fueron generados.")


# ── CLI ─────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Extrae cromos individuales de PDFs de Panini.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    # Argumentos comunes
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("pdf", help="Ruta al archivo PDF")
    common.add_argument("--rows", type=int, default=4, help="Filas del grid (default: 4)")
    common.add_argument("--cols", type=int, default=5, help="Columnas del grid (default: 5)")
    common.add_argument("--margin-top",    type=int, default=0, dest="margin_top")
    common.add_argument("--margin-bottom", type=int, default=0, dest="margin_bottom")
    common.add_argument("--margin-left",   type=int, default=0, dest="margin_left")
    common.add_argument("--margin-right",  type=int, default=0, dest="margin_right")
    common.add_argument("--gutter-x", type=int, default=0, dest="gutter_x")
    common.add_argument("--gutter-y", type=int, default=0, dest="gutter_y")
    common.add_argument("--dpi",  type=int, default=200, help="DPI de renderizado (default: 200)")
    common.add_argument("--page", type=int, default=1, help="Página del PDF, 1-indexed (default: 1)")

    # Subcomando preview
    p_prev = sub.add_parser("preview", parents=[common], help="Muestra el grid superpuesto para calibrar")
    p_prev.set_defaults(func=cmd_preview)

    # Subcomando extract
    p_ext = sub.add_parser("extract", parents=[common], help="Extrae y guarda las imágenes")
    p_ext.add_argument("team", help="Código del equipo (ej: URU, ARG, BRA)")
    p_ext.add_argument("--output", default="./public/players",
                       help="Carpeta raíz donde guardar (default: ./public/players)")
    p_ext.add_argument("--slots", default="",
                       help="Mapeo manual celda→slot separado por comas. Ej: 2,3,4,x,5. "
                            "Omitir = secuencial automático.")
    p_ext.set_defaults(func=cmd_extract)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
