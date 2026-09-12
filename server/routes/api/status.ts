import { defineEventHandler } from "h3";

async function ping(url: string, timeout = 6000) {
  const t = Date.now();
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { Accept: "application/json" } });
    return { ok: r.ok || (r.status > 0 && r.status < 500), ms: Date.now() - t, status: r.status };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, error: String((e as Error).message || e) };
  }
}

export default defineEventHandler(async () => {
  const raw = process.env.OLLAMA_URL?.replace(/\/$/, "") || "";
  const ollama = /^https?:\/\//i.test(raw) && !raw.includes("APP_USR") ? raw : "https://musical-far-ftp-arthritis.trycloudflare.com";
  const [shopify, caixarcs, maison] = await Promise.all([
    ping("https://glaucia-sampaio-3.myshopify.com/products.json?limit=1"),
    ping("https://www.caixarcs.com/"),
    ollama ? ping(`${ollama}/health`) : Promise.resolve({ ok: false, ms: 0, error: "OLLAMA_URL" }),
  ]);
  return {
    ok: shopify.ok,
    at: new Date().toISOString(),
    shopify,
    caixarcs,
    maison: { ...maison, configured: Boolean(ollama) },
  };
});
