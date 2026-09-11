import { createFileRoute, Link } from "@tanstack/react-router";
import { occasions } from "@/lib/catalog";

export const Route = createFileRoute("/ocasioes")({ component: OccasionsIndex });

function OccasionsIndex() {
  return (
    <div className="px-4 py-10 md:px-10">
      <p className="text-[11px] tracking-[0.28em] text-subtle uppercase">Ocasiões</p>
      <h1 className="mt-2 max-w-3xl font-display text-5xl md:text-7xl">
        Diga o evento. A gente veste o resto.
      </h1>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {occasions.map((o) => (
          <Link
            key={o.slug}
            to="/ocasioes/$slug"
            params={{ slug: o.slug }}
            data-cursor="on"
            className="group relative min-h-[380px] overflow-hidden rounded-lg"
          >
            <img src={o.image} alt="" className="product-img absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-paper">
              <h2 className="font-display text-4xl">{o.title}</h2>
              <p className="mt-2 text-sm text-paper/80">{o.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
