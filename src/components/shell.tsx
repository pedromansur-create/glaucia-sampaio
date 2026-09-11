import { Link, useRouterState } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import {
  BOUTIQUE,
  FREE_SHIPPING_FROM,
  INSTAGRAM,
  WELCOME_CODE,
  allProducts,
  catalogStamp,
  getProduct,
  productsForCollection,
  productsForOccasion,
  searchProducts,
  subscribeCatalog,
  whatsappUrl,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
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

  return (
    <header className="sticky top-0 z-40 bg-bg pt-[max(0.35rem,env(safe-area-inset-top))]">
      <div className="grid grid-cols-[6.5rem_1fr_6.5rem] items-center px-2 md:grid-cols-[8rem_1fr_8rem]">
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

function Footer() {
  return (
    <footer className="mt-16 border-t border-line px-6 py-10 md:mt-24 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl tracking-[0.12em]">GS</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Uma boutique de presença. Peças Fabulous Agilità, Agilità, Al Mare, LITT e Skazi —
            escolhidas à mão em Uberlândia.
          </p>
        </div>
        <div className="text-sm leading-7">
          <p className="mb-3 text-[11px] tracking-[0.22em] text-subtle uppercase">A casa</p>
          <Link to="/boutique" className="block hover:text-sardenha">
            A boutique
          </Link>
          <Link to="/atelier" className="block hover:text-sardenha">
            Atelier & personal shopper
          </Link>
          <Link to="/trocas" className="block hover:text-sardenha">
            Trocas e devoluções
          </Link>
          <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="block hover:text-sardenha">
            Instagram
          </a>
        </div>
        <div className="text-sm leading-7 text-muted">
          <p className="mb-3 text-[11px] tracking-[0.22em] text-subtle uppercase">Visite</p>
          <p>{BOUTIQUE.address}</p>
          <p>
            {BOUTIQUE.city} · {BOUTIQUE.cep}
          </p>
          <p>{BOUTIQUE.hours}</p>
          <p className="mt-3">{BOUTIQUE.phone}</p>
          <p className="mt-6 text-xs">
            <Link to="/trocas" className="underline">
              7 dias para desistir da compra
            </Link>
            , com frete de volta por nossa conta. Frete grátis acima de {formatBRL(FREE_SHIPPING_FROM)}.
            Cupom {WELCOME_CODE}: 10% na primeira compra, não válido em peças com desconto. Códigos
            não acumulam.
          </p>
        </div>
      </div>
    </footer>
  );
}

function LegalBar() {
  return (
    <div className="border-t border-line px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center md:px-12">
      <p className="text-[10px] tracking-[0.22em] text-subtle uppercase">Nome empresarial</p>
      <p className="mt-2 text-sm tracking-wide">{BOUTIQUE.legalName}</p>
      <p className="mt-1 text-sm text-muted">CNPJ {BOUTIQUE.cnpj}</p>
      <Link to="/trocas" className="mt-3 inline-block text-[10px] tracking-[0.18em] uppercase underline">
        Política de trocas
      </Link>
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
          <h2 className="font-display text-3xl">Sacola</h2>
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
                      <p className="mt-1 text-sm tabular-nums">{formatBRL(unit)}</p>
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
          {welcomeApplied && totals.discount > 0 && (
            <p className="mb-3 text-[11px] tracking-[0.12em] text-muted uppercase">
              10% primeira compra aplicado
            </p>
          )}
          {!welcomeApplied && !welcomeUsed && (
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
            {totals.discount > 0 && <Row k={`Cupom ${WELCOME_CODE}`} v={`− ${formatBRL(totals.discount)}`} />}
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
            data-cursor="on"
            className={cn(
              "mt-3 flex h-12 items-center justify-center rounded-pill border border-line text-xs tracking-[0.22em] uppercase",
              cart.length === 0 && "pointer-events-none opacity-40",
            )}
          >
            Checkout ateliê
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
  useSyncExternalStore(subscribeCatalog, catalogStamp, catalogStamp);
  const open = useShop((s) => s.menuOpen);
  const setOpen = useShop((s) => s.setMenuOpen);
  const close = () => setOpen(false);
  const shopImg = allProducts()[0]?.images[0];
  const novoImg = productsForCollection("novidades")[0]?.images[0];
  const saleImg = productsForCollection("arquivo")[0]?.images[0];
  const casaImg = productsForOccasion("madrinhas")[0]?.images[0];
  const whiteImg = productsForOccasion("all-white")[0]?.images[0];
  const noiteImg = productsForOccasion("eventos-noturnos")[0]?.images[0];

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
          "absolute top-0 left-0 flex h-full w-full max-w-lg flex-col bg-paper px-5 py-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:px-8",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex justify-end">
          <button type="button" aria-label="Fechar" onClick={close} className="grid size-11 place-items-center">
            <X size={18} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto">
          <MenuRow to="/" label="Shop" img={shopImg} onClick={close} />
          <MenuRow
            to="/colecao/$slug"
            params={{ slug: "novidades" }}
            label="Novidades"
            img={novoImg}
            onClick={close}
          />
          <MenuRow
            to="/colecao/$slug"
            params={{ slug: "arquivo" }}
            label="Sale"
            img={saleImg}
            onClick={close}
          />
          <MenuRow
            to="/ocasioes/$slug"
            params={{ slug: "madrinhas" }}
            label="Casamento"
            img={casaImg}
            onClick={close}
          />
          <MenuRow
            to="/ocasioes/$slug"
            params={{ slug: "all-white" }}
            label="All White"
            img={whiteImg}
            onClick={close}
          />
          <MenuRow
            to="/ocasioes/$slug"
            params={{ slug: "eventos-noturnos" }}
            label="Noite"
            img={noiteImg}
            onClick={close}
          />
          <MenuRow to="/trocas" label="Política de trocas" onClick={close} />
        </nav>
        <SizeMemory />
      </div>
    </aside>
  );
}

function MenuRow({
  to,
  params,
  label,
  img,
  onClick,
}: {
  to: "/colecao/$slug" | "/ocasioes/$slug" | "/" | "/trocas";
  params?: { slug: string };
  label: string;
  img?: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      params={params}
      onClick={onClick}
      className="flex items-center gap-4 border-b border-line py-3"
    >
      {img ? (
        <img src={img} alt="" className="h-[72px] w-12 shrink-0 bg-white object-cover object-top" />
      ) : (
        <span className="h-[72px] w-12 shrink-0 bg-white" />
      )}
      <span className="text-[12px] tracking-[0.28em] uppercase">{label}</span>
    </Link>
  );
}

function SearchPanel() {
  const open = useShop((s) => s.searchOpen);
  const setOpen = useShop((s) => s.setSearchOpen);
  const [q, setQ] = useState("");
  const results = searchProducts(q).slice(0, 8);
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
            placeholder="Buscar um vestido, uma ocasião, um tecido"
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
                <Link
                  to="/produto/$slug"
                  params={{ slug: p.slug }}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4"
                >
                  <img src={p.images[0]} alt="" className="h-16 w-12 rounded-sm object-cover" />
                  <span>
                    <span className="block text-sm">{p.name}</span>
                    <span className="text-xs text-muted">{p.brand}</span>
                  </span>
                  <span className="ml-auto text-sm tabular-nums">{formatBRL(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function SizeGuide() {
  const open = useShop((s) => s.sizeOpen);
  const setOpen = useShop((s) => s.setSizeOpen);
  const rows = [
    ["PP", "80–84", "62–66", "88–92"],
    ["P", "84–88", "66–70", "92–96"],
    ["M", "88–92", "70–74", "96–100"],
    ["G", "92–96", "74–78", "100–104"],
    ["GG", "96–102", "78–84", "104–110"],
  ];
  if (!open) return null;
  return (
    <aside className="fixed inset-0 z-[70] grid place-items-center p-4">
      <button
        type="button"
        aria-label="Fechar guia"
        onClick={() => setOpen(false)}
        className={cn("absolute inset-0 bg-ink/35", open ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-xl bg-paper p-8 transition-all duration-300",
          open ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
        )}
      >
        <h3 className="font-display text-3xl">Medidas</h3>
        <p className="mt-2 text-sm text-muted">Em centímetros, corpo. Em dúvida, a shopper responde no WhatsApp.</p>
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-[11px] tracking-widest text-subtle uppercase">
            <tr>
              <th className="pb-2">Tam</th>
              <th className="pb-2">Busto</th>
              <th className="pb-2">Cintura</th>
              <th className="pb-2">Quadril</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-line">
                {r.map((c) => (
                  <td key={c} className="py-2">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <a
          href={whatsappUrl(
            "Olá, Gláucia Sampaio. Tenho dúvida de tamanho e caimento. Podem me ajudar?",
          )}
          target="_blank"
          rel="noreferrer"
          className="mt-8 flex h-12 items-center justify-center rounded-pill bg-ink text-[11px] tracking-[0.18em] text-paper uppercase"
        >
          WhatsApp · personal shopper
        </a>
      </div>
    </aside>
  );
}

function Newsletter() {
  const unlock = useShop((s) => s.unlockWelcome);
  const unlocked = useShop((s) => s.welcomeUnlocked);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (unlocked) return;
    const t = window.setTimeout(() => setShow(true), 14000);
    return () => window.clearTimeout(t);
  }, [unlocked]);

  useEffect(() => {
    if (!show || done) return;
    const t = window.setTimeout(() => setShow(false), 20000);
    return () => window.clearTimeout(t);
  }, [show, done]);

  if (!show || unlocked) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    unlock();
    setDone(true);
    window.setTimeout(() => setShow(false), 1600);
  };

  return (
    <aside className="fixed inset-0 z-50 grid place-items-end p-4 md:place-items-center">
      <button type="button" aria-label="Agora não" onClick={() => setShow(false)} className="absolute inset-0 bg-ink/25" />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md rounded-xl bg-paper p-8 shadow-2xl"
      >
        <button type="button" onClick={() => setShow(false)} className="absolute top-3 right-3 grid size-10 place-items-center" aria-label="Fechar">
          <X size={16} />
        </button>
        <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">A casa</p>
        <h3 className="mt-2 font-display text-3xl">Dez por cento, uma vez.</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Cadastre-se e use {WELCOME_CODE} na primeira compra. Não vale em peças com desconto.
        </p>
        {done ? (
          <p className="mt-6 text-sm">Cupom {WELCOME_CODE} liberado.</p>
        ) : (
          <div className="mt-6 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-mail"
              className="h-12 flex-1 rounded-md border border-line bg-bg px-3 text-sm outline-none"
            />
            <button type="submit" className="h-12 rounded-pill bg-ink px-5 text-xs tracking-widest text-paper uppercase">
              Entrar
            </button>
          </div>
        )}
      </form>
    </aside>
  );
}

function Concierge() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/produto") || pathname.startsWith("/checkout")) return null;
  return (
    <a
      href={whatsappUrl(
        "Olá, Gláucia Sampaio. Dúvida de tamanho — quero falar com a personal shopper.",
      )}
      target="_blank"
      rel="noreferrer"
      data-cursor="on"
      className="fixed right-4 bottom-6 z-40 grid size-12 place-items-center rounded-pill bg-ink text-[10px] tracking-[0.14em] text-paper uppercase shadow-lg md:right-8 md:bottom-8 md:w-auto md:px-4"
    >
      <span className="hidden md:inline">WhatsApp</span>
      <span className="md:hidden">WA</span>
    </a>
  );
}

function Cursor() {
  useEffect(() => {
    const el = document.getElementById("gs-cursor");
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      const on = (e.target as HTMLElement | null)?.closest("[data-cursor='on']");
      el.classList.toggle("on", Boolean(on));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div id="gs-cursor" className="gs-cursor" />;
}

export function ProductCard({
  slug,
  product,
  large,
}: {
  slug: string;
  product?: ReturnType<typeof getProduct>;
  large?: boolean;
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
