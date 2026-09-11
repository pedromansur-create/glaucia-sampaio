import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/shell";
import { occasions, productsForOccasion } from "@/lib/catalog";
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
  const { slug } = Route.useParams();
  const o = occasions.find((x) => x.slug === slug);
  const list = productsForOccasion(slug);

  if (!o) {
    return (
      <div className="px-8 py-24">
        <h1 className="font-display text-4xl">Ocasião não encontrada</h1>
        <Link to="/ocasioes" className="mt-4 inline-block text-sm underline">
          Todas as ocasiões
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="relative h-[54dvh] min-h-[360px] overflow-hidden">
        <img src={o.image} alt="" className="ken absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:px-12">
          <p className="text-[11px] tracking-[0.28em] text-muted uppercase">Ocasião</p>
          <h1 className="mt-2 font-display text-5xl md:text-7xl">{o.title}</h1>
          <p className="mt-2 max-w-lg text-muted">{o.subtitle}</p>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-2 px-2 py-8 md:grid-cols-3 md:gap-3 md:px-4">
        {list.map((p) => (
          <ProductCard key={p.slug} slug={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
