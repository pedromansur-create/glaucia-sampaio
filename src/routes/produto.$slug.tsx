import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getProduct, whatsappUrl, FREE_SHIPPING_FROM, BOUTIQUE } from "@/lib/catalog";
import { jsonLdScript, pageHead, productJsonLd } from "@/lib/seo";
import { formatBRL } from "@/lib/format";
import {
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
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const p = getProduct(slug);
  const add = useShop((s) => s.add);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const cycleZoom = useShop((s) => s.cycleZoom);
  const setSizeOpen = useShop((s) => s.setSizeOpen);
  const zoom = useShop((s) => s.zoom);
  const store = useShop((s) => s.shopifyStore);
  const [colorId, setColorId] = useState(p?.colors[0]?.id ?? "");
  const [size, setSize] = useState("");
  const [shot, setShot] = useState(0);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(false);
  const [live, setLive] = useState<ShopifyProductLive | null>(null);
  const handle = p ? shopifyHandleFor(p.slug) : undefined;
  const count = cart.reduce((a, i) => a + i.qty, 0);

  useEffect(() => {
    setColorId(p?.colors[0]?.id ?? "");
    setSize("");
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
  }, [p, handle, store]);

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

  if (!p) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <button type="button" onClick={() => navigate({ to: "/" })} className="text-xs tracking-[0.2em] uppercase">
          Back
        </button>
      </div>
    );
  }

  const displayColor = color ?? p.colors[0];
  const shots = p.images.length ? p.images : ["/looks/hero-portrait.jpg"];

  const addToBag = async () => {
    if (!size) return;
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

  const close = () => navigate({ to: "/colecao/$slug", params: { slug: "novidades" } });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <h1 className="sr-only">
        {p.brand} {p.name}
      </h1>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(p)) }} />
      <div className="flex items-center justify-between px-3 pt-[max(0.4rem,env(safe-area-inset-top))]">
        <button type="button" onClick={close} className="grid size-11 place-items-center text-lg" aria-label="Fechar">
          ×
        </button>
        <div className="flex items-center">
          <button type="button" onClick={cycleZoom} className="grid size-11 place-items-center text-lg" aria-label="Zoom">
            +
          </button>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative grid size-11 place-items-center text-xs tracking-widest"
            aria-label="Sacola"
          >
            {count || ""}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        onClick={() => setShot((n) => (n + 1) % shots.length)}
        aria-label="Próxima foto"
      >
        <img
          src={shots[shot]}
          alt={p.name}
          className="max-h-full max-w-[min(92vw,720px)] object-contain transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        />
      </button>

      {info && (
        <p className="px-6 pb-2 text-center text-[11px] leading-relaxed tracking-[0.08em] text-muted">
          {p.brand} · {p.fabric}
          <br />
          {p.fit}
        </p>
      )}

      <div className="px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-1">
        <p className="text-[10px] tracking-[0.22em] uppercase">{p.brand}</p>
        <div className="mt-1 flex items-baseline justify-between gap-4 text-[11px] tracking-[0.14em] uppercase">
          <button type="button" onClick={() => setInfo((v) => !v)} className="text-left">
            {p.shortName} {info ? "–" : "?"}
          </button>
          <span className="tabular-nums">{formatBRL(matched?.price ?? p.price)}</span>
        </div>
        <p className="mt-1 text-[10px] tracking-[0.04em] text-muted">
          Composição: {p.composition || p.fabric}
        </p>
        <p className="mt-1 text-[10px] tracking-[0.08em] text-muted">
          Frete grátis acima de {formatBRL(FREE_SHIPPING_FROM)} · 10% na primeira
        </p>

        {liveColors.length > 1 && (
          <div className="mt-3 flex justify-center gap-5 text-[11px] tracking-[0.16em] uppercase">
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

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] tracking-[0.2em]">
          {liveSizes.map((s) => {
            const available =
              !live ||
              live.variants.some(
                (v) =>
                  v.size === s &&
                  v.available &&
                  (!selectedColorName || v.color === selectedColorName || live.colors.length < 2),
              );
            return (
              <button
                key={s}
                type="button"
                disabled={!available}
                onClick={() => setSize(s)}
                className={`uppercase ${s === size ? "underline" : "opacity-30"} ${!available ? "line-through" : ""} disabled:opacity-20`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setSizeOpen(true)}
          className="mt-2 block w-full text-center text-[10px] tracking-[0.18em] text-subtle uppercase"
        >
          Guia de medidas
        </button>

        <button
          type="button"
          disabled={busy || !size}
          onClick={() => void addToBag()}
          className="mt-3 flex h-11 w-full items-center justify-center text-[11px] tracking-[0.4em] uppercase disabled:opacity-25"
        >
          {busy ? "…" : added ? "ADDED" : "ADD"}
        </button>
        <p className="mt-2 text-center text-[10px] tracking-[0.12em] text-muted uppercase">
          {p.preorder ? `Pré-venda · envio ${p.preorder.shipsFrom}` : "Sai em 2 dias úteis"} · PIX
        </p>
        <p className="mt-1 text-center text-[9px] tracking-[0.1em] text-subtle">
          {BOUTIQUE.cnpj} · 7 dias para desistir · Correios
        </p>
        <a
          href={whatsappUrl(`Olá, quero a personal shopper para o ${p.name} (${p.brand}). Uso ${size || "—"}.`)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block text-center text-[10px] tracking-[0.22em] text-subtle uppercase"
        >
          Personal shopper
        </a>
      </div>
    </div>
  );
}
