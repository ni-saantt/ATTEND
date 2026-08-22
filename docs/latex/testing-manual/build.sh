#!/usr/bin/env bash
# Build Attend Manual Test Plan PDF from single main.tex
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if command -v latexmk >/dev/null 2>&1; then
  latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
else
  pdflatex -interaction=nonstopmode main.tex
  pdflatex -interaction=nonstopmode main.tex
fi

cp -f main.pdf ../../testing/TEST_MANUAL.pdf
echo "PDF: $(cd ../.. && pwd)/testing/TEST_MANUAL.pdf"
