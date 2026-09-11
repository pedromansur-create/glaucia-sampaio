import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/status")({
  head: () =>
    pageHead({
      title: "Status",
      description: "Monitoramento da casa.",
      path: "/status",
      noindex: true,
    }),
  component: Status,
});

type Ping = { ok: boolean; ms?: number; error?: string; configured?: boolean; status?: number };

function Row({ name, ping }: { name: string; ping?: Ping }) {
  const state = !ping ? "…" : ping.ok ? "ligado" : "fora";
  return (
    <li className="flex justify-between gap-6 border-b border-line py-4">
      <span>{name}</span>
      <span className="text-muted">
        {state}
        {ping?.ms != null && ping.ok ? ` · ${ping.ms}ms` : ""}
        {ping?.error && !ping.ok ? ` · ${ping.error}` : ""}
      </span>
    </li>
  );
}

function Status() {
  const [data, setData] = useState<{
    at?: string;
    shopify?: Ping;
    caixarcs?: Ping;
    maison?: Ping;
  } | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/status")
        .then((r) => r.json())
        .then(setData)
        .catch(() => setData({}));
    };
    load();
    const id = window.setInterval(load, 20000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <article className="mx-auto max-w-xl px-6 py-16 text-[14px] leading-[1.85]">
      <h1 className="text-[11px] tracking-[0.32em] text-subtle uppercase">Status</h1>
      <p className="mt-6 text-muted">Mini, Shopify e CaixaRCS. Atualiza sozinho. Lucy não usa esta página.</p>
      <ul className="mt-12">
        <Row name="Shopify" ping={data?.shopify} />
        <Row name="CaixaRCS" ping={data?.caixarcs} />
        <Row name="Mini · gs-maison" ping={data?.maison} />
      </ul>
      <p className="mt-10 text-[11px] tracking-[0.18em] text-subtle uppercase">{data?.at || "…"}</p>
    </article>
  );
}
