#!/usr/bin/env bash
# Lightweight checks before `npm run dev`. Warnings for setup gaps; hard fail only when dev cannot run.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Attend dev preflight ==="

if [[ ! -d node_modules ]]; then
  echo "Error: node_modules missing. Run: npm install" >&2
  exit 1
fi

if [[ ! -f apps/backend/.env ]]; then
  echo "Warning: apps/backend/.env not found."
  echo "  Copy apps/backend/.env.example to apps/backend/.env and configure Supabase credentials."
fi

if [[ -x apps/backend/.venv/bin/uvicorn ]]; then
  echo "OK: backend uvicorn (.venv)"
elif command -v uvicorn >/dev/null 2>&1; then
  echo "OK: backend uvicorn (PATH)"
else
  echo "Error: uvicorn not available for backend." >&2
  echo "  cd apps/backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

echo "Ready: npm run dev (Turbo — backend, mobile, admin-desktop, shared)"
echo ""
