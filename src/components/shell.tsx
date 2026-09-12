import { Link, useRouterState } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  BOUTIQUE,
  WELCOME_CODE,
  getProduct,
  searchProducts,
  whatsappUrl,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { FLASH_CODE, flashActive, salePrice } from "@/lib/flash";
import { ShopifyPayButton } from "@/components/ios";
import { IosInstallSheet } from "@/components/ios";
import { cartTotals, itemKey, useShop } from "@/lib/store";
import { hydrateFromShopify, loadLiveCatalog } from "@/lib/catalog";
import { listShopifyCatalog } from "@/lib/shopify.functions";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const takeover = pathname.startsWith("/produto");
  useEffect(() => {
    let alive = true;
    if (!useShop.getState().herSize && typeof document !== "undefined") {
      const hit = document.cookie.match(/(?:^|; )gs-size=([^;]+)/);
      if (hit?.[1]) useShop.getState().rememberSize(decodeURIComponent(hit[1]));
    }
    loadLiveCatalog().catch(() => {});
    listShopifyCatalog()
      .then((items) => {
        if (alive && items?.length) hydrateFromShopify(items);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className="relative min-h-dvh bg-bg text-ink">
      {!takeover && <Header />}
      <main>{children}</main>
      {!takeover ? <LegalBar /> : null}
      <CartDrawer />
      {!takeover && <NavMenu />}
      {!takeover && <SearchPanel />}
      <SizeGuide />
      {!takeover && <IosInstallSheet />}
    </div>
  );
}

function Header() {
  const cart = useShop((s) => s.cart);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setMenuOpen = useShop((s) => s.setMenuOpen);
  const setSearchOpen = useShop((s) => s.setSearchOpen);
  const cycleZoom = useShop((s) => s.cycleZoom);
  const count = cart.reduce((a, i) => a + i.qty, 0);
  const [flash, setFlash] = useState(flashActive);

  useEffect(() => {
    const id = window.setInterval(() => setFlash(flashActive()), 20000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-bg pt-[max(0.35rem,env(safe-area-inset-top))]">
      {flash ? (
        <p className="pb-0.5 text-center text-[10px] tracking-[0.22em] text-muted uppercase">25% até meia-noite</p>
      ) : null}
      <div className="grid grid-cols-[auto_1fr_auto] items-center px-2">
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setMenuOpen(true)}
          className="flex h-10 items-center gap-1.5 px-1 text-[10px] tracking-[0.22em] uppercase"
        >
          ≡ MENU
        </button>
        <Link to="/" className="min-w-0 text-center">
          <span className="block truncate text-[11px] tracking-[0.42em] uppercase md:text-[13px] md:tracking-[0.48em]">
            Gláucia Sampaio
          </span>
        </Link>
        <div className="flex items-center justify-end">
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className="grid size-10 place-items-center text-[15px] leading-none"
          >
            ?
          </button>
          <button type="button" aria-label="Zoom" onClick={cycleZoom} className="grid size-10 place-items-center text-lg">
            +
          </button>
          <button
            type="button"
            aria-label="Sacola"
            onClick={() => setCartOpen(true)}
            className="flex h-10 items-center px-1 text-[10px] tracking-[0.22em] uppercase"
          >
            BAG{count ? ` ${count}` : ""}
          </button>
        </div>
      </div>
    </header>
  );
}

function LegalBar() {
  return (
    <div className="border-t border-line px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center md:px-12">
      <p className="text-[10px] tracking-[0.22em] text-subtle uppercase">Nome empresarial</p>
      <p className="mt-2 text-sm tracking-wide">{BOUTIQUE.legalName}</p>
      <p className="mt-1 text-sm text-muted">CNPJ {BOUTIQUE.cnpj}</p>
      <p className="mt-3 flex justify-center gap-4 text-[10px] tracking-[0.18em] uppercase">
        <Link to="/trocas" className="underline">
          Trocas
        </Link>
        <Link to="/boutique" className="underline">
          Boutique
        </Link>
        <Link to="/atelier" className="underline">
          Shopper
        </Link>
        <Link to="/casa" className="underline">
          Casa
        </Link>
      </p>
    </div>
  );
}

function CartDrawer() {
  const open = useShop((s) => s.cartOpen);
  const setOpen = useShop((s) => s.setCartOpen);
  const cart = useShop((s) => s.cart);
  const setQty = useShop((s) => s.setQty);
  const setSize = useShop((s) => s.setSize);
  const remove = useShop((s) => s.remove);
  const welcomeApplied = useShop((s) => s.welcomeApplied);
  const welcomeUsed = useShop((s) => s.welcomeUsed);
  const applyWelcome = useShop((s) => s.applyWelcome);
  const welcomeUnlocked = useShop((s) => s.welcomeUnlocked);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const totals = cartTotals(cart, welcomeApplied);

  return (
    <aside
      className={cn(
        "fixed inset-0 z-[90] transition-[visibility] duration-300",
        open ? "visible pointer-events-auto" : "invisible pointer-events-none",
      )}
    >
      <button
        type="button"
        aria-label="Fechar sacola"
        onClick={() => setOpen(false)}
        className={cn(
          "absolute inset-0 bg-ink/30 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-[12px] tracking-[0.28em] uppercase">Sacola</h2>
          <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="grid size-11 place-items-center">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
          {cart.length === 0 ? (
            <p className="py-12 text-sm text-muted">Sua sacola está em silêncio.</p>
          ) : (
            <ul className="space-y-6">
              {totals.lines.map(({ item, product, unit }) =>
                product ? (
                  <li key={itemKey(item)} className="flex gap-4">
                    <img
                      src={product.images[0]}
                      alt=""
                      className="h-28 w-20 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{product.shortName}</p>
                      <label className="mt-1 flex items-center gap-2 text-xs text-muted">
                        {product.colors.find((c) => c.id === item.colorId)?.name}
                        <select
                          value={item.size}
                          onChange={(e) => setSize(itemKey(item), e.target.value)}
                          className="border-0 bg-transparent text-ink outline-none"
                        >
                          {product.sizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="mt-1 text-sm tabular-nums">
                        {flashActive() ? (
                          <>
                            <span className="mr-2 text-subtle line-through">{formatBRL(unit)}</span>
                            {formatBRL(salePrice(unit))}
                          </>
                        ) : (
                          formatBRL(unit)
                        )}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <button type="button" onClick={() => setQty(itemKey(item), item.qty - 1)}>
                          −
                        </button>
                        <span className="tabular-nums">{item.qty}</span>
                        <button type="button" onClick={() => setQty(itemKey(item), item.qty + 1)}>
                          +
                        </button>
                        <button
                          type="button"
                          className="ml-auto text-xs text-muted underline"
                          onClick={() => remove(itemKey(item))}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </div>
        <div className="border-t border-line px-6 py-5">
          {totals.code === FLASH_CODE && totals.discount > 0 && (
            <p className="mb-3 text-[11px] tracking-[0.12em] text-muted uppercase">25% até meia-noite</p>
          )}
          {welcomeApplied && totals.discount > 0 && totals.code !== FLASH_CODE && (
            <p className="mb-3 text-[11px] tracking-[0.12em] text-muted uppercase">
              10% primeira compra aplicado
            </p>
          )}
          {!flashActive() && !welcomeApplied && !welcomeUsed && (
            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim().toUpperCase() === WELCOME_CODE) {
                  applyWelcome();
                  setErr("");
                } else setErr("Cupom único: WELCOMEGS");
              }}
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={welcomeUnlocked ? "WELCOMEGS" : "Cupom"}
                className="h-11 flex-1 rounded-md border border-line bg-bg px-3 text-sm outline-none"
              />
              <button type="submit" className="h-11 rounded-md bg-ink px-4 text-xs tracking-widest text-paper uppercase">
                Aplicar
              </button>
            </form>
          )}
          {err && <p className="mb-2 text-xs text-coral">{err}</p>}
          <div className="space-y-1 text-sm">
            <Row k="Subtotal" v={formatBRL(totals.subtotal)} />
            {totals.discount > 0 && <Row k={`Cupom ${totals.code}`} v={`− ${formatBRL(totals.discount)}`} />}
            <Row
              k="Frete"
              v={totals.shipping === 0 ? "Grátis" : formatBRL(totals.shipping)}
            />
            <Row k="Total" v={formatBRL(totals.total)} strong />
          </div>
          <ShopifyPayButton className="mt-5" />
          <Link
            to="/checkout"
            onClick={() => setOpen(false)}
            className={cn(
              "mt-3 flex h-12 items-center justify-center text-[11px] tracking-[0.22em] uppercase",
              cart.length === 0 && "pointer-events-none opacity-40",
            )}
          >
            Checkout
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "pt-2 font-medium")}>
      <span className="text-muted">{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}

function NavMenu() {
  const open = useShop((s) => s.menuOpen);
  const setOpen = useShop((s) => s.setMenuOpen);
  const close = () => setOpen(false);
  return (
    <aside className={cn("fixed inset-0 z-[60]", open ? "visible pointer-events-auto" : "invisible pointer-events-none")}>
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={close}
        className={cn("absolute inset-0 bg-ink/25 transition-opacity", open ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "absolute top-0 left-0 flex h-full w-full max-w-sm flex-col bg-paper px-6 py-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex justify-end">
          <button type="button" aria-label="Fechar" onClick={close} className="grid size-11 place-items-center">
            <X size={18} />
          </button>
        </div>
        <nav className="mt-8 flex flex-col">
          <Link to="/" onClick={close} className="block py-3.5 text-[12px] tracking-[0.28em] uppercase">
            Shop
          </Link>
          <Link to="/colecao/$slug" params={{ slug: "novidades" }} onClick={close} className="block py-3.5 text-[12px] tracking-[0.28em] uppercase">
            Novidades
          </Link>
          <Link to="/colecao/$slug" params={{ slug: "arquivo" }} onClick={close} className="block py-3.5 text-[12px] tracking-[0.28em] uppercase">
            Sale
          </Link>
          <Link to="/ocasioes/$slug" params={{ slug: "madrinhas" }} onClick={close} className="block py-3.5 text-[12px] tracking-[0.28em] uppercase">
            Casamento
          </Link>
          <Link to="/ocasioes/$slug" params={{ slug: "all-white" }} onClick={close} className="block py-3.5 text-[12px] tracking-[0.28em] uppercase">
            All White
          </Link>
          <Link to="/ocasioes/$slug" params={{ slug: "eventos-noturnos" }} onClick={close} className="block py-3.5 text-[12px] tracking-[0.28em] uppercase">
            Noite
          </Link>
          <Link to="/trocas" onClick={close} className="block py-3.5 text-[12px] tracking-[0.28em] uppercase">
            Política de trocas
          </Link>
        </nav>
        <SizeMemory />
      </div>
    </aside>
  );
}

function SearchPanel() {
  const open = useShop((s) => s.searchOpen);
  const setOpen = useShop((s) => s.setSearchOpen);
  const herSize = useShop((s) => s.herSize);
  const [q, setQ] = useState("");
  const results = searchProducts(q, herSize).slice(0, 8);
  return (
    <aside className={cn("fixed inset-0 z-[60]", open ? "visible pointer-events-auto" : "invisible pointer-events-none")}>
      <button
        type="button"
        aria-label="Fechar busca"
        onClick={() => setOpen(false)}
        className={cn("absolute inset-0 bg-ink/30", open ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "absolute inset-x-0 top-0 bg-paper px-6 py-6 shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Search size={18} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Madrinha de dia, P"
            className="h-12 flex-1 bg-transparent text-lg outline-none"
          />
          <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center">
            <X size={18} />
          </button>
        </div>
        {q && (
          <ul className="mx-auto mt-6 max-w-3xl space-y-3">
            {results.map((p) => (
              <li key={p.slug}>
                <a
                  href={`/produto/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4"
                >
                  <img src={p.images[0]} alt="" className="h-16 w-12 object-cover object-top" />
                  <span>
                    <span className="block text-sm">{p.shortName}</span>
                    <span className="text-xs text-muted">{p.brand}</span>
                  </span>
                  <span className="ml-auto text-sm tabular-nums">{formatBRL(p.price)}</span>
                </a>
              </li>
            ))}
            {results.length === 0 && (
              <li>
                <a
                  href={whatsappUrl(`Olá, busco: ${q}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="block py-4 text-[11px] tracking-[0.2em] uppercase"
                >
                  Personal shopper
                </a>
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}

function SizeGuide() {
  const open = useShop((s) => s.sizeOpen);
  const setOpen = useShop((s) => s.setSizeOpen);
  const [armed, setArmed] = useState(false);
  const rows = [
    ["PP", "80–84", "62–66", "88–92"],
    ["P", "84–88", "66–70", "92–96"],
    ["M", "88–92", "70–74", "96–100"],
    ["G", "92–96", "74–78", "100–104"],
    ["GG", "96–102", "78–84", "104–110"],
  ];
  useEffect(() => {
    if (!open) {
      setArmed(false);
      return;
    }
    const t = window.setTimeout(() => setArmed(true), 80);
    return () => window.clearTimeout(t);
  }, [open]);
  if (!open) return null;
  return (
    <aside className="fixed inset-0 z-[100] grid place-items-center bg-white/90 p-4">
      <button
        type="button"
        aria-label="Fechar guia"
        onClick={() => armed && setOpen(false)}
        className="absolute inset-0"
      />
      <div
        className="relative z-10 w-full max-w-sm bg-white p-6"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.28em] uppercase">Medidas</p>
          <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center text-lg" aria-label="Fechar">
            ×
          </button>
        </div>
        <p className="mt-2 text-[12px] text-muted">Centímetros, corpo.</p>
        <table className="mt-5 w-full text-left text-[13px]">
          <thead className="text-[10px] tracking-[0.18em] text-muted uppercase">
            <tr>
              <th className="pb-2 font-normal">Tam</th>
              <th className="pb-2 font-normal">Busto</th>
              <th className="pb-2 font-normal">Cintura</th>
              <th className="pb-2 font-normal">Quadril</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-line">
                {r.map((c, i) => (
                  <td key={`${r[0]}-${i}`} className="py-2.5">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <a
          href={whatsappUrl("Olá, tenho dúvida de tamanho.")}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block text-center text-[11px] tracking-[0.2em] uppercase underline"
        >
          Personal shopper
        </a>
      </div>
    </aside>
  );
}

export function ProductCard({
  slug,
  product,
}: {
  slug: string;
  product?: ReturnType<typeof getProduct>;
}) {
  const p = product ?? getProduct(slug);
  const zoom = useShop((s) => s.zoom);
  if (!p) return null;
  const href = `/produto/${p.slug}`;
  return (
    <article className="relative z-20">
      <a
        href={href}
        className="block cursor-pointer touch-manipulation"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.assign(href);
        }}
      >
        <div className="aspect-[3/4] overflow-hidden bg-white">
          <img
            src={p.images[0]}
            alt={`${p.brand} ${p.name}`}
            className="h-full w-full object-cover object-top"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      </a>
    </article>
  );
}

function SizeMemory() {
  const herSize = useShop((s) => s.herSize);
  const rememberSize = useShop((s) => s.rememberSize);
  return (
    <div className="mt-10">
      <p className="text-[10px] tracking-[0.2em] text-subtle uppercase">Seu tamanho</p>
      <div className="mt-3 flex flex-wrap gap-5 text-[13px] tracking-[0.2em]">
        {["PP", "P", "M", "G", "GG"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => rememberSize(s)}
            className={s === herSize ? "underline" : "opacity-30"}
          >
            {s}
          </button>
        ))}
      </div>
      {herSize ? (
        <p className="mt-3 text-[10px] tracking-[0.08em] text-muted">
          Voltando: o {herSize} já vem marcado.
        </p>
      ) : null}
    </div>
  );
}
