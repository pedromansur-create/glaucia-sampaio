import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FREE_SHIPPING_FROM, WELCOME_CODE, WELCOME_RATE, getProduct } from "./catalog";
import { FLASH_CODE, FLASH_RATE, flashActive } from "./flash";
import { DEFAULT_SHOPIFY_STORE } from "./shopify";

export type CartItem = {
  slug: string;
  size: string;
  colorId: string;
  colorName?: string;
  qty: number;
  variantId?: number;
};

type ShopState = {
  cart: CartItem[];
  wishlist: string[];
  cartOpen: boolean;
  menuOpen: boolean;
  searchOpen: boolean;
  sizeOpen: boolean;
  welcomeApplied: boolean;
  welcomeUnlocked: boolean;
  welcomeUsed: boolean;
  introSeen: boolean;
  shopifyStore: string;
  zoom: number;
  herSize: string;
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  setSize: (key: string, size: string) => void;
  toggleWish: (slug: string) => void;
  setCartOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setSizeOpen: (v: boolean) => void;
  unlockWelcome: () => void;
  applyWelcome: () => void;
  markIntro: () => void;
  setShopifyStore: (host: string) => void;
  cycleZoom: () => void;
  rememberSize: (size: string) => void;
  clearCart: () => void;
};

export function itemKey(item: Pick<CartItem, "slug" | "size" | "colorId">) {
  return `${item.slug}__${item.size}__${item.colorId}`;
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      cartOpen: false,
      menuOpen: false,
      searchOpen: false,
      sizeOpen: false,
      welcomeApplied: false,
      welcomeUnlocked: false,
      welcomeUsed: false,
      introSeen: false,
      shopifyStore: DEFAULT_SHOPIFY_STORE,
      zoom: 1,
      herSize: "",
      add: (item) => {
        const key = itemKey(item);
        const cart = [...get().cart];
        const i = cart.findIndex((c) => itemKey(c) === key);
        if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + item.qty };
        else cart.push(item);
        const first = !get().welcomeUsed;
        if (typeof document !== "undefined" && item.size) {
          document.cookie = `gs-size=${encodeURIComponent(item.size)};path=/;max-age=31536000;samesite=lax`;
        }
        set({
          cart,
          cartOpen: true,
          herSize: item.size || get().herSize,
          welcomeApplied: first ? true : get().welcomeApplied,
          welcomeUnlocked: first ? true : get().welcomeUnlocked,
        });
      },
      remove: (key) => set({ cart: get().cart.filter((c) => itemKey(c) !== key) }),
      setQty: (key, qty) =>
        set({
          cart: get().cart.map((c) => (itemKey(c) === key ? { ...c, qty: Math.max(1, qty) } : c)),
        }),
      setSize: (key, size) =>
        set({
          cart: get().cart.map((c) => (itemKey(c) === key ? { ...c, size, variantId: undefined } : c)),
        }),
      toggleWish: (slug) => {
        const w = get().wishlist;
        set({ wishlist: w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug] });
      },
      setCartOpen: (v) => set({ cartOpen: v }),
      setMenuOpen: (v) => set({ menuOpen: v }),
      setSearchOpen: (v) => set({ searchOpen: v }),
      setSizeOpen: (v) => set({ sizeOpen: v }),
      unlockWelcome: () => set({ welcomeUnlocked: true }),
      applyWelcome: () => set({ welcomeApplied: true, welcomeUnlocked: true }),
      markIntro: () => set({ introSeen: true }),
      setShopifyStore: (host) => set({ shopifyStore: host }),
      cycleZoom: () => set((s) => ({ zoom: s.zoom >= 1.65 ? 1 : Number((s.zoom + 0.32).toFixed(2)) })),
      rememberSize: (size) => {
        if (typeof document !== "undefined" && size) {
          document.cookie = `gs-size=${encodeURIComponent(size)};path=/;max-age=31536000;samesite=lax`;
        }
        set({ herSize: size });
      },
      clearCart: () => set({ cart: [], welcomeApplied: false, welcomeUsed: true }),
    }),
    {
      name: "gs-boutique",
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        welcomeApplied: s.welcomeApplied,
        welcomeUnlocked: s.welcomeUnlocked,
        welcomeUsed: s.welcomeUsed,
        introSeen: s.introSeen,
        shopifyStore: s.shopifyStore,
        herSize: s.herSize,
      }),
    },
  ),
);

export function cartTotals(cart: CartItem[], welcomeApplied: boolean) {
  const lines = cart.map((item) => {
    const p = getProduct(item.slug);
    const unit = p?.price ?? 0;
    const sale = Boolean(p?.compareAt && p.compareAt > (p.price ?? 0) * 1.02);
    return { item, product: p, unit, sale, line: unit * item.qty };
  });
  const subtotal = lines.reduce((a, l) => a + l.line, 0);
  const flash = flashActive();
  const eligible = lines.filter((l) => !l.sale).reduce((a, l) => a + l.line, 0);
  const discount = flash
    ? Math.round(eligible * FLASH_RATE * 100) / 100
    : welcomeApplied
      ? Math.round(eligible * WELCOME_RATE * 100) / 100
      : 0;
  const shipping = subtotal - discount >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : 45;
  const total = Math.max(0, subtotal - discount + shipping);
  const code = flash && discount > 0 ? FLASH_CODE : !flash && welcomeApplied ? WELCOME_CODE : null;
  return { lines, subtotal, discount, shipping, total, code };
}
