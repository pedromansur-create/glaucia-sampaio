import { createFileRoute } from "@tanstack/react-router";
import { BOUTIQUE, RETURN_DAYS, whatsappUrl } from "@/lib/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/trocas")({
  head: () =>
    pageHead({
      title: "Política de trocas",
      description: `Na Gláucia Sampaio, ${RETURN_DAYS} dias para desistir da compra pela internet. Defeito, 90 dias. Frete de volta por nossa conta no arrependimento.`,
      path: "/trocas",
    }),
  component: Trocas,
});

function Trocas() {
  return (
    <article className="mx-auto max-w-md px-6 py-20 text-[14px] leading-[1.85] text-ink md:py-28">
      <h1 className="text-[11px] tracking-[0.32em] text-subtle uppercase">Trocas</h1>

      <p className="mt-10">
        Comprar daqui, de casa, é diferente de provar na Rua Rodolfo Correa. A lei cuida disso.
        A casa também.
      </p>

      <p className="mt-6">
        Se a peça chegar e não for a que você imaginou, você tem {RETURN_DAYS} dias corridos —
        do dia do recebimento — para devolver. Sem explicar. Não serviu, não era o tom, mudou
        de ideia. Devolvemos o que foi pago, inclusive o frete da ida. O de volta fica conosco.
      </p>

      <p className="mt-6 text-muted">
        Peça sem uso, etiqueta no lugar, caixa fechada. Perfume ou lavagem encerram esse prazo.
      </p>

      <p className="mt-6">
        Se houver defeito — uma costura, um tecido, um zíper — o prazo é outro: noventa dias.
        Avisou, a casa tem trinta dias para resolver. Se não resolver, você escolhe: outra peça,
        o dinheiro, ou um acerto no valor.
      </p>

      <p className="mt-6 text-muted">
        Passou a semana e a peça está íntegra? Tamanho e cor, a lei não obriga. Mesmo assim,
        chame. PP e P a gente costuma ajeitar.
      </p>

      <p className="mt-6">
        Guarde a nota e o e-mail do pedido. Um recado no WhatsApp basta. A shopper combina a
        coleta.
      </p>

      <p className="mt-14">
        <a
          href={whatsappUrl("Olá, preciso de ajuda com uma troca.")}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] tracking-[0.22em] uppercase"
        >
          WhatsApp
        </a>
      </p>

      <p className="mt-20 text-[11px] leading-relaxed tracking-[0.04em] text-subtle">
        {BOUTIQUE.legalName}
        <br />
        CNPJ {BOUTIQUE.cnpj}
      </p>
    </article>
  );
}
