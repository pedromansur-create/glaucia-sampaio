import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FREE_SHIPPING_FROM, getProduct } from "./catalog";

const SITE = "https://www.glauciasampaio.com";

function mpToken() {
  return (
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ||
    process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ||
    process.env.MP_ACCESS_TOKEN?.trim() ||
    process.env.MERCADO_PAGO_TOKEN?.trim() ||
    ""
  );
}

const Input = z.object({
  name: z.string().min(2),
  cpf: z.string(),
  phone: z.string(),
  cep: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  apt: z.string().optional(),
  uf: z.string().optional(),
  cart: z.array(
    z.object({
      slug: z.string(),
      size: z.string(),
      qty: z.number(),
      title: z.string().optional(),
      price: z.number().optional(),
    }),
  ),
});

export const createMercadoPagoPreference = createServerFn({ method: "POST" })
  .validator(Input)
  .handler(async ({ data }) => {
    const token = mpToken();
    if (!token) return { ok: false as const, error: "mp-token" };

    const cpf = data.cpf.replace(/\D/g, "");
    const phone = data.phone.replace(/\D/g, "");
    if (cpf.length !== 11 || phone.length < 10) return { ok: false as const, error: "dados" };

    const items: { title: string; quantity: number; unit_price: number; currency_id: "BRL" }[] = [];
    let subtotal = 0;
    for (const line of data.cart) {
      const p = getProduct(line.slug);
      const unit = Number(line.price || p?.price || 0);
      if (!unit) continue;
      const qty = Math.max(1, line.qty);
      subtotal += unit * qty;
      items.push({
        title: (line.title || `${p?.brand ?? ""} ${p?.shortName ?? line.slug} ${line.size}`).slice(0, 120),
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
        address: {
          zip_code: (data.cep || "").replace(/\D/g, ""),
          street_name: [data.street, data.number, data.apt].filter(Boolean).join(", "),
          street_number: data.number || "",
        },
      },
      payment_methods: { installments: 10 },
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
        name: data.name,
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
      const why = json.cause?.[0]?.description || json.message || json.error || `mp-${r.status}`;
      return { ok: false as const, error: why };
    }
    return { ok: true as const, url };
  });
