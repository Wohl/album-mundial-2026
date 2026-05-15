#!/usr/bin/env python3
"""
Extrae todos los equipos de los PDFs en VECTORES/ hacia public/players/.

Layout real de los PDFs Panini:
  - 2 paginas por equipo, 4 filas x 4 columnas por pagina (16 celdas c/u)
  - Pagina 1: celda1=escudo(skip), celda2=foto(skip), celdas3-16 = slots 2-16
  - Pagina 2: celdas1-4 = slots 17-20, resto vacias

Parametros de extraccion (a 250 DPI):
  --rows 4 --cols 4
  --margin-top 213 --margin-bottom 213 --margin-left 100 --margin-right 100
"""
import subprocess
import sys
from pathlib import Path

VECTORES = Path(__file__).parent.parent / "VECTORES"
OUTPUT = Path(__file__).parent.parent / "public" / "players"
EXTRACTOR = Path(__file__).parent / "extract_stickers.py"

# PDF filename (o patron glob) → team code del album
PDF_TO_TEAM = {
    "ALEMANHA.pdf":   "GER",
    "ARGENTINA.pdf":  "ARG",
    "BRASIL.pdf":     "BRA",
    "COLOMBIA.pdf":   "COL",
    "CROACIA.pdf":    "CRO",
    "EQUADOR.pdf":    "ECU",
    "ESPANHA.pdf":    "ESP",
    "FRAN*.pdf":      "FRA",   # FRANCA.pdf / FRANCA con cedilla
    "HOLANDA.pdf":    "NED",
    "INGLATERRA.pdf": "ENG",
    "MARROCOS.pdf":   "MAR",
    "MEXICO.pdf":     "MEX",
    "NORUEGA.pdf":    "NOR",
    "PORTUGAL.pdf":   "POR",
    "URUGUAI.pdf":    "URU",
    # COCA COLA.pdf se omite (formato diferente)
}

COMMON_ARGS = [
    "--rows", "4", "--cols", "4",
    "--dpi", "250",
    "--margin-top", "213",
    "--margin-bottom", "213",
    "--margin-left", "100",
    "--margin-right", "100",
]

SLOTS_P1 = "x,x,2,3,4,5,6,7,8,9,10,11,12,14,15,16"
SLOTS_P2 = "17,18,19,20,x,x,x,x,x,x,x,x,x,x,x,x"


def find_pdf(pattern: str) -> Path | None:
    matches = list(VECTORES.glob(pattern))
    return matches[0] if matches else None


def run_extract(pdf_path: Path, team: str, page: int, slots: str) -> bool:
    cmd = [
        sys.executable, str(EXTRACTOR),
        "extract", str(pdf_path), team,
        *COMMON_ARGS,
        "--slots", slots,
        "--page", str(page),
        "--output", str(OUTPUT),
    ]
    result = subprocess.run(cmd, capture_output=False, text=True)
    return result.returncode == 0


def main():
    errors = []

    for pattern, team in PDF_TO_TEAM.items():
        pdf_path = find_pdf(pattern)
        if not pdf_path:
            print(f"\n[SKIP] {pattern} no encontrado en {VECTORES}")
            continue

        print(f"\n{'='*50}")
        print(f"Procesando {pdf_path.name} -> {team}")
        print(f"{'='*50}")

        print(f"  Pagina 1 (slots 2-16)...")
        ok1 = run_extract(pdf_path, team, 1, SLOTS_P1)

        print(f"  Pagina 2 (slots 17-20)...")
        ok2 = run_extract(pdf_path, team, 2, SLOTS_P2)

        if not (ok1 and ok2):
            errors.append(f"{pdf_path.name} ({team})")

    print(f"\n{'='*50}")
    if errors:
        print(f"[!] Errores en: {', '.join(errors)}")
    else:
        print("[OK] Todos los equipos procesados correctamente.")


if __name__ == "__main__":
    main()
