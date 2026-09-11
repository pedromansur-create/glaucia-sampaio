import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/shell";
import { allProducts } from "@/lib/catalog";
import { DEFAULT_DESC, DEFAULT_TITLE, collectionJsonLd, jsonLdScript, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead({ title: DEFAULT_TITLE, description: DEFAULT_DESC, path: "/" }),
  component: Home,
});

function Home() {
  const pool = allProducts();
  return (
    <div className="px-1 pb-16 pt-2 md:px-2">
      <h1 className="sr-only">
        Gláucia Sampaio Boutique Uberlândia — vestidos Fabulous Agilità, Agilità, Zen e Skazi
      </h1>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionJsonLd("Novidades", "/", pool)) }} />
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
        {pool.map((p) => (
          <ProductCard key={p.slug} slug={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
