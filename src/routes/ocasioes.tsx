import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { occasions } from "@/lib/catalog";

export const Route = createFileRoute("/ocasioes")({ component: OccasionsLayout });

function OccasionsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/ocasioes/") && pathname !== "/ocasioes") return <Outlet />;
  return <OccasionsIndex />;
}

function OccasionsIndex() {
  return (
    <div className="px-1 pb-16 pt-2 md:px-2">
      <h1 className="sr-only">Ocasiões</h1>
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
        {occasions.map((o) => (
          <Link
            key={o.slug}
            to="/ocasioes/$slug"
            params={{ slug: o.slug }}
            className="relative aspect-[3/4] overflow-hidden bg-white"
          >
            <img src={o.image} alt="" className="h-full w-full object-cover object-top" />
            <span className="absolute inset-x-0 bottom-2 text-center text-[10px] tracking-[0.2em] uppercase">
              {o.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
