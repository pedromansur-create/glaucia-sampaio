import { defineEventHandler, readBody, setResponseStatus } from "h3";

const KINDS = new Set(["recado", "anuncio", "caixa"]);
const FALLBACK = "https://musical-far-ftp-arthritis.trycloudflare.com";

function maisonUrl() {
  const env = process.env.OLLAMA_URL?.trim() || "";
  if (!env || env.includes("restore-are-ways-labels")) return FALLBACK;
  return env;
}

export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    const url = maisonUrl();
    try {
      const r = await fetch(`${url.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(4000) });
      const json = (await r.json().catch(() => ({}))) as { nodes?: unknown; exclusive?: string[] };
      return { ok: r.ok, local: true, exclusive: json.exclusive ?? ["site", "caixarcs"], nodes: json.nodes };
    } catch {
      return { ok: false, local: true, error: "mac offline" };
    }
  }
  if (event.method !== "POST") {
    setResponseStatus(event, 405);
    return { ok: false };
  }
  const url = maisonUrl();
  const body = ((await readBody(event)) ?? {}) as { kind?: string };
  const kind = KINDS.has(body.kind ?? "") ? body.kind : "recado";
  const key = process.env.MAISON_KEY?.trim();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["x-maison-key"] = key;
  const r = await fetch(`${url.replace(/\/$/, "")}/${kind}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(45000),
  });
  const json = (await r.json().catch(() => ({}))) as { ok?: boolean; draft?: string };
  if (!r.ok || !json.draft) {
    setResponseStatus(event, 502);
    return { ok: false };
  }
  return { ok: true, draft: json.draft, local: true };
});
