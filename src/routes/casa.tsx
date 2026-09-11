import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/format";
import { maisonAdvise } from "@/lib/maison-ai";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/casa")({
  head: () =>
    pageHead({
      title: "Casa",
      description: "Copiloto da casa. Uso interno.",
      path: "/casa",
      noindex: true,
    }),
  component: Casa,
});

function Casa() {
  const [q, setQ] = useState("");
  const advice = useMemo(() => maisonAdvise(q), [q]);

  return (
    <article className="mx-auto max-w-xl px-6 py-16 text-[14px] leading-[1.85]">
      <h1 className="text-[11px] tracking-[0.32em] text-subtle uppercase">Casa</h1>
      <p className="mt-6 text-muted">
        Copiloto. Lê só o catálogo da loja. A ficha da cliente fica no CRM que você já usa — aqui
        a casa escolhe a peça e o recado.
      </p>

      <label className="mt-12 block text-[11px] tracking-[0.22em] uppercase">Pedir à casa</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="P, casamento no jardim, off white"
        className="mt-2 h-12 w-full border-b border-line bg-transparent outline-none"
      />

      {q ? (
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
          <pre className="mt-10 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{advice.draft}</pre>
          <p className="mt-4 flex flex-wrap gap-5 text-[11px] tracking-[0.2em] uppercase">
            <button type="button" onClick={() => void navigator.clipboard.writeText(advice.draft)}>
              Copiar recado
            </button>
            <a href={advice.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </p>
        </>
      ) : null}
    </article>
  );
}
