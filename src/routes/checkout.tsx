import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BOUTIQUE, FREE_SHIPPING_FROM, getProduct, whatsappUrl } from "@/lib/catalog";
import { FLASH_CODE, flashActive } from "@/lib/flash";
import { WELCOME_CODE } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";
import { createMercadoPagoPreference } from "@/lib/mercadopago.functions";
import { cartTotals, useShop } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout")({
  head: () =>
    pageHead({
      title: "Pagar",
      description: "Finalize sua compra na Gláucia Sampaio.",
      path: "/checkout",
      noindex: true,
    }),
  component: Checkout,
});

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function formatCpf(s: string) {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function validCpf(s: string) {
  const cpf = onlyDigits(s);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const digits = cpf.split("").map(Number);
  const check = (len: number) => {
    const sum = digits.slice(0, len).reduce((a, n, i) => a + n * (len + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === digits[9] && check(10) === digits[10];
}

function Checkout() {
  const cart = useShop((s) => s.cart);
  const welcomeApplied = useShop((s) => s.welcomeApplied);
  const totals = useMemo(() => cartTotals(cart, welcomeApplied), [cart, welcomeApplied]);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [uf, setUf] = useState("");
  const [cepErr, setCepErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [payErr, setPayErr] = useState("");

  const orderText = cart
    .map((i) => {
      const p = getProduct(i.slug);
      return `${p?.brand ?? ""} ${p?.shortName ?? i.slug} ${i.size}`.trim();
    })
    .join("; ");

  async function lookupCep(raw: string) {
    const d = onlyDigits(raw);
    setCep(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5, 8)}` : d);
    setCepErr("");
    if (d.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = (await res.json()) as { erro?: boolean; localidade?: string; logradouro?: string; uf?: string };
      if (data.erro) {
        setCepErr("CEP não encontrado");
        return;
      }
      setCity(data.localidade ?? "");
      setStreet(data.logradouro ?? "");
      setUf(data.uf ?? "");
    } catch {
      setCepErr("Não deu pra ler o CEP");
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-20 pt-6">
      <h1 className="text-center text-[11px] tracking-[0.28em] uppercase">Pagar</h1>

      {cart.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">Sacola vazia.</p>
      ) : (
        <>
          <ul className="mt-8 space-y-4">
            {totals.lines.map(({ item, product, line }) =>
              product ? (
                <li key={`${item.slug}${item.size}`} className="flex gap-3 text-sm">
                  <img src={product.images[0]} alt="" className="h-16 w-12 object-cover object-top" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate uppercase tracking-[0.08em]">{product.shortName}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {item.size} · {item.qty}
                    </p>
                  </div>
                  <span className="tabular-nums">{formatBRL(line)}</span>
                </li>
              ) : null,
            )}
          </ul>

          {totals.discount > 0 && (
            <p className="mt-6 text-[11px] tracking-[0.12em] text-muted uppercase">
              {totals.code === FLASH_CODE ? "25% até meia-noite" : `${WELCOME_CODE} 10%`}
            </p>
          )}
          <div className="mt-4 space-y-1 text-sm">
            <p className="flex justify-between">
              <span className="text-muted">Total</span>
              <span className="tabular-nums">{formatBRL(totals.total)}</span>
            </p>
            <p className="text-[11px] text-muted">
              Frete grátis acima de {formatBRL(FREE_SHIPPING_FROM)}. {totals.shipping === 0 ? "Frete grátis nesta sacola." : `Frete ${formatBRL(totals.shipping)}.`}
            </p>
          </div>

          <form
            className="mt-10 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (busy) return;
              setPayErr("");
              setBusy(true);
              void createMercadoPagoPreference({
                data: {
                  name: name.trim(),
                  cpf,
                  phone,
                  cep,
                  city,
                  street,
                  uf,
                  cart: cart.map((i) => ({ slug: i.slug, size: i.size, qty: i.qty })),
                },
              })
                .then((res) => {
                  if (res.ok && res.url) {
                    window.location.assign(res.url);
                    return;
                  }
                  setPayErr(
                    res.error === "mp-token"
                      ? "Falta a chave do Mercado Pago na conta."
                      : "Não abriu o PIX. Tente de novo ou fale com a shopper.",
                  );
                  setBusy(false);
                })
                .catch(() => {
                  setPayErr("Não abriu o PIX. Tente de novo ou fale com a shopper.");
                  setBusy(false);
                });
            }}
          >
            <label className="block">
              <span className="text-[10px] tracking-[0.2em] text-muted uppercase">Nome</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-1 h-12 w-full border-b border-line bg-transparent text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.2em] text-muted uppercase">CPF</span>
              <input
                required
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                className="mt-1 h-12 w-full border-b border-line bg-transparent text-sm outline-none"
              />
            </label>
            {cpf.length >= 14 && !validCpf(cpf) ? (
              <p className="text-[11px] text-muted">CPF inválido</p>
            ) : null}
            <label className="block">
              <span className="text-[10px] tracking-[0.2em] text-muted uppercase">WhatsApp</span>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="34 9"
                className="mt-1 h-12 w-full border-b border-line bg-transparent text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.2em] text-muted uppercase">CEP</span>
              <input
                required
                value={cep}
                onChange={(e) => void lookupCep(e.target.value)}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="38400-000"
                className="mt-1 h-12 w-full border-b border-line bg-transparent text-sm outline-none"
              />
            </label>
            {city ? (
              <p className="text-[11px] tracking-[0.08em] text-muted uppercase">
                {street ? `${street} · ` : ""}
                {city} {uf}
              </p>
            ) : null}
            {cepErr ? <p className="text-[11px] text-muted">{cepErr}</p> : null}

            {payErr ? <p className="text-[11px] text-muted">{payErr}</p> : null}

            <button
              type="submit"
              disabled={
                busy ||
                !name.trim() ||
                !validCpf(cpf) ||
                onlyDigits(phone).length < 10 ||
                onlyDigits(cep).length !== 8
              }
              className="mt-4 flex h-12 w-full items-center justify-center bg-ink text-[11px] tracking-[0.28em] text-paper uppercase disabled:opacity-30"
            >
              {busy ? "…" : "Pagar · PIX"}
            </button>
          </form>

          <a
            href={whatsappUrl(
              `Olá, sou ${name || "—"}. CPF ${cpf || "—"}. WhatsApp ${phone || "—"}. CEP ${cep || "—"}. Quero fechar: ${orderText}. Total ${formatBRL(totals.total)}.`,
            )}
            className="mt-5 block text-center text-[11px] tracking-[0.18em] text-muted uppercase underline"
          >
            Prefiro a shopper
          </a>
          <p className="mt-8 text-center text-[10px] leading-relaxed text-muted">
            CPF na nota. Sem criar conta. PIX primeiro. 10x. 7 dias. {BOUTIQUE.cnpj}
          </p>
        </>
      )}
    </div>
  );
}
