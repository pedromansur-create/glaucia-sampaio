#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
open -a Ollama 2>/dev/null || true
export MAISON_MODEL="${MAISON_MODEL:-gs-maison}"
if [ -n "${OLLAMA_URLS:-}" ]; then
  exec python3 maison-server.py
fi
export OLLAMA_URLS="${OLLAMA_URL:-http://127.0.0.1:11434}"
exec python3 maison-server.py
