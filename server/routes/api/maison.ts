import { defineEventHandler, readBody, setResponseStatus } from "h3";

export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    const url = process.env.OLLAMA_URL?.trim();
    if (!url) return { ok: false, local: false };
    try {
      const r = await fetch(`${url.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(4000) });
      return { ok: r.ok, local: true };
    } catch {
      return { ok: false, local: true, error: "mac offline" };
    }
  }
  if (event.method !== "POST") {
    setResponseStatus(event, 405);
    return { ok: false };
  }
  const url = process.env.OLLAMA_URL?.trim();
  if (!url) {
    setResponseStatus(event, 204);
    return { ok: false, local: false };
  }
  const body = await readBody(event);
  const r = await fetch(`${url.replace(/\/$/, "")}/recado`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
