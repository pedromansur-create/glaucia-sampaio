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
echo "Modelo único neste Mini: gs-maison"

PYTHON="$(command -v python3)"
PLIST="$HOME/Library/LaunchAgents/com.glauciasampaio.maison.plist"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.glauciasampaio.maison</string>
  <key>ProgramArguments</key>
  <array>
    <string>${PYTHON}</string>
    <string>$(pwd)/maison-server.py</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>MAISON_MODEL</key><string>gs-maison</string>
    <key>OLLAMA_URL</key><string>http://127.0.0.1:11434</string>
    <key>PORT</key><string>8787</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/maison.log</string>
  <key>StandardErrorPath</key><string>/tmp/maison.err</string>
</dict>
</plist>
EOF
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
sleep 2
curl -s http://127.0.0.1:8787/health || true
echo
echo "Mini exclusivo: CaixaRCS + vitrine. Lucy não usa este Terminal."
