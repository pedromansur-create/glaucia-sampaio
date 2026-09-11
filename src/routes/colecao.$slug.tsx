import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { ProductCard } from "@/components/shell";
import { catalogStamp, collections, productsForCollection, subscribeCatalog } from "@/lib/catalog";
import { collectionJsonLd, jsonLdScript, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/colecao/$slug")({
  head: ({ params }) => {
    const col = collections.find((c) => c.slug === params.slug);
    const title = col?.title ?? params.slug.replace(/-/g, " ");
    const copy: Record<string, string> = {
      novidades: "Novidades e Verão 27 na Gláucia Sampaio, Uberlândia. Vestidos Fabulous Agilità, Agilità, Zen e Skazi.",
      sale: "Sale: um desconto, sem gritaria. Peças da casa em Uberlândia.",
      arquivo: "Sale: um desconto, sem gritaria. Peças da casa em Uberlândia.",
      casamento: "Vestidos para casamento e madrinha em Uberlândia. Agilità, Zen, Skazi.",
      noite: "Vestidos para noite, gala e eventos em Uberlândia.",
      "all-white": "All white e off-white. Vestidos para evento branco em Uberlândia.",
      vestidos: "Vestidos de festa em Uberlândia. Fabulous Agilità, Agilità, Zen, Skazi.",
    };
    return pageHead({
      title: `${title} — vestidos em Uberlândia`,
      description: copy[params.slug] ?? `${title} na Gláucia Sampaio, Uberlândia. Fabulous Agilità, Agilità, Zen e Skazi.`,
      path: `/colecao/${params.slug}`,
    });
  },
  component: CollectionPage,
});

function CollectionPage() {
  useSyncExternalStore(subscribeCatalog, catalogStamp, catalogStamp);
  const { slug } = Route.useParams();
  const col = collections.find((c) => c.slug === slug);
  const list = productsForCollection(slug);
  const sorted = list;

  return (
    <div className="px-1 pb-10 pt-2 md:px-2">
      <h1 className="sr-only">{col?.title ?? "Coleção"} | Gláucia Sampaio</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionJsonLd(col?.title ?? "Coleção", `/colecao/${slug}`, sorted)) }}
      />
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
        {sorted.map((p) => (
          <ProductCard key={p.slug} slug={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
