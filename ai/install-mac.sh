#!/bin/bash
# Mac mini M4 16 GB — cérebro local da Gláucia Sampaio
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Instalando Ollama…"
  curl -fsSL https://ollama.com/install.sh | sh
fi

echo "Subindo Ollama…"
open -a Ollama 2>/dev/null || (ollama serve >/tmp/ollama.log 2>&1 &)
sleep 3

# 9B Q4 ~6.6 GB. Melhor PT-BR no M4 16 GB. Fallback apertado: llama3.2:3b
MODEL="${MAISON_MODEL:-gs-maison}"
echo "Baixando qwen3.5:9b e criando gs-maison…"
ollama pull qwen3.5:9b
ollama create gs-maison -f "$(pwd)/Modelfile"

PYTHON="$(command -v python3 || true)"
if [ -z "$PYTHON" ]; then
  echo "Instala Python 3:  brew install python"
  exit 1
fi

chmod +x maison-server.py start.sh

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
    <key>MAISON_MODEL</key><string>${MODEL}</string>
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
sleep 1
curl -s http://127.0.0.1:8787/health || true
echo
echo "Pronto. Mac mini escuta em http://$(ipconfig getifaddr en0 2>/dev/null || echo 127.0.0.1):8787"
echo "No Vercel: OLLAMA_URL = esse endereço (Tailscale) + o site passa a escrever o recado aqui."
