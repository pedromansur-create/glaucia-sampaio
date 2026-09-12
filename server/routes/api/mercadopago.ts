import { createHmac } from "node:crypto";
import { defineEventHandler, getHeader, getQuery, readBody, setResponseStatus } from "h3";

const SITE = "https://www.glauciasampaio.com";

function validSignature(secret: string, signature: string, requestId: string, dataId: string) {
  const parts = Object.fromEntries(
    signature.split(",").map((p) => {
      const [k, ...rest] = p.trim().split("=");
      return [k, rest.join("=")];
    }),
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return expected === hash;
}

async function fetchPayment(id: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token || !id) return null;
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return null;
  return (await r.json()) as {
    id?: number;
    status?: string;
    status_detail?: string;
    transaction_amount?: number;
    payment_method_id?: string;
    external_reference?: string;
    payer?: { identification?: { number?: string } };
  };
}

export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    return {
      ok: true,
      webhook: `${SITE}/api/mercadopago`,
      token: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()),
      secret: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim()),
    };
  }
  if (event.method !== "POST") {
    setResponseStatus(event, 405);
    return { ok: false };
  }

  const query = getQuery(event);
  const body = (await readBody(event).catch(() => ({}))) as {
    type?: string;
    action?: string;
    data?: { id?: string };
  };
  const dataId = String(body?.data?.id || query["data.id"] || query.id || "");
  const type = String(body?.type || query.topic || query.type || "");

  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  const signature = getHeader(event, "x-signature") || "";
  const requestId = getHeader(event, "x-request-id") || "";
  if (secret && signature && dataId) {
    if (!validSignature(secret, signature, requestId, dataId)) {
      setResponseStatus(event, 401);
      return { ok: false, error: "signature" };
    }
  }

  if (type && type !== "payment" && !type.includes("payment")) {
    return { ok: true, ignored: type };
  }
  if (!dataId) return { ok: true, empty: true };

  const payment = await fetchPayment(dataId);
  if (!payment) return { ok: true, pending: true, id: dataId };

  console.info(
    JSON.stringify({
      src: "mercadopago-webhook",
      id: payment.id,
      status: payment.status,
      detail: payment.status_detail,
      method: payment.payment_method_id,
      amount: payment.transaction_amount,
      ref: payment.external_reference,
    }),
  );

  return {
    ok: true,
    id: payment.id,
    status: payment.status,
    method: payment.payment_method_id,
  };
});
