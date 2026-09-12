import { defineEventHandler } from "h3";

type Variant = { available?: boolean; option1?: string | null; sku?: string | null };
type Product = { handle: string; variants?: Variant[] };

let cache: { at: number; body: Record<string, unknown> } | null = null;

export function bustStockCache() {
  cache = null;
}

async function pull() {
  const products: Product[] = [];
  for (let page = 1; page <= 8; page += 1) {
    const r = await fetch(`https://glaucia-sampaio-3.myshopify.com/products.json?limit=250&page=${page}`, {
      headers: { Accept: "application/json", "User-Agent": "GlauciaSampaioBoutique/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) break;
    const json = (await r.json()) as { products?: Product[] };
    const batch = json.products ?? [];
    if (!batch.length) break;
    products.push(...batch);
  }
  let variants = 0;
  let available = 0;
  let sku = 0;
  for (const p of products) {
    for (const v of p.variants ?? []) {
      variants += 1;
      if (v.available) available += 1;
      if (String(v.sku || "").trim()) sku += 1;
    }
  }
  return {
    ok: products.length > 0,
    at: new Date().toISOString(),
    source: "shopify",
    via: "bling → shopify → vitrine",
    products: products.length,
    variants,
    available,
    unavailable: variants - available,
    sku,
    webhook: "/api/shopify/webhook",
  };
}

export default defineEventHandler(async () => {
  if (cache && Date.now() - cache.at < 15_000) return cache.body;
  const body = await pull();
  cache = { at: Date.now(), body };
  return body;
});
