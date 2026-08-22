#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v pdflatex >/dev/null 2>&1; then
  echo "Error: pdflatex not found. Install BasicTeX: brew install --cask basictex"
  exit 1
fi

if command -v latexmk >/dev/null 2>&1; then
  latexmk -pdf -interaction=nonstopmode main.tex
else
  pdflatex -interaction=nonstopmode main.tex
  pdflatex -interaction=nonstopmode main.tex
fi

echo "Output: $(pwd)/main.pdf"
