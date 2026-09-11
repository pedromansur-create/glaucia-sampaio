#!/usr/bin/env python3
"""Local maison brain. Retrieval stays on the website; this only writes copy."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

OLLAMA = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("MAISON_MODEL", "gs-maison")
KEY = os.environ.get("MAISON_KEY", "").strip()

SYSTEM = """Você é a voz da boutique Gláucia Sampaio, Uberlândia.
Escreve recados de WhatsApp para a Lucy mandar à cliente.
Regras:
- Português do Brasil, frases curtas, sem ponto de exclamação.
- Nunca invente peça, preço, tamanho ou estoque. Use só o JSON recebido.
- Sem modo think: responda direto, sem raciocínio em voz alta.
- Sem “incrível”, “confira”, “desconto imperdível”, emoji, a palavra IA.
- Comece com Olá e o primeiro nome se houver.
- No máximo 8 linhas.
- Feche oferecendo reserva do tamanho ou prova na Rua Rodolfo Correa, 385."""

ADS_SYSTEM = """Você é a voz da boutique Gláucia Sampaio para anúncio.
Português do Brasil. Luxo quieto. Sem gritaria, sem emoji, sem a palavra IA, sem “imperdível”.
Nunca invente peça, preço ou estoque — só o JSON.
Formato de resposta, exatamente:

GOOGLE_TITULOS
- (máx 30 caracteres cada, 8 linhas)

GOOGLE_TEXTOS
- (máx 90 caracteres cada, 4 linhas)

INSTAGRAM
(legenda, 5–8 linhas, no máximo 3 hashtags no fim)

FACEBOOK
(texto principal, 4–6 linhas, convite a WhatsApp ou à Rua Rodolfo Correa)

Não escreva mais nada fora desses blocos."""


def ollama_json(path: str, payload: dict | None = None, timeout: int = 60) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{OLLAMA}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="GET" if data is None else "POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def chat(system: str, prompt: str) -> str:
    models = [MODEL]
    if MODEL != "qwen3.5:9b":
        models.append("qwen3.5:9b")
    last = None
    for name in models:
        try:
            payload = {
                    "model": name,
                    "stream": False,
                    "keep_alive": "24h",
                    "options": {"temperature": 0.3, "num_ctx": 2048, "num_predict": 280, "top_p": 0.8},
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                }
            try:
                data = ollama_json("/api/chat", {**payload, "think": False}, timeout=90)
            except Exception:
                data = ollama_json("/api/chat", payload, timeout=90)
            return str((data.get("message") or {}).get("content") or "").strip()
        except Exception as e:
            last = e
    raise last or RuntimeError("ollama")


def catalog_prompt(body: dict, extra: str) -> str:
    picks = (body.get("picks") or [])[:4]
    return "\n".join(
        [
            f"Pedido: {body.get('query') or '—'}",
            f"Cliente: {body.get('name') or '—'}",
            f"Tamanho: {body.get('size') or '—'}",
            f"Ocasião: {body.get('occasion') or 'casamento / madrinha / all white'}",
            "Peças (únicas permitidas):",
            json.dumps(picks, ensure_ascii=False, indent=2),
            extra,
        ]
    )


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(fmt % args)

    def _send(self, code: int, body: dict) -> None:
        raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, x-maison-key")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        if code != 204:
            self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self._send(204, {})

    def do_GET(self) -> None:
        if self.path != "/health":
            self._send(404, {"ok": False})
            return
        try:
            tags = ollama_json("/api/tags", timeout=5)
            names = [m.get("name") for m in tags.get("models") or []]
            self._send(200, {"ok": True, "model": MODEL, "models": names})
        except Exception:
            self._send(503, {"ok": False, "error": "ollama offline"})

    def do_POST(self) -> None:
        if KEY and self.headers.get("x-maison-key") != KEY:
            self._send(401, {"ok": False, "error": "key"})
            return
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            self._send(400, {"ok": False, "error": "json"})
            return
        try:
            if self.path == "/recado":
                draft = chat(SYSTEM, catalog_prompt(body, "Escreva o recado agora."))
                self._send(200, {"ok": True, "draft": draft, "model": MODEL})
                return
            if self.path == "/anuncio":
                copy = chat(ADS_SYSTEM, catalog_prompt(body, "Escreva os anúncios agora."))
                self._send(200, {"ok": True, "draft": copy, "model": MODEL})
                return
        except urllib.error.HTTPError as e:
            self._send(502, {"ok": False, "error": f"ollama {e.code}"})
            return
        except Exception as e:
            self._send(502, {"ok": False, "error": str(e)})
            return
        self._send(404, {"ok": False})


class Server(ThreadingHTTPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    httpd = Server(("0.0.0.0", PORT), Handler)
    print(f"maison {MODEL} → http://0.0.0.0:{PORT}", flush=True)
    httpd.serve_forever()
