#!/usr/bin/env node
/**
 * Local maison brain for the Mac mini M4.
 * Retrieval stays on the website. This process only writes the recado
 * from pieces the site already chose — never invents a SKU.
 */
import http from "node:http";

const OLLAMA = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const MODEL = process.env.MAISON_MODEL || "qwen2.5:7b";
const PORT = Number(process.env.PORT || 8787);

const SYSTEM = `Você é a voz da boutique Gláucia Sampaio, Uberlândia.
Escreve recados de WhatsApp para a Lucy mandar à cliente.
Regras:
- Português do Brasil, frases curtas, sem ponto de exclamação.
- Nunca invente peça, preço, tamanho ou estoque. Use só o JSON recebido.
- Sem “incrível”, “confira”, “desconto imperdível”, emoji, a palavra IA.
- Comece com Olá e o primeiro nome se houver.
- No máximo 8 linhas.
- Feche oferecendo reserva do tamanho ou prova na Rua Rodolfo Correa, 385.`;

function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

async function generate(prompt) {
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      options: { temperature: 0.3, num_ctx: 2048 },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  const data = await r.json();
  return String(data?.message?.content || "").trim();
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }
  if (req.method === "GET" && req.url === "/health") {
    try {
      const tags = await fetch(`${OLLAMA}/api/tags`).then((r) => r.json());
      json(res, 200, { ok: true, model: MODEL, models: (tags.models || []).map((m) => m.name) });
    } catch {
      json(res, 503, { ok: false, error: "ollama offline" });
    }
    return;
  }
  if (req.method === "POST" && req.url === "/recado") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    let body = {};
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    } catch {
      json(res, 400, { ok: false, error: "json" });
      return;
    }
    const picks = Array.isArray(body.picks) ? body.picks.slice(0, 4) : [];
    const prompt = [
      `Pedido: ${body.query || "—"}`,
      `Cliente: ${body.name || "—"}`,
      `Tamanho: ${body.size || "—"}`,
      `Ocasião: ${body.occasion || "—"}`,
      "Peças (únicas permitidas):",
      JSON.stringify(picks, null, 2),
      "Escreva o recado agora.",
    ].join("\n");
    try {
      const draft = await generate(prompt);
      json(res, 200, { ok: true, draft, model: MODEL });
    } catch (e) {
      json(res, 502, { ok: false, error: String(e.message || e) });
    }
    return;
  }
  json(res, 404, { ok: false });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`maison ${MODEL} → http://0.0.0.0:${PORT}`);
});
