import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Layers, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { shopifyCartUrl, shopifyReadyCount } from "@/lib/shopify";
import { WELCOME_CODE } from "@/lib/catalog";
import { FLASH_CODE, flashActive } from "@/lib/flash";
import { useShop } from "@/lib/store";

export function IosTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cart = useShop((s) => s.cart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const count = cart.reduce((a, i) => a + i.qty, 0);

  const tabs = [
    { to: "/" as const, label: "Início", icon: Home, active: pathname === "/" },
    {
      to: "/colecao/$slug" as const,
      params: { slug: "novidades" },
      label: "Coleção",
      icon: Layers,
      active: pathname.startsWith("/colecao") || pathname.startsWith("/produto") || pathname.startsWith("/ocasioes"),
    },
    {
      to: "/lookbook" as const,
      label: "Musas",
      icon: Sparkles,
      active: pathname.startsWith("/lookbook"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-paper/92 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        {tabs.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            params={"params" in item ? item.params : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px] tracking-wide",
              item.active ? "text-ink" : "text-subtle",
            )}
          >
            <item.icon size={20} strokeWidth={item.active ? 2 : 1.5} />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className={cn(
            "relative flex flex-col items-center gap-0.5 py-2 text-[10px] tracking-wide",
            pathname.startsWith("/checkout") ? "text-ink" : "text-subtle",
          )}
        >
          <ShoppingBag size={20} strokeWidth={1.5} />
          Sacola
          {count > 0 && (
            <span className="absolute top-1 right-[22%] grid min-w-4 place-items-center rounded-pill bg-ink px-1 text-[9px] text-paper">
              {count}
            </span>
          )}
        </button>
        <Link
          to="/atelier"
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 text-[10px] tracking-wide",
            pathname.startsWith("/atelier") || pathname.startsWith("/boutique") ? "text-ink" : "text-subtle",
          )}
        >
          <UserRound size={20} strokeWidth={1.5} />
          Atelier
        </Link>
      </div>
    </nav>
  );
}

export function IosInstallSheet() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("gs-ios-install") === "1";
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (!seen && ios && !standalone) {
      const t = window.setTimeout(() => setShow(true), 4000);
      return () => window.clearTimeout(t);
    }
    return;
  }, []);

  if (!show) return null;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center md:hidden">
      <p className="text-[10px] tracking-[0.18em] uppercase">
        Safari → compartilhar → adicionar à tela de início
      </p>
      <button
        type="button"
        className="mt-1 text-[10px] tracking-[0.16em] text-subtle uppercase"
        onClick={() => {
          localStorage.setItem("gs-ios-install", "1");
          setShow(false);
        }}
      >
        OK
      </button>
    </aside>
  );
}

export function ShopifyPayButton({ className }: { className?: string }) {
  const cart = useShop((s) => s.cart);
  const store = useShop((s) => s.shopifyStore);
  const welcomeApplied = useShop((s) => s.welcomeApplied);
  const ready = shopifyReadyCount(cart);
  const url = shopifyCartUrl(store, cart, flashActive() ? FLASH_CODE : welcomeApplied ? WELCOME_CODE : null);
  if (!url || ready === 0) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-cursor="on"
      className={cn(
        "flex h-12 items-center justify-center rounded-pill bg-ink text-xs tracking-[0.2em] text-paper uppercase",
        className,
      )}
    >
      Pagar · {ready} {ready === 1 ? "peça" : "peças"}
    </a>
  );
}
