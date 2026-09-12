#!/usr/bin/env python3
"""Cérebro local: só site Gláucia Sampaio + CaixaRCS. Nada de chat pessoal."""
from __future__ import annotations

import json
import os
import threading
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8787"))
MODEL = os.environ.get("MAISON_MODEL", "gs-maison")
KEY = os.environ.get("MAISON_KEY", "").strip()
URLS = [
    u.strip().rstrip("/")
    for u in os.environ.get("OLLAMA_URLS", os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")).split(",")
    if u.strip()
]
ORIGINS = {
    o.strip()
    for o in os.environ.get(
        "MAISON_ORIGINS",
        "https://www.glauciasampaio.com,https://glauciasampaio.com,https://www.caixarcs.com,https://caixarcs.com",
    ).split(",")
    if o.strip()
}

SYSTEM = """Você é a voz da boutique Gláucia Sampaio, Uberlândia.
Escreve recados de WhatsApp para a Lucy mandar à cliente.
Regras:
- Português do Brasil, frases curtas, sem ponto de exclamação.
- Nunca invente peça, preço, tamanho ou estoque. Use só o JSON recebido.
- Sem modo think: responda direto, sem raciocínio em voz alta.
- Sem “incrível”, “confira”, “desconto imperdível”, emoji, a palavra IA.
- Comece com Olá e o primeiro nome se houver.
- No máximo 8 linhas.
- Feche oferecendo reserva do tamanho ou prova na Rua Rodolfo Correa, 385.
- Este modelo só atende o site e o caixa da loja."""

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

CAIXA_SYSTEM = """Você é a voz interna do CaixaRCS da Gláucia Sampaio.
Escreve recado curto para a vendedora no caixa: tamanho, estoque, próxima peça.
Regras:
- Português do Brasil, frases curtas.
- Nunca invente peça, preço, tamanho ou estoque. Use só o JSON.
- Sem emoji, sem a palavra IA, sem tom de anúncio.
- No máximo 6 linhas.
- Se faltar dado, diga o que a vendedora deve perguntar à cliente."""

_lock = threading.Lock()
_cursor = 0


def ollama_json(base: str, path: str, payload: dict | None = None, timeout: int = 60) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{base}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="GET" if data is None else "POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def backends() -> list[str]:
    global _cursor
    with _lock:
        n = len(URLS)
        order = URLS[_cursor:] + URLS[:_cursor]
        _cursor = (_cursor + 1) % n if n else 0
    return order


def ping(base: str, timeout: float = 0.8) -> dict:
    try:
        tags = ollama_json(base, "/api/tags", timeout=timeout)
        names = [m.get("name") for m in tags.get("models") or []]
        return {"ok": True, "url": base, "models": names}
    except Exception as e:
        return {"ok": False, "url": base, "error": str(e)[:80]}


def live_urls() -> list[str]:
    if not URLS:
        return []
    with ThreadPoolExecutor(max_workers=len(URLS)) as ex:
        rows = list(ex.map(lambda u: ping(u, 0.8), URLS))
    return [r["url"] for r in rows if r["ok"]]


def backends() -> list[str]:
    live = live_urls()
    pool = live or URLS
    global _cursor
    with _lock:
        n = len(pool)
        order = pool[_cursor % n :] + pool[: _cursor % n] if n else []
        _cursor = (_cursor + 1) % n if n else 0
    return order


def chat(system: str, prompt: str) -> str:
    last: Exception | None = None
    for base in backends():
        models = [MODEL]
        if MODEL != "qwen3.5:9b":
            models.append("qwen3.5:9b")
        for name in models:
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
                try:
                    data = ollama_json(base, "/api/chat", {**payload, "think": False}, timeout=90)
                except Exception:
                    data = ollama_json(base, "/api/chat", payload, timeout=90)
                text = str((data.get("message") or {}).get("content") or "").strip()
                if text:
                    return text
            except Exception as e:
                last = e
    raise last or RuntimeError("cluster offline")


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

    def _cors(self) -> None:
        origin = self.headers.get("Origin") or ""
        if origin in ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Headers", "Content-Type, x-maison-key")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Vary", "Origin")

    def _send(self, code: int, body: dict) -> None:
        raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors()
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
        with ThreadPoolExecutor(max_workers=max(1, len(URLS))) as ex:
            nodes = list(ex.map(lambda u: ping(u, 0.8), URLS))
        self._send(
            200 if any(n["ok"] for n in nodes) else 503,
            {"ok": any(n["ok"] for n in nodes), "model": MODEL, "exclusive": ["site", "caixarcs"], "nodes": nodes},
        )

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
        kind = self.path.strip("/")
        try:
            if kind == "recado":
                draft = chat(SYSTEM, catalog_prompt(body, "Escreva o recado agora."))
                self._send(200, {"ok": True, "draft": draft, "model": MODEL})
                return
            if kind == "anuncio":
                copy = chat(ADS_SYSTEM, catalog_prompt(body, "Escreva os anúncios agora."))
                self._send(200, {"ok": True, "draft": copy, "model": MODEL})
                return
            if kind == "caixa":
                draft = chat(CAIXA_SYSTEM, catalog_prompt(body, "Escreva o recado do caixa agora."))
                self._send(200, {"ok": True, "draft": draft, "model": MODEL})
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
    print(f"maison {MODEL} cluster {len(URLS)} → http://0.0.0.0:{PORT}", flush=True)
    print("exclusivo: site + caixarcs", flush=True)
    httpd.serve_forever()
