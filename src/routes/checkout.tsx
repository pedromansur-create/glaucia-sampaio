import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  const clearCart = useShop((s) => s.clearCart);
  const totals = useMemo(() => cartTotals(cart, welcomeApplied), [cart, welcomeApplied]);
  const [pay, setPay] = useState<"pix" | "card">("pix");
  const [done, setDone] = useState<string | null>(null);
  const [payErr, setPayErr] = useState("");

  useEffect(() => {
    if (!welcomeUsed && !welcomeApplied) applyWelcome();
  }, [welcomeUsed, welcomeApplied, applyWelcome]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPayErr("");
    if (cart.length === 0) {
      setPayErr("Sacola vazia.");
      return;
    }
    const id = `GS-${Date.now().toString().slice(-8)}`;
    clearCart();
    setDone(id);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-[11px] tracking-[0.28em] text-subtle uppercase">Pedido recebido</p>
        <h1 className="mt-3 font-display text-5xl">{done}</h1>
        <p className="mt-4 text-sm text-muted">
          {pay === "pix"
            ? "O PIX da casa chega no seu e-mail em instantes. A peça sai com o mesmo cuidado da loja."
            : "Pagamento autorizado. Você recebe o comprovante por e-mail."}
        </p>
        <Link to="/" className="mt-8 inline-flex rounded-pill bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase">
          Continuar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-6 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-10">
      <form onSubmit={onSubmit} className="space-y-5">
        <Link to="/" className="block text-[11px] tracking-[0.42em] uppercase">
          Gláucia Sampaio
        </Link>
        <h1 className="mt-10 text-[12px] tracking-[0.28em] uppercase">Checkout</h1>
        <p className="text-sm leading-relaxed text-muted">
          Frete grátis acima de {formatBRL(FREE_SHIPPING_FROM)}.
          {welcomeApplied ? " 10% da primeira compra já aplicado." : ""}
        </p>
        <p className="text-sm text-muted">PIX primeiro. Sem criar conta.</p>
        <ShopifyPayButton className="mt-2" />
        <p className="pt-4 text-[11px] tracking-[0.2em] text-subtle uppercase">Ou envie ao ateliê</p>
        <Field label="CEP" required />
        <Field label="Endereço" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade" required />
          <Field label="UF" required />
        </div>
        <Field label="Nome completo" required />
        <Field label="WhatsApp" required />
        <Field label="E-mail" type="email" required />
        <div>
          <p className="mb-2 text-xs tracking-widest uppercase">Pagamento</p>
          <div className="flex gap-2">
            {(["pix", "card"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setPay(k)}
                className={`h-11 px-5 text-xs tracking-widest uppercase ${pay === k ? "bg-ink text-paper" : "border border-line"}`}
              >
                {k === "pix" ? "PIX" : "Cartão"}
              </button>
            ))}
          </div>
        </div>
        {payErr && <p className="text-sm text-coral">{payErr}</p>}
        <button
          type="submit"
          disabled={cart.length === 0}
          className="flex h-14 w-full items-center justify-center bg-ink text-xs tracking-[0.22em] text-paper uppercase disabled:opacity-40"
        >
          Confirmar · {formatBRL(totals.total)}
        </button>
        <p className="text-center text-[11px] text-muted">
          {BOUTIQUE.cnpj} · 7 dias para desistir · Correios ·{" "}
          <a href={whatsappUrl("Olá, preciso de ajuda no checkout.")} className="underline">
            WhatsApp
          </a>
          .{" "}
          <Link to="/trocas" className="underline">
            Trocas
          </Link>
        </p>
      </form>

      <aside className="h-fit rounded-xl bg-paper p-6">
        <h2 className="font-display text-3xl">Sacola</h2>
        <ul className="mt-4 space-y-4">
          {totals.lines.map(({ item, product, line }) =>
            product ? (
              <li key={`${item.slug}${item.size}`} className="flex gap-3 text-sm">
                <img src={product.images[0]} alt="" className="h-16 w-12 rounded-sm object-cover" />
                <div className="flex-1">
                  <p>{product.shortName}</p>
                  <p className="text-xs text-muted">
                    {item.size} · {product.colors.find((c) => c.id === item.colorId)?.name}
                  </p>
                </div>
                <span className="tabular-nums">{formatBRL(line)}</span>
              </li>
            ) : (
              <li key={item.slug}>{getProduct(item.slug)?.name}</li>
            ),
          )}
        </ul>
        {welcomeApplied && totals.discount > 0 && (
          <p className="mt-5 text-[11px] tracking-[0.12em] text-muted uppercase">
            10% primeira compra aplicado
          </p>
        )}
        <div className="mt-5 space-y-1 text-sm">
          <p className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="tabular-nums">{formatBRL(totals.subtotal)}</span>
          </p>
          {totals.discount > 0 && (
            <p className="flex justify-between">
              <span className="text-muted">{WELCOME_CODE}</span>
              <span className="tabular-nums">− {formatBRL(totals.discount)}</span>
            </p>
          )}
          <p className="flex justify-between">
            <span className="text-muted">Frete</span>
            <span className="tabular-nums">{totals.shipping === 0 ? "Grátis" : formatBRL(totals.shipping)}</span>
          </p>
          <p className="flex justify-between pt-2 font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatBRL(totals.total)}</span>
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  type = "text",
  required,
}: {
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-widest uppercase">{label}</span>
      <input
        type={type}
        required={required}
        className="mt-2 h-12 w-full rounded-md border border-line bg-paper px-3 outline-none"
      />
    </label>
  );
}
