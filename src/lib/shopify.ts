import { WELCOME_CODE } from "./catalog";
export { WELCOME_CODE };

export const DEFAULT_SHOPIFY_STORE = "glaucia-sampaio-3.myshopify.com";
export const SHOPIFY_SHOP = "glaucia-sampaio-3";
export const SHOPIFY_ADMIN = "https://admin.shopify.com/store/glaucia-sampaio-3";

export const SHOPIFY_HANDLES: Record<string, string> = {
  "vestido-longo-ivy-basque": "vestido-longo-ivy-basque-colecao-verao-27",
  "vestido-longo-mayra-gola": "vestido-longo-mayra-gola-colecao-verao-27",
  "vestido-longo-pamela-tafeta": "vestido-longo-pamela-tafeta-colecao-verao-27",
  "vestido-longo-lola-crepe": "vestido-longo-lola-crepe-colecao-verao-27",
  "vestido-longo-isabela-babado": "vestido-longo-isabela-babado-colecao-verao-27",
  "vestido-longo-iris-paete": "vestido-longo-iris-paete-colecao-verao-27",
  "vestido-longo-kate-linho": "vestido-longo-kate-linho-colecao-verao-27",
  "vestido-longo-bruna-babado": "vestido-longo-bruna-babado-colecao-verao-27",
  "vestido-longo-diana-gola-alta": "vestido-longo-diana-gola-alta-colecao-verao-27",
  "conjunto-claire-babados": "conjunto-claire-babados-colecao-verao-27",
  "vestido-curto-marcela-nesgas": "vestido-curto-marcela-nesgas-colecao-verao-27",
  "blusa-eva-drapeada": "blusa-eva-drapeada-colecao-verao-27",
  "saida-de-praia-corsega": "saida-de-praia-corsega-al-mare-colecao-alto-verao-23",
  "saia-longa-sardegna": "saia-longa-sardegna-al-mare-colecao-alto-verao-23",
  "calca-cos-fivela": "calca-cos-fivela-colecao-inverno-23",
  "calca-detalhe-prega": "calca-detalhe-prega-colecao-inverno-23",
  "top-drape-alca-degrade": "top-drape-alca-estampa-degrade-colecao-inverno-23",
  "conjunto-barbara": "conjunto-barbara-colecao-inverno-23",
};

export const SHOPIFY_SLUG_BY_HANDLE: Record<string, string> = Object.fromEntries(
  Object.entries(SHOPIFY_HANDLES).map(([slug, handle]) => [handle, slug]),
);

export type ShopifyVariantLive = {
  id: number;
  size: string;
  color: string;
  available: boolean;
  price: number;
};

export type ShopifyProductLive = {
  handle: string;
  title: string;
  available: boolean;
  url: string;
  sizes: string[];
  colors: string[];
  variants: ShopifyVariantLive[];
  images: string[];
};

const SIZE_ALIASES: Record<string, string[]> = {
  pp: ["pp", "34"],
  p: ["p", "36"],
  m: ["m", "38"],
  g: ["g", "40"],
  gg: ["gg", "42", "44"],
  "34": ["34", "pp"],
  "36": ["36", "p"],
  "38": ["38", "m"],
  "40": ["40", "g"],
  "42": ["42", "gg"],
  "46": ["46", "gg"],
};

export function shopifyHandleFor(slug: string) {
  return SHOPIFY_HANDLES[slug] ?? slug;
}

export function normalizeStoreHost(input: string) {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/[^\w.-]/g, "");
  if (!/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return DEFAULT_SHOPIFY_STORE;
  return host;
}

export function shopifyOrigin(store: string) {
  return `https://${normalizeStoreHost(store)}`;
}

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sizeKeys(size: string) {
  const n = norm(size);
  return new Set(SIZE_ALIASES[n] ?? [n]);
}

function colorClose(a: string, b: string) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return true;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const pairs = [
    ["ivory", "sunny"],
    ["off white", "offwhite"],
    ["mar e areia", "animal print"],
    ["coral capri", "coral"],
    ["coral nevoa", "pink"],
    ["degrade", "pink"],
  ];
  return pairs.some(([p, q]) => (x.includes(p) && y.includes(q)) || (x.includes(q) && y.includes(p)));
}

export function isSizeAvailable(live: ShopifyProductLive, size: string, color?: string) {
  const keys = sizeKeys(size);
  return live.variants.some(
    (v) =>
      keys.has(norm(v.size)) &&
      v.available &&
      (!color || live.colors.length < 2 || colorClose(v.color, color)),
  );
}

export function matchShopifyVariant(
  live: ShopifyProductLive,
  size: string,
  color: string,
): ShopifyVariantLive | undefined {
  const keys = sizeKeys(size);
  const sized = live.variants.filter((v) => keys.has(norm(v.size)));
  const pool = sized.length ? sized : live.variants;
  return (
    pool.find((v) => colorClose(v.color, color) && v.available) ??
    pool.find((v) => colorClose(v.color, color)) ??
    pool.find((v) => v.available) ??
    pool[0]
  );
}

export function shopifyCartUrl(
  store: string,
  cart: { variantId?: number; qty: number }[],
  discount?: string | null,
  checkout?: {
    email?: string;
    firstName?: string;
    phone?: string;
    zip?: string;
    address1?: string;
    city?: string;
    province?: string;
    cpf?: string;
  } | null,
) {
  const lines = cart
    .filter((i) => i.variantId)
    .map((i) => `${i.variantId}:${Math.max(1, i.qty)}`);
  if (!lines.length) return null;
  const origin = shopifyOrigin(store);
  const params = new URLSearchParams();
  if (checkout?.email) params.set("checkout[email]", checkout.email);
  if (checkout?.firstName) params.set("checkout[shipping_address][first_name]", checkout.firstName);
  if (checkout?.phone) params.set("checkout[shipping_address][phone]", checkout.phone);
  if (checkout?.zip) params.set("checkout[shipping_address][zip]", checkout.zip);
  if (checkout?.address1) params.set("checkout[shipping_address][address1]", checkout.address1);
  if (checkout?.city) params.set("checkout[shipping_address][city]", checkout.city);
  if (checkout?.province) params.set("checkout[shipping_address][province]", checkout.province);
  if (checkout?.cpf) {
    params.set("attributes[CPF]", checkout.cpf);
    params.set("note", `CPF ${checkout.cpf}`);
  }
  params.set("checkout[shipping_address][country]", "Brazil");
  const qs = params.toString();
  const cartPath = `/cart/${lines.join(",")}${qs ? `?${qs}` : ""}`;
  if (discount) {
    return `${origin}/discount/${encodeURIComponent(discount)}?redirect=${encodeURIComponent(cartPath)}`;
  }
  return `${origin}${cartPath}`;
}

export function shopifyReadyCount(cart: { variantId?: number }[]) {
  return cart.filter((i) => i.variantId).length;
}
