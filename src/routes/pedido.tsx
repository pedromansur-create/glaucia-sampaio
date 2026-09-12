import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useShop } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/pedido")({
  head: () =>
    pageHead({
      title: "Pedido",
      description: "Pedido na Gláucia Sampaio.",
      path: "/pedido",
      noindex: true,
    }),
  validateSearch: (s: Record<string, unknown>) => ({
    status: typeof s.status === "string" ? s.status : "ok",
  }),
  component: Pedido,
});

function Pedido() {
  const { status } = Route.useSearch();
  const clearCart = useShop((s) => s.clearCart);
  useEffect(() => {
    if (status === "ok" || status === "pix") clearCart();
  }, [status, clearCart]);
  const pending = status === "pix";
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-[11px] tracking-[0.28em] uppercase">
        {pending ? "PIX gerado" : "Pedido recebido"}
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-muted">
        {pending
          ? "Pague o PIX no Mercado Pago. A nota sai no CPF informado."
          : "O PIX caiu na conta Mercado Pago da casa. A shopper confirma no WhatsApp."}
      </p>
      <Link to="/" className="mt-12 inline-block text-[11px] tracking-[0.2em] uppercase underline">
        Voltar
      </Link>
    </div>
  );
}
