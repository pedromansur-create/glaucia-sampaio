import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/colecao")({
  component: () => <Navigate to="/colecao/$slug" params={{ slug: "novidades" }} />,
});
