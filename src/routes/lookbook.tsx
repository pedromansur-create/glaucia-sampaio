import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/lookbook")({ component: Lookbook });

function Lookbook() {
  return <Navigate to="/colecao/$slug" params={{ slug: "novidades" }} />;
}
