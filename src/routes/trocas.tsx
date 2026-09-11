import { createFileRoute, Link } from "@tanstack/react-router";
import { BOUTIQUE, RETURN_DAYS, whatsappUrl } from "@/lib/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/trocas")({
  head: () =>
    pageHead({
      title: "Trocas e devoluções",
      description:
        "7 dias para desistir da compra pela internet (CDC art. 49). Troca de tamanho com a boutique. Frete de volta por nossa conta no arrependimento.",
      path: "/trocas",
    }),
  component: Trocas,
});

function Trocas() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16 leading-relaxed md:px-10 md:py-24">
      <p className="text-[11px] tracking-[0.28em] text-subtle uppercase">A casa</p>
      <h1 className="mt-3 font-display text-5xl md:text-7xl">Trocas e devoluções</h1>
      <p className="mt-8 text-muted">
        Comprar de casa é diferente de provar na loja. A lei brasileira cuida de você — e a boutique
        também. Sem letra miúda escondida.
      </p>

      <section className="mt-16">
        <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">Se mudou de ideia</p>
        <h2 className="mt-2 font-display text-3xl">Sete dias, sem explicar.</h2>
        <p className="mt-5">
          Você tem {RETURN_DAYS} dias corridos, contados do dia em que a peça chega, para desistir.
          Não precisa de motivo. Não serviu, não era o tom, simplesmente não ficou — devolve.
        </p>
        <p className="mt-4 text-muted">
          Devolvemos tudo o que você pagou, inclusive o frete da ida. O frete de volta é por nossa
          conta. Você não paga para desfazer.
        </p>
        <p className="mt-4 text-sm text-subtle">Código de Defesa do Consumidor, art. 49.</p>
      </section>

      <section className="mt-16">
        <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">Se a peça veio com defeito</p>
        <h2 className="mt-2 font-display text-3xl">Noventa dias para falar.</h2>
        <p className="mt-5">
          Roupa é bem durável. Se houver defeito de fabricação — costura, tecido, fechamento — você
          tem 90 dias para nos avisar, a partir do recebimento.
        </p>
        <p className="mt-4 text-muted">
          A casa tem até 30 dias para resolver. Se não resolver nesse prazo, você escolhe: uma peça
          nova, o dinheiro de volta (produto e frete), ou um desconto se quiser ficar com ela.
        </p>
        <p className="mt-4 text-sm text-subtle">Código de Defesa do Consumidor, art. 18.</p>
      </section>

      <section className="mt-16">
        <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">Depois dos sete dias</p>
        <h2 className="mt-2 font-display text-3xl">Tamanho e cor.</h2>
        <p className="mt-5">
          Passou a semana e a peça está íntegra? A lei não obriga a troca só porque o tamanho ou a
          cor não agradou. Ainda assim, fale com a gente. Na Rua Rodolfo Correa a gente ajeita o
          que dá — e no WhatsApp também.
        </p>
      </section>

      <section className="mt-16">
        <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">Como fazer</p>
        <h2 className="mt-2 font-display text-3xl">Um recado. O resto é da casa.</h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-muted">
          <li>Guarde a nota, o e-mail do pedido, as etiquetas e a embalagem.</li>
          <li>Chame no WhatsApp com o número do pedido e o que precisa — troca ou devolução.</li>
          <li>A personal shopper combina a coleta. Você não corre correio sozinha.</li>
        </ol>
        <p className="mt-6 text-sm">
          Peça usada, lavada, com etiqueta cortada ou cheiro de perfume não entra no arrependimento
          — só em caso de defeito.
        </p>
      </section>

      <div className="mt-16 flex flex-wrap gap-3">
        <a
          href={whatsappUrl(
            "Olá, Gláucia Sampaio. Preciso de ajuda com uma troca ou devolução.",
          )}
          target="_blank"
          rel="noreferrer"
          className="rounded-pill bg-ink px-6 py-3 text-[11px] tracking-[0.18em] text-paper uppercase"
        >
          WhatsApp · trocas
        </a>
        <Link
          to="/atelier"
          className="rounded-pill border border-line px-6 py-3 text-[11px] tracking-[0.18em] uppercase"
        >
          Atelier
        </Link>
      </div>

      <p className="mt-16 text-xs leading-relaxed text-subtle">
        {BOUTIQUE.legalName} · CNPJ {BOUTIQUE.cnpj}
        <br />
        {BOUTIQUE.address} · {BOUTIQUE.city} · {BOUTIQUE.cep}
      </p>
    </article>
  );
}
