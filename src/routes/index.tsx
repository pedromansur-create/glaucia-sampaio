import { createFileRoute } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { ProductCard } from "@/components/shell";
import { allProducts, catalogStamp, subscribeCatalog } from "@/lib/catalog";
import { sizeOnHand } from "@/lib/inventory";
import { useShop } from "@/lib/store";
import { DEFAULT_DESC, DEFAULT_TITLE, collectionJsonLd, jsonLdScript, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead({ title: DEFAULT_TITLE, description: DEFAULT_DESC, path: "/" }),
  component: Home,
});

function Home() {
  useSyncExternalStore(subscribeCatalog, catalogStamp, catalogStamp);
  const herSize = useShop((s) => s.herSize);
  const pool = allProducts();
  const ranked = herSize
    ? [...pool].sort((a, b) => {
        const aq = sizeOnHand(a.shopifyHandle ?? a.slug, herSize);
        const bq = sizeOnHand(b.shopifyHandle ?? b.slug, herSize);
        const as = aq == null ? 1 : aq > 0 ? 0 : 2;
        const bs = bq == null ? 1 : bq > 0 ? 0 : 2;
        return as - bs;
      })
    : pool;
  return (
    <div className="px-1 pb-16 pt-2 md:px-2">
      <h1 className="sr-only">
        Gláucia Sampaio Boutique Uberlândia — vestidos Fabulous Agilità, Agilità, Zen e Skazi
      </h1>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionJsonLd("Novidades", "/", pool)) }} />
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
        {ranked.map((p) => (
          <ProductCard key={p.slug} slug={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
