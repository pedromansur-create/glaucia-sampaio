import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FREE_SHIPPING_FROM, getProduct } from "./catalog";
import { salePrice } from "./flash";
import { listShopifyCatalog } from "./shopify.functions";

const SITE = "https://www.glauciasampaio.com";

const Input = z.object({
  name: z.string().min(2),
  cpf: z.string(),
  phone: z.string(),
  cep: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  uf: z.string().optional(),
  cart: z.array(
    z.object({
      slug: z.string(),
      size: z.string(),
      qty: z.number(),
    }),
  ),
});

export const createMercadoPagoPreference = createServerFn({ method: "POST" })
  .validator(Input)
  .handler(async ({ data }) => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (!token) return { ok: false as const, error: "mp-token" };

    const cpf = data.cpf.replace(/\D/g, "");
    const phone = data.phone.replace(/\D/g, "");
    if (cpf.length !== 11 || phone.length < 10) return { ok: false as const, error: "dados" };

    const live = await listShopifyCatalog().catch(() => []);
    const find = (slug: string) => live.find((p) => p.slug === slug || p.shopifyHandle === slug) ?? getProduct(slug);

    const items: { title: string; quantity: number; unit_price: number; currency_id: "BRL" }[] = [];
    let subtotal = 0;
    for (const line of data.cart) {
      const p = find(line.slug);
      if (!p) continue;
      const unit = salePrice(p.price, p.compareAt);
      const qty = Math.max(1, line.qty);
      subtotal += unit * qty;
      items.push({
        title: `${p.brand} ${p.shortName} ${line.size}`.slice(0, 120),
        quantity: qty,
        unit_price: Number(unit.toFixed(2)),
        currency_id: "BRL",
      });
    }
    if (!items.length) return { ok: false as const, error: "sacola" };
    if (subtotal > 0 && subtotal < FREE_SHIPPING_FROM) {
      items.push({ title: "Frete", quantity: 1, unit_price: 45, currency_id: "BRL" });
    }

    const payload = {
      items,
      payer: {
        first_name: data.name.split(" ")[0],
        last_name: data.name.split(" ").slice(1).join(" ") || data.name.split(" ")[0],
        identification: { type: "CPF", number: cpf },
        phone: { area_code: phone.slice(0, 2), number: phone.slice(2) },
        address: { zip_code: (data.cep || "").replace(/\D/g, ""), street_name: data.street || "" },
      },
      payment_methods: {
        installments: 10,
        default_payment_method_id: "pix",
      },
      statement_descriptor: "GLAUCIA SAMPAIO",
      auto_return: "approved",
      back_urls: {
        success: `${SITE}/pedido?status=ok`,
        pending: `${SITE}/pedido?status=pix`,
        failure: `${SITE}/checkout?status=falhou`,
      },
      notification_url: `${SITE}/api/mercadopago`,
      metadata: { cpf, phone, name: data.name, cep: data.cep, city: data.city, uf: data.uf },
      external_reference: `gs-${Date.now()}`,
    };

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await r.json().catch(() => ({}))) as { init_point?: string; sandbox_init_point?: string; message?: string };
    const url = json.init_point || json.sandbox_init_point;
    if (!r.ok || !url) return { ok: false as const, error: json.message || "mp" };
    return { ok: true as const, url };
  });
