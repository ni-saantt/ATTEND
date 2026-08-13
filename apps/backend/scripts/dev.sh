#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npx kill-port 8000 2>/dev/null || true

PORT="${PORT:-8000}"
UVICORN_ARGS=(app.main:app --reload --host 0.0.0.0 --port "$PORT")

if [[ -x .venv/bin/uvicorn ]]; then
  exec .venv/bin/uvicorn "${UVICORN_ARGS[@]}"
fi

if command -v uvicorn >/dev/null 2>&1; then
  exec uvicorn "${UVICORN_ARGS[@]}"
fi

echo "Error: uvicorn not found. Create a venv in apps/backend or install uvicorn on PATH." >&2
echo "  python -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
exit 1
