import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/colecao")({
  component: ColecaoLayout,
});

function ColecaoLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/colecao/") && pathname !== "/colecao") return <Outlet />;
  return <Navigate to="/colecao/$slug" params={{ slug: "novidades" }} />;
}
