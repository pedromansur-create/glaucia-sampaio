import { createFileRoute } from "@tanstack/react-router";
import { BOUTIQUE, whatsappUrl } from "@/lib/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/atelier")({
  head: () =>
    pageHead({
      title: "Personal shopper",
      description: "Personal shopper Gláucia Sampaio no WhatsApp. Tamanho, ocasião, a peça certa.",
      path: "/atelier",
    }),
  component: Atelier,
});

function Atelier() {
  return (
    <article className="mx-auto max-w-md px-6 py-20 text-[14px] leading-[1.85]">
      <h1 className="text-[11px] tracking-[0.32em] text-subtle uppercase">Personal shopper</h1>
      <p className="mt-10">
        Diga o evento, a altura, o tamanho. A casa responde com duas ou três peças — não com um
        catálogo.
      </p>
      <p className="mt-6 text-muted">
        WhatsApp, ou na {BOUTIQUE.address}. {BOUTIQUE.hours}.
      </p>
      <p className="mt-14">
        <a
          href={whatsappUrl("Olá, quero a personal shopper.")}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] tracking-[0.22em] uppercase"
        >
          WhatsApp
        </a>
      </p>
    </article>
  );
}
