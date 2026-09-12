import { defineEventHandler } from "h3";

export default defineEventHandler(() => ({
  ok: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()),
}));
