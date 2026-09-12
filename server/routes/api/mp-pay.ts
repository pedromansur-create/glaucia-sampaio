import { defineEventHandler, getHeader, readBody, readFormData, sendRedirect, setHeader, setResponseStatus } from "h3";

const SITE = "https://www.glauciasampaio.com";
const FREE_SHIPPING_FROM = 1000;
const SHOP = "https://glaucia-sampaio-3.myshopify.com";
const FLASH_ENDS = Date.parse("2026-09-15T00:00:00-03:00");
const FLASH_RATE = 0.25;

function mpToken() {
  const env = process.env as Record<string, string | undefined>;
  return (
    env["MERCADO_PAGO_ACCESS_TOKEN"]?.trim() ||
    env["MERCADOPAGO_ACCESS_TOKEN"]?.trim() ||
    env["MP_ACCESS_TOKEN"]?.trim() ||
    env["MERCADO_PAGO_TOKEN"]?.trim() ||
    ""
  );
}

async function shopifyPrice(slug: string) {
  const handle = slug.replace(/^\/+|\/+$/g, "");
  if (!handle) return 0;
  try {
    const r = await fetch(`${SHOP}/products/${encodeURIComponent(handle)}.json`, {
      headers: { Accept: "application/json", "User-Agent": "GlauciaSampaioBoutique/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return 0;
    const json = (await r.json()) as { product?: { title?: string; variants?: { price?: string }[] } };
    const n = Number.parseFloat(json.product?.variants?.[0]?.price || "0");
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Access-Control-Allow-Origin", SITE);
  setHeader(event, "Access-Control-Allow-Methods", "POST,OPTIONS");
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type");
  if (event.method === "OPTIONS") {
    setResponseStatus(event, 204);
    return null;
  }
  if (event.method !== "POST") {
    setResponseStatus(event, 405);
    return { ok: false };
  }

  const token = mpToken();
  if (!token) {
    setResponseStatus(event, 503);
    return { ok: false, error: "mp-token" };
  }

  const ctype = (getHeader(event, "content-type") || "").toLowerCase();
  let data: {
    name?: string;
    cpf?: string;
    phone?: string;
    cep?: string;
    city?: string;
    street?: string;
    number?: string;
    apt?: string;
    uf?: string;
    cart?: { slug?: string; size?: string; qty?: number; title?: string; price?: number }[] | string;
  } = {};
  if (ctype.includes("application/json")) {
    data = ((await readBody(event).catch(() => ({}))) ?? {}) as typeof data;
  } else {
    const form = await readFormData(event).catch(() => null);
    if (form) {
      data = {
        name: String(form.get("name") || ""),
        cpf: String(form.get("cpf") || ""),
        phone: String(form.get("phone") || ""),
        cep: String(form.get("cep") || ""),
        city: String(form.get("city") || ""),
        street: String(form.get("street") || ""),
        number: String(form.get("number") || ""),
        apt: String(form.get("apt") || ""),
        uf: String(form.get("uf") || ""),
        cart: String(form.get("cart") || "[]"),
      };
    }
  }
  if (typeof data.cart === "string") {
    try {
      data.cart = JSON.parse(data.cart) as typeof data.cart;
    } catch {
      data.cart = [];
    }
  }

  const name = String(data.name || "").trim();
  const cpf = String(data.cpf || "").replace(/\D/g, "");
  const phone = String(data.phone || "").replace(/\D/g, "");
  if (name.length < 2 || cpf.length !== 11 || phone.length < 10) {
    setResponseStatus(event, 400);
    return { ok: false, error: "dados" };
  }

  const items: { title: string; quantity: number; unit_price: number; currency_id: "BRL" }[] = [];
  let subtotal = 0;
  for (const line of data.cart || []) {
    let unit = Number(line.price || 0);
    if (!unit && line.slug) {
      unit = await shopifyPrice(line.slug);
      if (unit && Date.now() < FLASH_ENDS) unit = Math.round(unit * (1 - FLASH_RATE) * 100) / 100;
    }
    if (!unit) continue;
    const qty = Math.max(1, Number(line.qty || 1));
    subtotal += unit * qty;
    items.push({
      title: String(line.title || `${line.slug || "peça"} ${line.size || ""}`).slice(0, 120),
      quantity: qty,
      unit_price: Number(unit.toFixed(2)),
      currency_id: "BRL",
    });
  }
  if (!items.length) {
    setResponseStatus(event, 400);
    return { ok: false, error: "sacola" };
  }
  if (subtotal > 0 && subtotal < FREE_SHIPPING_FROM) {
    items.push({ title: "Frete", quantity: 1, unit_price: 45, currency_id: "BRL" });
  }

  const payload = {
    items,
    payer: {
      first_name: name.split(" ")[0],
      last_name: name.split(" ").slice(1).join(" ") || name.split(" ")[0],
      identification: { type: "CPF", number: cpf },
      phone: { area_code: phone.slice(0, 2), number: phone.slice(2) },
      address: {
        zip_code: String(data.cep || "").replace(/\D/g, ""),
        street_name: [data.street, data.number, data.apt].filter(Boolean).join(", "),
        street_number: String(data.number || ""),
      },
    },
    payment_methods: {
      installments: 10,
      default_installments: 1,
    },
    statement_descriptor: "GLAUCIA SAMPAIO",
    back_urls: {
      success: `${SITE}/pedido?status=ok`,
      pending: `${SITE}/pedido?status=pix`,
      failure: `${SITE}/checkout?status=falhou`,
    },
    notification_url: `${SITE}/api/mercadopago`,
    metadata: {
      cpf,
      phone,
      name,
      cep: data.cep,
      city: data.city,
      uf: data.uf,
      number: data.number,
      apt: data.apt,
    },
    external_reference: `gs-${Date.now()}`,
  };

  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });
  const json = (await r.json().catch(() => ({}))) as {
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
    error?: string;
    cause?: { description?: string }[];
  };
  const url = json.init_point || json.sandbox_init_point;
  if (!r.ok || !url) {
    setResponseStatus(event, 502);
    return { ok: false, error: json.cause?.[0]?.description || json.message || json.error || `mp-${r.status}` };
  }
  if (!ctype.includes("application/json")) {
    return sendRedirect(event, url, 302);
  }
  return { ok: true, url };
});
