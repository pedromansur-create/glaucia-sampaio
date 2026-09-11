import { createFileRoute } from "@tanstack/react-router";
import { BOUTIQUE, INSTAGRAM, whatsappUrl } from "@/lib/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/boutique")({
  head: () =>
    pageHead({
      title: "A boutique",
      description: `${BOUTIQUE.address}, ${BOUTIQUE.city}. ${BOUTIQUE.hours}.`,
      path: "/boutique",
    }),
  component: Boutique,
});

function Boutique() {
  return (
    <article className="mx-auto max-w-md px-6 py-20 text-[14px] leading-[1.85]">
      <h1 className="text-[11px] tracking-[0.32em] text-subtle uppercase">A boutique</h1>
      <p className="mt-10">{BOUTIQUE.address}</p>
      <p className="text-muted">
        {BOUTIQUE.city} · {BOUTIQUE.cep}
      </p>
      <p className="mt-6">{BOUTIQUE.hours}</p>
      <p>{BOUTIQUE.phone}</p>
      <p className="mt-14 flex flex-col gap-3 text-[11px] tracking-[0.22em] uppercase">
        <a href={whatsappUrl("Olá, quero agendar uma prova.")} target="_blank" rel="noreferrer">
          Agendar
        </a>
        <a href={INSTAGRAM} target="_blank" rel="noreferrer">
          Instagram
        </a>
      </p>
    </article>
  );
}
