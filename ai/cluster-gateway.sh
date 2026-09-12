#!/bin/bash
# Só no Mini 1. Junta os 3 cérebros. Exclusivo: site + CaixaRCS.
set -euo pipefail
cd "$(dirname "$0")"
export MAISON_MODEL="${MAISON_MODEL:-gs-maison}"
export PORT="${PORT:-8787}"
export OLLAMA_URLS="${OLLAMA_URLS:-http://127.0.0.1:11434,http://192.168.12.7:11434,http://10.10.10.1:11434,http://10.10.10.2:11434}"
export MAISON_ORIGINS="${MAISON_ORIGINS:-https://www.glauciasampaio.com,https://glauciasampaio.com,https://www.caixarcs.com,https://caixarcs.com}"
echo "gateway → $OLLAMA_URLS"
echo "só site + caixarcs"
exec caffeinate -dims python3 maison-server.py
