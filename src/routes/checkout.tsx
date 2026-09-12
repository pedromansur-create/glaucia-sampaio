import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BOUTIQUE, FREE_SHIPPING_FROM, getProduct, variantIdFor, whatsappUrl } from "@/lib/catalog";
import { FLASH_CODE, flashActive } from "@/lib/flash";
import { WELCOME_CODE } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";
import { createMercadoPagoPreference } from "@/lib/mercadopago.functions";
import { shopifyCartUrl } from "@/lib/shopify";
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
  const store = useShop((s) => s.shopifyStore);
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
  const [applePay, setApplePay] = useState(false);
  const [mpReady, setMpReady] = useState(false);

  useEffect(() => {
    const Apple = (window as Window & { ApplePaySession?: { canMakePayments?: () => boolean } }).ApplePaySession;
    setApplePay(Boolean(Apple && (Apple.canMakePayments ? Apple.canMakePayments() : true)));
    fetch("/api/mercadopago")
      .then((r) => r.json() as Promise<{ token?: boolean }>)
      .then((d) => setMpReady(Boolean(d.token)))
      .catch(() => setMpReady(false));
  }, []);

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

  function shopifyPay() {
    const lined = cart.map((i) => {
      const p = getProduct(i.slug);
      return { ...i, variantId: i.variantId ?? (p ? variantIdFor(p, i.size) : undefined) };
    });
    const shop = shopifyCartUrl(
      store,
      lined,
      flashActive() ? FLASH_CODE : welcomeApplied ? WELCOME_CODE : WELCOME_CODE,
      {
        firstName: name.trim() || undefined,
        phone: onlyDigits(phone) || undefined,
        zip: onlyDigits(cep) || undefined,
        address1: street || undefined,
        city: city || undefined,
        province: uf || undefined,
        cpf: validCpf(cpf) ? formatCpf(cpf) : undefined,
      },
    );
    if (shop) window.location.assign(shop);
    return Boolean(shop);
  }

  const canPay =
    Boolean(name.trim()) && validCpf(cpf) && onlyDigits(phone).length >= 10 && onlyDigits(cep).length === 8;

  return (
    <div className="mx-auto max-w-md px-6 pb-20 pt-8">
      <h1 className="text-center text-[11px] tracking-[0.2em] uppercase">Pagar</h1>

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
                    <p className="truncate uppercase tracking-[0.04em]">{product.shortName}</p>
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
            className="mt-12 space-y-7"
            onSubmit={(e) => {
              e.preventDefault();
              if (busy) return;
              setPayErr("");
              setBusy(true);
              if (!mpReady) {
                if (!shopifyPay()) {
                  setPayErr("Não abriu o PIX. Fale com a shopper.");
                  setBusy(false);
                }
                return;
              }
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
                  if (shopifyPay()) return;
                  setPayErr("Não abriu o PIX. Fale com a shopper.");
                  setBusy(false);
                })
                .catch(() => {
                  setPayErr("Não abriu o PIX. Tente de novo ou fale com a shopper.");
                  setBusy(false);
                });
            }}
          >
            <label className="block">
              <span className="text-[10px] tracking-[0.16em] text-muted uppercase">Nome</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-2 h-11 w-full border-b border-line bg-transparent text-sm tracking-[0.02em] outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.16em] text-muted uppercase">CPF</span>
              <input
                required
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                className="mt-2 h-11 w-full border-b border-line bg-transparent text-sm tracking-[0.06em] outline-none"
              />
            </label>
            {cpf.length >= 14 && !validCpf(cpf) ? (
              <p className="text-[11px] text-muted">CPF inválido</p>
            ) : null}
            <label className="block">
              <span className="text-[10px] tracking-[0.16em] text-muted uppercase">WhatsApp</span>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="34 9"
                className="mt-2 h-11 w-full border-b border-line bg-transparent text-sm tracking-[0.06em] outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.16em] text-muted uppercase">CEP</span>
              <input
                required
                value={cep}
                onChange={(e) => void lookupCep(e.target.value)}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="38400-000"
                className="mt-2 h-11 w-full border-b border-line bg-transparent text-sm tracking-[0.06em] outline-none"
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
              disabled={busy || !canPay}
              className="mt-6 flex h-12 w-full items-center justify-center bg-ink text-[11px] tracking-[0.2em] text-paper uppercase disabled:opacity-30"
            >
              {busy ? "…" : "Pagar · PIX"}
            </button>
            {applePay ? (
              <button
                type="button"
                disabled={busy || !canPay}
                onClick={() => {
                  if (busy || !canPay) return;
                  setPayErr("");
                  setBusy(true);
                  if (!shopifyPay()) {
                    setPayErr("Apple Pay não abriu. Use PIX ou a shopper.");
                    setBusy(false);
                  }
                }}
                className="flex h-12 w-full items-center justify-center border border-ink text-[11px] tracking-[0.2em] uppercase disabled:opacity-30"
              >
                Apple Pay
              </button>
            ) : null}
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
