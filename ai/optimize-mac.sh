#!/bin/bash
# M4 16 GB — Ollama stays loaded, less RAM on KV, no “think” tax
set -euo pipefail
cd "$(dirname "$0")"

launchctl setenv OLLAMA_FLASH_ATTENTION 1
launchctl setenv OLLAMA_KV_CACHE_TYPE q8_0
launchctl setenv OLLAMA_KEEP_ALIVE 24h
launchctl setenv OLLAMA_MAX_LOADED_MODELS 1

osascript -e 'quit app "Ollama"' 2>/dev/null || true
sleep 1
open -a Ollama
sleep 3

ollama pull qwen3.5:9b
ollama create gs-maison -f "$(pwd)/Modelfile"
echo "Modelo da casa: gs-maison (qwen3.5:9b, think off, ctx 2k)"
ollama run gs-maison "ok" --nowordwrap >/dev/null 2>&1 || true
echo "Pronto. Ollama no ar com flash attention + KV q8."
