import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ProductCard } from "@/components/shell";
import { catalogStamp, collections, productsForCollection, subscribeCatalog } from "@/lib/catalog";
import { collectionJsonLd, jsonLdScript, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/colecao/$slug")({
  head: ({ params }) => {
    const col = collections.find((c) => c.slug === params.slug);
    const title = col?.title ?? "Coleção";
    return pageHead({
      title: `${title} — vestidos e peças`,
      description: `${title} na Gláucia Sampaio, Uberlândia. Fabulous Agilità, Agilità, Zen e Skazi.`,
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
  const [sort, setSort] = useState<"new" | "asc" | "desc">("new");
  const sorted = useMemo(() => {
    const arr = [...list];
    if (sort === "asc") arr.sort((a, b) => a.price - b.price);
    if (sort === "desc") arr.sort((a, b) => b.price - a.price);
    return arr;
  }, [list, sort]);

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
