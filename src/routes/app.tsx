import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({ component: AppGone });

function AppGone() {
  return <Navigate to="/" />;
}
