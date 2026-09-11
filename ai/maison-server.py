#!/usr/bin/env python3
"""Local maison brain. Retrieval stays on the website; this only writes the recado."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

OLLAMA = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("MAISON_MODEL", "qwen3.5:9b")
PORT = int(os.environ.get("PORT", "8787"))

SYSTEM = """Você é a voz da boutique Gláucia Sampaio, Uberlândia.
Escreve recados de WhatsApp para a Lucy mandar à cliente.
Regras:
- Português do Brasil, frases curtas, sem ponto de exclamação.
- Nunca invente peça, preço, tamanho ou estoque. Use só o JSON recebido.
- Sem “incrível”, “confira”, “desconto imperdível”, emoji, a palavra IA.
- Comece com Olá e o primeiro nome se houver.
- No máximo 8 linhas.
- Feche oferecendo reserva do tamanho ou prova na Rua Rodolfo Correa, 385."""


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


def generate(prompt: str) -> str:
    data = ollama_json(
        "/api/chat",
        {
            "model": MODEL,
            "stream": False,
            "options": {"temperature": 0.3, "num_ctx": 2048},
            "messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt},
            ],
        },
        timeout=90,
    )
    return str((data.get("message") or {}).get("content") or "").strip()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(fmt % args)

    def _send(self, code: int, body: dict) -> None:
        raw = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
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
        if self.path != "/recado":
            self._send(404, {"ok": False})
            return
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            self._send(400, {"ok": False, "error": "json"})
            return
        picks = (body.get("picks") or [])[:4]
        prompt = "\n".join(
            [
                f"Pedido: {body.get('query') or '—'}",
                f"Cliente: {body.get('name') or '—'}",
                f"Tamanho: {body.get('size') or '—'}",
                f"Ocasião: {body.get('occasion') or '—'}",
                "Peças (únicas permitidas):",
                json.dumps(picks, ensure_ascii=False, indent=2),
                "Escreva o recado agora.",
            ]
        )
        try:
            draft = generate(prompt)
            self._send(200, {"ok": True, "draft": draft, "model": MODEL})
        except urllib.error.HTTPError as e:
            self._send(502, {"ok": False, "error": f"ollama {e.code}"})
        except Exception as e:
            self._send(502, {"ok": False, "error": str(e)})


if __name__ == "__main__":
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"maison {MODEL} → http://0.0.0.0:{PORT}", flush=True)
    httpd.serve_forever()
