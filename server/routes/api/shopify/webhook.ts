import { createHmac, timingSafeEqual } from "node:crypto";
import { defineEventHandler, getHeader, readRawBody, setResponseStatus } from "h3";
import { bustShopifyCatalogCache } from "../../../../src/lib/shopify.functions";
import { bustStockCache } from "../stock";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    return { ok: true, hook: "shopify-inventory" };
  }
  if (event.method !== "POST") {
    setResponseStatus(event, 405);
    return { ok: false };
  }

  const raw = (await readRawBody(event)) ?? "";
  const hmac = getHeader(event, "x-shopify-hmac-sha256") ?? "";
  const topic = getHeader(event, "x-shopify-topic") ?? "";
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET ?? "";

  if (secret && hmac) {
    const digest = createHmac("sha256", secret).update(raw).digest("base64");
    if (!safeEqual(digest, hmac)) {
      setResponseStatus(event, 401);
      return { ok: false, error: "hmac" };
    }
  }

  if (
    /inventory|product|order|fulfillment/i.test(topic) ||
    !topic
  ) {
    bustShopifyCatalogCache();
    bustStockCache();
  }

  setResponseStatus(event, 200);
  return { ok: true, topic: topic || "unknown" };
});
