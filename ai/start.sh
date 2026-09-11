#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
open -a Ollama 2>/dev/null || true
export MAISON_MODEL="${MAISON_MODEL:-qwen3.5:9b}"
exec python3 maison-server.py
