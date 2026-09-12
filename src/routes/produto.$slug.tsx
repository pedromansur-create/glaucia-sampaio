import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getProduct, whatsappUrl, FREE_SHIPPING_FROM, subscribeCatalog, catalogStamp } from "@/lib/catalog";
import { jsonLdScript, pageHead, productJsonLd } from "@/lib/seo";
import { formatBRL } from "@/lib/format";
import { displayPrices } from "@/lib/flash";
import {
  isSizeAvailable,
  matchShopifyVariant,
  shopifyHandleFor,
  type ShopifyProductLive,
} from "@/lib/shopify";
import { getShopifyProduct } from "@/lib/shopify.functions";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => {
    const p = getProduct(params.slug);
    if (!p) {
      return pageHead({
        title: "Peça não encontrada",
        description: "Essa peça saiu da vitrine.",
        path: `/produto/${params.slug}`,
        noindex: true,
      });
    }
    return pageHead({
      title: `${p.name} ${p.brand}`,
      description: `${p.name} ${p.brand}. ${p.composition || p.fabric}. Comprar em Uberlândia ou com envio para o Brasil.`,
      path: `/produto/${p.slug}`,
      image: p.images[0],
      type: "product",
    });
  },
  component: ProductPage,
});

function ProductPage() {
  useSyncExternalStore(subscribeCatalog, catalogStamp, catalogStamp);
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const close = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    void navigate({ to: "/" });
  };
  const p = getProduct(slug);
  const add = useShop((s) => s.add);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const cycleZoom = useShop((s) => s.cycleZoom);
  const setSizeOpen = useShop((s) => s.setSizeOpen);
  const zoom = useShop((s) => s.zoom);
  const store = useShop((s) => s.shopifyStore);
  const herSize = useShop((s) => s.herSize);
  const rememberSize = useShop((s) => s.rememberSize);
  const [colorId, setColorId] = useState(p?.colors[0]?.id ?? "");
  const [size, setSize] = useState(herSize || "");
  const [shot, setShot] = useState(0);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(false);
  const [live, setLive] = useState<ShopifyProductLive | null>(null);
  const handle = p ? p.shopifyHandle || shopifyHandleFor(p.slug) : undefined;
  const count = cart.reduce((a, i) => a + i.qty, 0);

  useEffect(() => {
    setColorId(p?.colors[0]?.id ?? "");
    setSize(herSize || "");
    setShot(0);
    setAdded(false);
    setInfo(false);
    setLive(null);
    if (!p || !handle) return;
    let cancelled = false;
    getShopifyProduct({ data: { handle, store } })
      .then((data) => {
        if (!cancelled && data) setLive(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [p, handle, store, herSize]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate({ to: "/colecao/$slug", params: { slug: "novidades" } });
      if (e.key === "ArrowRight" && p) setShot((n) => (n + 1) % Math.max(p.images.length, 1));
      if (e.key === "ArrowLeft" && p) setShot((n) => (n - 1 + Math.max(p.images.length, 1)) % Math.max(p.images.length, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, p]);

  const color = p?.colors.find((c) => c.id === colorId) ?? p?.colors[0];
  const liveColors = live?.colors ?? [];
  const liveSizes = live?.sizes?.length ? live.sizes : (p?.sizes ?? []);
  const selectedColorName = liveColors.includes(color?.name ?? "")
    ? (color?.name ?? liveColors[0])
    : (liveColors[0] ?? color?.name ?? "");
  const matched = useMemo(() => {
    if (!live) return undefined;
    return matchShopifyVariant(live, size, selectedColorName);
  }, [live, size, selectedColorName]);
  const shots = useMemo(() => {
    const liveShots = live?.images?.filter(Boolean) ?? [];
    const local = p?.images?.length ? p.images : [];
    const merged = [...liveShots, ...local].filter((src, i, arr) => arr.indexOf(src) === i);
    return merged.length ? merged : ["/looks/hero-portrait.jpg"];
  }, [live, p]);

  if (!p) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-white">
        <div className="relative z-10 flex items-center justify-between px-3 pt-[max(0.4rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={close}
            className="relative z-10 grid size-11 place-items-center text-lg touch-manipulation"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center px-8">
          <p className="text-center text-[11px] tracking-[0.2em] uppercase">
            {slug.replace(/-/g, " ")}
          </p>
        </div>
        <div className="px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <a
            href={whatsappUrl(`Olá, quero a personal shopper para ${slug.replace(/-/g, " ")}.`)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-center text-[10px] tracking-[0.22em] uppercase"
          >
            Personal shopper
          </a>
        </div>
      </div>
    );
  }

  const displayColor = color ?? p.colors[0];
  const addToBag = async () => {
    if (!size) return;
    if (live && !isSizeAvailable(live, size, selectedColorName)) return;
    setBusy(true);
    try {
      let variantId = matched?.id;
      if (handle && !variantId) {
        const data = await getShopifyProduct({ data: { handle, store } });
        if (data) {
          setLive(data);
          variantId = matchShopifyVariant(data, size, displayColor.name)?.id;
        }
      }
      add({
        slug: p.slug,
        size,
        colorId: displayColor.id,
        colorName: displayColor.name,
        qty: 1,
        variantId,
      });
      setAdded(true);
      setCartOpen(true);
    } catch {
      add({ slug: p.slug, size, colorId: displayColor.id, colorName: displayColor.name, qty: 1 });
      setAdded(true);
      setCartOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const touchX = useRef<number | null>(null);
  const onSwipeStart = (e: React.TouchEvent) => {
    touchX.current = e.changedTouches[0].clientX;
  };
  const onSwipeEnd = (e: React.TouchEvent) => {
    if (touchX.current == null || shots.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    setShot((n) => (dx > 0 ? (n - 1 + shots.length) % shots.length : (n + 1) % shots.length));
  };

  return (
    <div className="fixed inset-0 z-[80] flex h-[100svh] max-h-dvh flex-col overflow-hidden overscroll-none bg-white">
      <h1 className="sr-only">
        {p.brand} {p.name}
      </h1>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(p)) }} />
      <div className="relative z-10 flex shrink-0 items-center justify-between px-3 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
          className="relative z-10 grid size-11 place-items-center text-lg touch-manipulation"
          aria-label="Fechar"
        >
          ×
        </button>
        <div className="flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleZoom();
            }}
            className="relative z-10 grid size-11 place-items-center text-lg touch-manipulation"
            aria-label="Zoom"
          >
            +
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCartOpen(true);
            }}
            className="relative z-10 flex h-11 items-center px-1 text-[10px] tracking-[0.22em] uppercase touch-manipulation"
            aria-label="Sacola"
          >
            BAG{count ? ` ${count}` : ""}
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden touch-pan-y"
        onTouchStart={onSwipeStart}
        onTouchEnd={onSwipeEnd}
      >
        <div className="relative mx-auto h-full max-w-[min(92vw,720px)]">
          <button
            type="button"
            className="flex h-full w-full items-center justify-center touch-manipulation"
            onClick={() => setShot((n) => (n + 1) % shots.length)}
            aria-label="Próxima foto"
          >
            <img
              src={shots[shot]}
              alt={p.name}
              draggable={false}
              className="max-h-full max-w-full select-none object-contain transition-transform duration-300"
              style={{ transform: `scale(${zoom})` }}
            />
          </button>
          {shots.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setShot((n) => (n - 1 + shots.length) % shots.length);
                }}
                className="absolute top-1/2 left-0 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center touch-manipulation"
              >
                <svg width="7" height="13" viewBox="0 0 7 13" fill="none" aria-hidden>
                  <path d="M6.2.6.8 6.5l5.4 5.9" stroke="currentColor" strokeWidth="1.1" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Próxima foto"
                onClick={(e) => {
                  e.stopPropagation();
                  setShot((n) => (n + 1) % shots.length);
                }}
                className="absolute top-1/2 right-0 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center touch-manipulation"
              >
                <svg width="7" height="13" viewBox="0 0 7 13" fill="none" aria-hidden>
                  <path d="M.8.6l5.4 5.9L.8 12.4" stroke="currentColor" strokeWidth="1.1" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        <p className="text-[10px] tracking-[0.22em] uppercase">{p.brand}</p>
        <div className="mt-0.5 flex items-baseline justify-between gap-3 text-[11px] tracking-[0.14em] uppercase">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.setTimeout(() => setSizeOpen(true), 50);
            }}
            className="truncate text-left"
          >
            {p.shortName} ?
          </button>
          <span className="shrink-0 text-[18px] tracking-[0.04em] tabular-nums">
            {(() => {
              const price = matched?.price ?? p.price;
              const shown = displayPrices(price, p.compareAt);
              return shown.was ? (
                <>
                  <span className="mr-2 text-[13px] text-subtle line-through">{formatBRL(shown.was)}</span>
                  {formatBRL(shown.now)}
                </>
              ) : (
                formatBRL(shown.now)
              );
            })()}
          </span>
        </div>
        {info ? (
          <p className="mt-1 text-[10px] leading-snug tracking-[0.04em] text-muted">
            {p.composition || p.fabric}. Frete grátis acima de {formatBRL(FREE_SHIPPING_FROM)}.
          </p>
        ) : (
          <p className="mt-1 truncate text-[10px] tracking-[0.04em] text-muted">
            {p.composition || p.fabric}
          </p>
        )}

        {liveColors.length > 1 && (
          <div className="mt-2 flex justify-center gap-5 text-[11px] tracking-[0.16em] uppercase">
            {liveColors.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setColorId(p.colors.find((c) => c.name === name)?.id ?? name)}
                className={selectedColorName === name ? "underline" : "opacity-40"}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 text-[13px] tracking-[0.2em]">
          {liveSizes.map((s) => {
            const available = !live || isSizeAvailable(live, s, selectedColorName);
            return (
              <button
                key={s}
                type="button"
                disabled={!available}
                onClick={() => {
                  setSize(s);
                  rememberSize(s);
                }}
                className={`grid h-11 min-w-8 place-items-center uppercase ${s === size ? "underline" : "text-muted"} ${!available ? "line-through" : ""} disabled:text-subtle`}
              >
                {s}
              </button>
            );
          })}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.setTimeout(() => setSizeOpen(true), 50);
            }}
            className="grid h-11 w-11 place-items-center text-[10px] tracking-[0.18em] text-muted"
            aria-label="Guia de medidas"
          >
            ?
          </button>
        </div>

        <button
          type="button"
          disabled={
            busy ||
            !size ||
            Boolean(live && (!isSizeAvailable(live, size, selectedColorName) || !live.available))
          }
          onClick={() => void addToBag()}
          className="mt-1 flex h-11 w-full items-center justify-center text-[11px] tracking-[0.4em] text-ink uppercase touch-manipulation disabled:text-muted"
        >
          {busy
            ? "…"
            : added
              ? "ADDED"
              : live && !live.available
                ? "ESGOTADO"
                : "ADD"}
        </button>
        <p className="mt-1 text-center text-[10px] tracking-[0.12em] text-muted uppercase">
          {p.preorder ? `Pré-venda ${p.preorder.shipsFrom}` : "2 dias úteis"} · PIX · 10x ·{" "}
          <Link to="/trocas" className="underline">
            7 dias
          </Link>
          {" · "}
          <a
            href={whatsappUrl(`Olá, quero a personal shopper para o ${p.name} (${p.brand}). Uso ${size || "—"}.`)}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Personal shopper
          </a>
        </p>
      </div>
    </div>
  );
}
