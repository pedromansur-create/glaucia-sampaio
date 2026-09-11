import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/shopify")({ component: ShopifyGone });

function ShopifyGone() {
  return <Navigate to="/" />;
}
