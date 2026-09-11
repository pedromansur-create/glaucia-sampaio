#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
open -a Ollama 2>/dev/null || true
export MAISON_MODEL="${MAISON_MODEL:-qwen2.5:7b}"
exec node maison-server.mjs
