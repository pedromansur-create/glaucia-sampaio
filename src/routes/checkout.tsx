import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { ShopifyPayButton } from "@/components/ios";
import { BOUTIQUE, FREE_SHIPPING_FROM, WELCOME_CODE, getProduct, whatsappUrl } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";
import { cartTotals, useShop } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout")({
  head: () =>
    pageHead({
      title: "Checkout",
      description: "Finalize sua compra na Gláucia Sampaio.",
      path: "/checkout",
      noindex: true,
    }),
  component: Checkout,
});

function Checkout() {
  const cart = useShop((s) => s.cart);
  const welcomeApplied = useShop((s) => s.welcomeApplied);
  const welcomeUsed = useShop((s) => s.welcomeUsed);
  const applyWelcome = useShop((s) => s.applyWelcome);
  const totals = useMemo(() => cartTotals(cart, welcomeApplied), [cart, welcomeApplied]);

  useEffect(() => {
    if (!welcomeUsed && !welcomeApplied) applyWelcome();
  }, [welcomeUsed, welcomeApplied, applyWelcome]);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link to="/" className="block text-center text-[11px] tracking-[0.42em] uppercase">
        Gláucia Sampaio
      </Link>
      <h1 className="sr-only">Checkout</h1>
      <p className="mt-14 text-[11px] tracking-[0.28em] uppercase">Sacola</p>
      {cart.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Vazia.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {totals.lines.map(({ item, product, line }) =>
            product ? (
              <li key={`${item.slug}${item.size}`} className="flex gap-3 text-sm">
                <img src={product.images[0]} alt="" className="h-20 w-14 object-cover object-top" />
                <div className="min-w-0 flex-1">
                  <p className="truncate uppercase tracking-[0.08em]">{product.shortName}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {item.size} · {item.qty}
                  </p>
                </div>
                <span className="tabular-nums">{formatBRL(line)}</span>
              </li>
            ) : (
              <li key={item.slug}>{getProduct(item.slug)?.name}</li>
            ),
          )}
        </ul>
      )}
      {totals.discount > 0 && (
        <p className="mt-6 text-[11px] tracking-[0.12em] text-muted uppercase">
          {totals.code === "FLASH25" ? "25% até meia-noite" : `${WELCOME_CODE} 10% aplicado`}
        </p>
      )}
      <div className="mt-6 space-y-1 text-sm">
        <p className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="tabular-nums">{formatBRL(totals.subtotal)}</span>
        </p>
        {totals.discount > 0 && (
          <p className="flex justify-between">
            <span className="text-muted">Cupom</span>
            <span className="tabular-nums">− {formatBRL(totals.discount)}</span>
          </p>
        )}
        <p className="flex justify-between">
          <span className="text-muted">Frete</span>
          <span>{totals.shipping === 0 ? "Grátis" : formatBRL(totals.shipping)}</span>
        </p>
        <p className="flex justify-between pt-2">
          <span>Total</span>
          <span className="tabular-nums">{formatBRL(totals.total)}</span>
        </p>
      </div>
      <ShopifyPayButton className="mt-8" />
      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
        PIX primeiro. 10x sem juros. Frete grátis acima de {formatBRL(FREE_SHIPPING_FROM)}. {BOUTIQUE.cnpj}.{" "}
        <Link to="/trocas" className="underline">
          7 dias
        </Link>
        .{" "}
        <a href={whatsappUrl("Olá, preciso de ajuda no checkout.")} className="underline">
          Personal shopper
        </a>
        .
      </p>
    </div>
  );
}
