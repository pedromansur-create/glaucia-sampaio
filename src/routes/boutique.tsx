import { createFileRoute, Link } from "@tanstack/react-router";
import { BOUTIQUE, INSTAGRAM } from "@/lib/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/boutique")({
  head: () =>
    pageHead({
      title: "Boutique em Uberlândia",
      description:
        "Gláucia Sampaio Boutique. Rua Rodolfo Correa, 385 — Vila Povoa, Uberlândia. Seg a sáb 10h–19h. Prova com hora marcada.",
      path: "/boutique",
    }),
  component: Boutique,
});

function Boutique() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-20 md:px-10 md:py-28">
      <p className="text-[11px] tracking-[0.28em] text-subtle uppercase">Uberlândia</p>
      <h1 className="mt-3 font-display text-5xl md:text-7xl">A casa.</h1>
      <p className="mt-8 text-muted leading-relaxed">
        Rua Rodolfo Correa, 385 — Vila Povoa. Prova com hora marcada, ou um recado no WhatsApp.
      </p>
      <div className="mt-14 border-t border-line pt-10">
        <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">Visite</p>
        <p className="mt-3 font-display text-3xl">{BOUTIQUE.address}</p>
        <p className="mt-1 text-muted">
          {BOUTIQUE.city} · {BOUTIQUE.cep}
        </p>
        <p className="mt-4">{BOUTIQUE.hours}</p>
        <p>{BOUTIQUE.phone}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/atelier"
            className="rounded-pill bg-ink px-5 py-3 text-[11px] tracking-[0.18em] text-paper uppercase"
          >
            Agendar
          </Link>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noreferrer"
            className="rounded-pill border border-line px-5 py-3 text-[11px] tracking-[0.18em] uppercase"
          >
            Instagram
          </a>
        </div>
      </div>
    </article>
  );
}
