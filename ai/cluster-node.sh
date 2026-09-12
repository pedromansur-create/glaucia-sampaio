#!/bin/bash
# Um Mini do cluster. Uso: ./cluster-node.sh 1|2|3
# 1 = site (porta)  2 = CaixaRCS  3 = reserva
set -euo pipefail
cd "$(dirname "$0")"
NODE="${1:-}"
if [[ ! "$NODE" =~ ^[123]$ ]]; then
  echo "Uso: ./cluster-node.sh 1   (site)"
  echo "     ./cluster-node.sh 2   (caixa)"
  echo "     ./cluster-node.sh 3   (reserva)"
  exit 1
fi
IP="10.10.10.$NODE"
NAME="Thunderbolt Bridge"

echo "Mini $NODE → $IP  (site=1  caixa=2  reserva=3)"
echo "Cabo Thunderbolt: 1—2 e 2—3. Wi-Fi ligado. Exclusivo: site + CaixaRCS."
echo

if networksetup -listallnetworkservices | grep -q "$NAME"; then
  sudo networksetup -setmanual "$NAME" "$IP" 255.255.255.0
  echo "Thunderbolt = $IP"
else
  echo "Ponte Thunderbolt ainda não apareceu. Liga o cabo e, em Ajustes → Rede, ative Thunderbolt Bridge."
  echo "Sigo com o cérebro neste Mini; o cabo entra depois."
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "Instalando Ollama…"
  curl -fsSL https://ollama.com/install.sh | sh
fi

launchctl setenv OLLAMA_HOST "0.0.0.0:11434"
launchctl setenv OLLAMA_FLASH_ATTENTION "1"
launchctl setenv OLLAMA_KV_CACHE_TYPE "q8_0"
launchctl setenv OLLAMA_KEEP_ALIVE "24h"
launchctl setenv OLLAMA_NUM_PARALLEL "1"
launchctl setenv OLLAMA_MAX_LOADED_MODELS "1"
killall Ollama 2>/dev/null || true
open -a Ollama 2>/dev/null || true
sleep 3
ollama pull qwen3.5:9b
ollama create gs-maison -f "$(pwd)/Modelfile"

echo
echo "Mini $NODE pronto."
if [ "$NODE" = "1" ]; then
  echo "Janela 1:  ./cluster-gateway.sh"
  echo "Janela 2:  ./tunnel.sh"
else
  echo "Deixa o Ollama aberto. Mini 1 é a porta."
fi
