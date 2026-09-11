import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SIZES, type Product } from "./catalog";
import {
  DEFAULT_SHOPIFY_STORE,
  SHOPIFY_SLUG_BY_HANDLE,
  normalizeStoreHost,
  shopifyOrigin,
  type ShopifyProductLive,
  type ShopifyVariantLive,
} from "./shopify";

type RawVariant = {
  id: number;
  option1: string | null;
  option2: string | null;
  available: boolean;
  price: number | string;
  compare_at_price?: number | string | null;
  sku?: string | null;
};

type RawProduct = {
  id?: number;
  handle: string;
  title: string;
  vendor?: string;
  product_type?: string;
  tags?: string[] | string;
  available: boolean;
  url?: string;
  images?: Array<string | { src: string }>;
  options?: { name: string; values: string[] }[];
  variants: RawVariant[];
};

function money(v: number | string | null | undefined) {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return n > 1000 && Number.isInteger(n) && String(v).indexOf(".") < 0 ? n / 100 : n;
}

function toLive(store: string, raw: RawProduct): ShopifyProductLive {
  const sizeOption = raw.options?.find((o) => /tamanho|size/i.test(o.name));
  const colorOption = raw.options?.find((o) => /cor|color/i.test(o.name));
  const variants: ShopifyVariantLive[] = raw.variants.map((v) => ({
    id: v.id,
    size: v.option1 ?? "",
    color: v.option2 ?? v.option1 ?? "",
    available: Boolean(v.available),
    price: money(v.price),
  }));
  return {
    handle: raw.handle,
    title: raw.title,
    available: Boolean(raw.available),
    url: `${shopifyOrigin(store)}/products/${raw.handle}`,
    sizes: sizeOption?.values ?? [...new Set(variants.map((v) => v.size).filter(Boolean))],
    colors: colorOption?.values ?? [...new Set(variants.map((v) => v.color).filter(Boolean))],
    variants,
  };
}

function tagList(tags: string[] | string | undefined) {
  if (!tags) return [];
  return Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim());
}

function categoryOf(type: string): Product["category"] {
  const t = type.toLowerCase();
  if (t.includes("calça") || t.includes("calca") || t.includes("jeans")) return "calca";
  if (t.includes("saia")) return "saia";
  if (t.includes("conjunto")) return "conjunto";
  if (t.includes("praia") || t.includes("biquini") || t.includes("maiô") || t.includes("maio") || t.includes("saida"))
    return "praia";
  if (t.includes("blusa") || t.includes("camisa") || t.includes("top") || t.includes("regata")) return "blusa";
  return "vestido";
}

function occasionsOf(tags: string[], type: string, title: string): string[] {
  const hay = `${tags.join(" ")} ${type} ${title}`.toLowerCase();
  const o: string[] = [];
  if (hay.includes("madrinha")) o.push("madrinhas");
  if (/\boff[- ]?white\b|\ball white\b/.test(hay) || hay.includes("off white")) o.push("all-white");
  if (hay.includes("praia") || hay.includes("al mare") || hay.includes("biquini") || hay.includes("maiô") || hay.includes("saida"))
    o.push("resort");
  if (hay.includes("blazer") || hay.includes("camisa") || hay.includes("alfaiat") || hay.includes("workwear")) o.push("workwear");
  if (hay.includes("longo") || hay.includes("paete") || hay.includes("paetê") || hay.includes("festa")) o.push("eventos-noturnos");
  if (hay.includes("midi") || hay.includes("civil")) o.push("casamento-dia");
  return o;
}

function seasonOf(handle: string, tags: string[], title: string) {
  const hay = `${handle} ${tags.join(" ")} ${title}`.toLowerCase();
  if (hay.includes("verao-27") || hay.includes("verão 27") || hay.includes("verao 27")) return "Verão 27";
  if (hay.includes("inverno-26") || hay.includes("inverno 26")) return "Inverno 26";
  if (hay.includes("verao-26") || hay.includes("verão 26")) return "Verão 26";
  if (hay.includes("al-mare") || hay.includes("alto-verao") || hay.includes("alto verão")) return "Al Mare";
  return "Casa";
}

function mapCatalogProduct(raw: RawProduct): Product {
  const tags = tagList(raw.tags);
  const v0 = raw.variants[0];
  const price = money(v0?.price);
  const compare = money(v0?.compare_at_price);
  const images = (raw.images ?? [])
    .map((img) => (typeof img === "string" ? img : img.src))
    .filter(Boolean)
    .slice(0, 4)
    .map((src) => (src.startsWith("//") ? `https:${src}` : src));
  const colors = (raw.options?.find((o) => /cor|color/i.test(o.name))?.values ?? []).map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    hex: "#c9bfb2",
  }));
  const handle = raw.handle;
  const slug = SHOPIFY_SLUG_BY_HANDLE[handle] ?? handle;
  const title = raw.title.replace(/\s+COLE[CÇ][AÃ]O.*$/i, "").trim();
  const season = seasonOf(handle, tags, raw.title);
  const isVerao27 = season === "Verão 27";
  const hay = `${handle} ${tags.join(" ")} ${raw.title}`.toLowerCase();
  return {
    id: String(raw.id ?? handle),
    slug,
    name: title,
    shortName: title.replace(/^vestido (longo|curto|midi)\s+/i, "").slice(0, 48),
    brand: raw.vendor || "Gláucia Sampaio",
    price,
    compareAt: compare > price * 1.02 ? compare : undefined,
    colors: colors.length ? colors : [{ id: "unico", name: "Única", hex: "#c9bfb2" }],
    sizes: [...SIZES],
    images: images.length ? images : ["/looks/hero-portrait.jpg"],
    category: categoryOf(raw.product_type ?? ""),
    occasions: occasionsOf(tags, raw.product_type ?? "", title),
    collection: season,
    fabric: raw.product_type || "Tecido da coleção",
    stretch: false,
    fit: "Cai verdadeiro ao tamanho. Em dúvida, a shopper responde no WhatsApp.",
    modelNote: "",
    isNew: isVerao27 || /inverno-26|novidade/i.test(hay),
    description: title,
    sku: v0?.sku || handle,
    shopifyHandle: handle,
  };
}

let catalogCache: { at: number; items: Product[] } | null = null;

export function bustShopifyCatalogCache() {
  catalogCache = null;
}

export const listShopifyCatalog = createServerFn({ method: "GET" }).handler(async () => {
  if (catalogCache && Date.now() - catalogCache.at < 60 * 1000) return catalogCache.items;
  const store = DEFAULT_SHOPIFY_STORE;
  const items: Product[] = [];
  for (let page = 1; page <= 12; page += 1) {
    const res = await fetch(`${shopifyOrigin(store)}/products.json?limit=50&page=${page}`, {
      headers: { Accept: "application/json", "User-Agent": "GlauciaSampaioBoutique/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) break;
    const json = (await res.json()) as { products?: RawProduct[] };
    const batch = json.products ?? [];
    if (!batch.length) break;
    items.push(...batch.filter((p) => p.handle && p.variants?.length).map(mapCatalogProduct));
  }
  catalogCache = { at: Date.now(), items };
  return items;
});

export const getShopifyProduct = createServerFn({ method: "GET" })
  .validator(
    z.object({
      handle: z.string().min(1).max(180),
      store: z.string().min(3).max(120).optional(),
    }),
  )
  .handler(async ({ data }): Promise<ShopifyProductLive | null> => {
    const store = normalizeStoreHost(data.store ?? DEFAULT_SHOPIFY_STORE);
    const handle = data.handle.replace(/[^a-z0-9-]/gi, "").toLowerCase();
    const url = `${shopifyOrigin(store)}/products/${handle}.js`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "GlauciaSampaioBoutique/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as RawProduct;
    if (!raw?.handle || !Array.isArray(raw.variants)) return null;
    return toLive(store, raw);
  });

export const pingShopifyStore = createServerFn({ method: "GET" })
  .validator(z.object({ store: z.string().min(3).max(120) }))
  .handler(async ({ data }) => {
    const store = normalizeStoreHost(data.store);
    const res = await fetch(`${shopifyOrigin(store)}/products.json?limit=1`, {
      headers: { Accept: "application/json", "User-Agent": "GlauciaSampaioBoutique/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, store, count: 0 };
    const json = (await res.json()) as { products?: { handle: string; title: string }[] };
    const count = json.products?.length ?? 0;
    return { ok: count > 0, store, count, sample: json.products?.[0]?.title ?? null };
  });
