#!/bin/bash
# Ponte Mini → Vercel. Caffeinate impede o Mac de dormir.
set -euo pipefail
BIN="$HOME/bin/cloudflared"
mkdir -p "$HOME/bin"
if [ ! -x "$BIN" ]; then
  echo "Baixando cloudflared…"
  curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz" -o /tmp/cloudflared.tgz
  tar -xzf /tmp/cloudflared.tgz -C /tmp
  mv /tmp/cloudflared "$BIN"
  chmod +x "$BIN"
fi
echo
echo "Mini acordado. Não fecha esta janela."
echo
exec caffeinate -dims "$BIN" tunnel --url http://127.0.0.1:8787
