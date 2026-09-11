import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { formatBRL } from "@/lib/format";
import { maisonAdvise, quietClients } from "@/lib/maison-ai";
import { whatsappUrl } from "@/lib/catalog";
import { listShopifyCustomers, type ShopifyCustomer } from "@/lib/shopify.functions";
import { SHOPIFY_ADMIN } from "@/lib/shopify";
import { pageHead } from "@/lib/seo";

const CAIXA_RCS = "https://www.caixarcs.com";
const SHOPIFY_CUSTOMERS = `${SHOPIFY_ADMIN}/customers`;

export const Route = createFileRoute("/casa")({
  head: () =>
    pageHead({
      title: "Casa",
      description: "Copiloto. CRM no Shopify.",
      path: "/casa",
      noindex: true,
    }),
  component: Casa,
});

function Casa() {
  const [q, setQ] = useState("");
  const [book, setBook] = useState<ShopifyCustomer[]>([]);
  const [crm, setCrm] = useState<"loading" | "shopify" | "none">("loading");
  const [picked, setPicked] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [mac, setMac] = useState(false);
  const client = book.find((c) => c.id === picked) ?? null;
  const advice = useMemo(
    () =>
      maisonAdvise(q || client?.notes || "", client
        ? {
            id: String(client.id),
            name: client.name,
            phone: client.phone,
            size: client.size,
            notes: client.notes,
            lastVisit: client.lastVisit,
            lastPieces: [],
          }
        : null),
    [q, client],
  );
  const quiet = quietClients(
    book.map((c) => ({
      id: String(c.id),
      name: c.name,
      phone: c.phone,
      size: c.size,
      notes: c.notes,
      lastVisit: c.lastVisit,
      lastPieces: [],
    })),
  );

  useEffect(() => {
    let alive = true;
    listShopifyCustomers({ data: { q: "" } })
      .then((r) => {
        if (!alive) return;
        if (r.ok) {
          setBook(r.customers);
          setCrm("shopify");
        } else setCrm("none");
      })
      .catch(() => {
        if (alive) setCrm("none");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setDraft(advice.draft);
    if (!q && !client) return;
    const body = {
      query: advice.query,
      name: client?.name ?? "",
      size: advice.size,
      occasion: advice.occasion,
      picks: advice.picks.map((x) => ({
        brand: x.product.brand,
        name: x.product.shortName,
        price: x.product.price,
        composition: x.product.composition || x.product.fabric,
        sizeNote: x.sizeNote,
      })),
    };
    const ac = new AbortController();
    fetch("/api/maison", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((d: { ok?: boolean; draft?: string; local?: boolean }) => {
        if (d.ok && d.draft) {
          setDraft(d.draft);
          setMac(true);
        }
      })
      .catch(() => {});
    return () => ac.abort();
  }, [advice, q, client]);

  return (
    <article className="mx-auto max-w-xl px-6 py-16 text-[14px] leading-[1.85]">
      <h1 className="text-[11px] tracking-[0.32em] text-subtle uppercase">Casa</h1>
      <p className="mt-6 text-muted">
        Caderno: Shopify. Caixa: CaixaRCS. Recado: Mini da casa
        {mac ? " · ligado" : ""}. Lucy só usa o site — não o Terminal.
      </p>
      <p className="mt-6 flex flex-wrap gap-5 text-[11px] tracking-[0.22em] uppercase">
        <a href={SHOPIFY_CUSTOMERS} target="_blank" rel="noreferrer">
          Clientes Shopify
        </a>
        <a href={CAIXA_RCS} target="_blank" rel="noreferrer">
          CaixaRCS
        </a>
      </p>
      {crm === "none" ? (
        <p className="mt-6 text-muted">
          Para a casa ler as fichas daqui, no Vercel: Environment Variable{" "}
          <code>SHOPIFY_ADMIN_TOKEN</code> (Admin API, read_customers). Até lá, abre o Shopify.
        </p>
      ) : null}

      <label className="mt-14 block text-[11px] tracking-[0.22em] uppercase">Pedir à vitrine</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="P, casamento no jardim, off white"
        className="mt-2 h-12 w-full border-b border-line bg-transparent outline-none"
      />

      {q || client ? (
        <>
          <ul className="mt-10 space-y-8">
            {advice.picks.map((x) => (
              <li key={x.product.slug}>
                <Link to="/produto/$slug" params={{ slug: x.product.slug }} className="flex gap-4">
                  <img src={x.product.images[0]} alt="" className="h-24 w-16 object-cover object-top" />
                  <span>
                    <span className="block text-[11px] tracking-[0.18em] uppercase">{x.product.brand}</span>
                    <span className="block">{x.product.shortName}</span>
                    <span className="block text-muted">{x.why}</span>
                    <span className="block text-muted">{x.sizeNote}</span>
                    <span className="mt-1 block tabular-nums">{formatBRL(x.product.price)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <pre className="mt-10 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{draft || advice.draft}</pre>
          <p className="mt-4 flex flex-wrap gap-5 text-[11px] tracking-[0.2em] uppercase">
            <button type="button" onClick={() => void navigator.clipboard.writeText(draft || advice.draft)}>
              Copiar recado
            </button>
            <button
              type="button"
              onClick={() => {
                const payload = {
                  kind: "anuncio",
                  query: advice.query,
                  name: client?.name ?? "",
                  size: advice.size,
                  occasion: advice.occasion,
                  picks: advice.picks.map((x) => ({
                    brand: x.product.brand,
                    name: x.product.shortName,
                    price: x.product.price,
                    composition: x.product.composition || x.product.fabric,
                  })),
                };
                fetch("/api/maison", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                })
                  .then((r) => r.json())
                  .then((d: { ok?: boolean; draft?: string }) => {
                    if (d.ok && d.draft) setDraft(d.draft);
                  })
                  .catch(() => {});
              }}
            >
              Google · Instagram · Facebook
            </button>
            <a href={whatsappUrl(draft || advice.draft)} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </p>
        </>
      ) : null}

      {crm === "shopify" && book.length > 0 ? (
        <>
          <h2 className="mt-16 text-[11px] tracking-[0.32em] text-subtle uppercase">Shopify</h2>
          <ul className="mt-6 space-y-3">
            {book.slice(0, 24).map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setPicked(c.id)} className="text-left">
                  {c.name}
                  {c.size ? ` · ${c.size}` : ""}
                  {c.orders ? ` · ${c.orders} pedidos` : ""}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {quiet.length > 0 ? (
        <>
          <h2 className="mt-16 text-[11px] tracking-[0.32em] text-subtle uppercase">90 dias</h2>
          <ul className="mt-6 space-y-3">
            {quiet.slice(0, 12).map((c) => (
              <li key={c.id}>
                {c.name} · {c.size || "—"}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}
