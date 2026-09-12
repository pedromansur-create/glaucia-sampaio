import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { ProductGrid } from "@/components/shell";
import { catalogStamp, occasions, productsForOccasion, subscribeCatalog } from "@/lib/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ocasioes/$slug")({
  head: ({ params }) => {
    const o = occasions.find((x) => x.slug === params.slug);
    return pageHead({
      title: o ? `${o.title} — vestidos` : "Ocasião",
      description: o
        ? `${o.title}. ${o.subtitle} Peças na Gláucia Sampaio, Uberlândia.`
        : "Ocasiões na boutique Gláucia Sampaio.",
      path: `/ocasioes/${params.slug}`,
      image: o?.image,
    });
  },
  component: OccasionPage,
});

function OccasionPage() {
  useSyncExternalStore(subscribeCatalog, catalogStamp, catalogStamp);
  const { slug } = Route.useParams();
  const o = occasions.find((x) => x.slug === slug);
  const list = productsForOccasion(slug);

  if (!o) {
    return (
      <div className="px-8 py-24">
        <h1 className="sr-only">Ocasião não encontrada</h1>
        <Link to="/" className="text-[11px] tracking-[0.2em] uppercase underline">
          Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="px-1 pb-16 pt-2 md:px-2">
      <h1 className="sr-only">{o.title}</h1>
      <ProductGrid products={list} />
    </div>
  );
}
