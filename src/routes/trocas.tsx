import { createFileRoute } from "@tanstack/react-router";
import { BOUTIQUE, RETURN_DAYS, whatsappUrl } from "@/lib/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/trocas")({
  head: () =>
    pageHead({
      title: "Política de trocas e devoluções",
      description:
        "Compras pela internet na Gláucia Sampaio: 7 dias para desistir (CDC art. 49), 90 dias para defeito (art. 18). Frete de volta por nossa conta no arrependimento.",
      path: "/trocas",
    }),
  component: Trocas,
});

function Trocas() {
  return (
    <article className="mx-auto max-w-xl px-6 py-16 text-[15px] leading-[1.7] md:px-10 md:py-24">
      <h1 className="text-[13px] tracking-[0.28em] uppercase">Política de trocas</h1>
      <p className="mt-8">
        No Brasil, compra feita pela internet tem proteção do Código de Defesa do Consumidor. A
        regra é clara. A gente só traduz.
      </p>
      <p className="mt-4 text-muted">
        Existem duas situações: você desiste da compra, ou a peça veio com defeito. O resto é
        conversa com a casa.
      </p>

      <h2 className="mt-14 text-[13px] tracking-[0.22em] uppercase">1. Direito de arrependimento</h2>
      <p className="mt-4">
        Você não provou a peça. Por isso a lei garante o direito de desistir, sem motivo — artigo 49
        do CDC.
      </p>
      <p className="mt-4">
        <strong className="font-medium">Prazo.</strong> {RETURN_DAYS} dias corridos, contados da
        data em que você recebeu o produto.
      </p>
      <p className="mt-4">
        <strong className="font-medium">Justificativa.</strong> Não precisa. Não gostou, o tamanho
        não serviu, mudou de ideia: devolve.
      </p>
      <p className="mt-4">
        <strong className="font-medium">Reembolso e frete.</strong> Devolvemos 100% do que foi
        pago, incluindo o frete original. O frete de volta (logística reversa) é por nossa conta.
        Você não paga para desfazer.
      </p>
      <p className="mt-4 text-muted">
        A peça precisa estar sem uso, com etiqueta e na embalagem. Perfume, lavagem ou etiqueta
        cortada encerram o arrependimento — a não ser que exista defeito.
      </p>

      <h2 className="mt-14 text-[13px] tracking-[0.22em] uppercase">2. Produto com defeito</h2>
      <p className="mt-4">
        Roupa é bem durável. Se houver vício — costura, tecido, zíper, tingimento — o prazo para
        reclamar é de 90 dias a partir do recebimento. Artigo 18 do CDC.
      </p>
      <p className="mt-4">
        Depois do aviso, a loja ou o fabricante tem até 30 dias para resolver. Se não resolver
        nesse prazo, você escolhe:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5">
        <li>a troca por uma peça nova, igual, em perfeito estado;</li>
        <li>a devolução integral do dinheiro (produto e frete);</li>
        <li>um desconto proporcional, se quiser ficar com a peça mesmo assim.</li>
      </ol>

      <h2 className="mt-14 text-[13px] tracking-[0.22em] uppercase">3. Tamanho ou cor depois dos 7 dias</h2>
      <p className="mt-4">
        Passou a semana do arrependimento e a peça não tem defeito? A lei não obriga a troca só
        porque a cor não agradou ou o tamanho ficou ruim.
      </p>
      <p className="mt-4 text-muted">
        Ainda assim, fale com a gente. Muita coisa se resolve na Rua Rodolfo Correa ou no
        WhatsApp — especialmente PP e P, que é de onde vêm as dúvidas.
      </p>

      <h2 className="mt-14 text-[13px] tracking-[0.22em] uppercase">Como pedir</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5">
        <li>Guarde a nota fiscal, o e-mail do pedido, as etiquetas e a caixa.</li>
        <li>Chame no WhatsApp com o número do pedido e o que precisa: desistência, defeito ou tamanho.</li>
        <li>A personal shopper combina a coleta. Você não vai ao correio sozinha.</li>
      </ol>

      <div className="mt-14">
        <a
          href={whatsappUrl("Olá, Gláucia Sampaio. Preciso de ajuda com uma troca ou devolução.")}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[12px] tracking-[0.2em] uppercase underline"
        >
          WhatsApp · trocas
        </a>
      </div>

      <p className="mt-16 text-[12px] leading-relaxed text-subtle">
        {BOUTIQUE.legalName}
        <br />
        CNPJ {BOUTIQUE.cnpj}
        <br />
        {BOUTIQUE.address} · {BOUTIQUE.city} · {BOUTIQUE.cep}
      </p>
    </article>
  );
}
