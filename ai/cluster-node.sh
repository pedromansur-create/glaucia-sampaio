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
echo "Ligue o cabo Thunderbolt (1—2 e 2—3). Wi-Fi fica ligado pra internet."
echo

if ! networksetup -listallnetworkservices | grep -q "$NAME"; then
  echo "Não achei “Thunderbolt Bridge”. Em Ajustes → Rede, ligue a ponte Thunderbolt e rode de novo."
  networksetup -listallnetworkservices
  exit 1
fi

sudo networksetup -setmanual "$NAME" "$IP" 255.255.255.0
echo "Thunderbolt = $IP"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Instalando Ollama…"
  curl -fsSL https://ollama.com/install.sh | sh
fi

# Ollama só na ponte (cluster). Site e Caixa entram pelo Mini 1.
launchctl setenv OLLAMA_HOST "0.0.0.0:11434"
open -a Ollama 2>/dev/null || true
sleep 2
ollama pull qwen3.5:9b
ollama create gs-maison -f "$(pwd)/Modelfile"

echo
echo "Mini $NODE pronto. Ollama em $IP:11434"
if [ "$NODE" = "1" ]; then
  echo "Agora neste Mini:  ./cluster-gateway.sh"
  echo "Outra janela:      ./tunnel.sh"
else
  echo "Deixa o Ollama aberto. Não fecha. Mini 1 é quem fala com o site."
fi
