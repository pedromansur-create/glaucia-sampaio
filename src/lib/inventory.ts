import raw from "../data/inventory.json";

type Size = "PP" | "P" | "M" | "G" | "GG";

export type StockLine = { size: string; color: string; qty: number };
export type StockEntry = { handle: string; onHand: number; sizes: Record<string, number>; lines: StockLine[] };

const SIZE_CANON: Record<string, Size> = {
  pp: "PP",
  "34": "PP",
  p: "P",
  "36": "P",
  "35": "P",
  m: "M",
  "38": "M",
  "37": "M",
  g: "G",
  "40": "G",
  gg: "GG",
  "42": "GG",
  "44": "GG",
  "46": "GG",
};

export function canonSize(raw: string): Size | "" {
  const n = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return SIZE_CANON[n] ?? "";
}

export function sizeAndColor(v: {
  option1?: string | null;
  option2?: string | null;
  size?: string;
  color?: string;
}) {
  if (v.size) {
    return { size: canonSize(v.size) || v.size.trim() || "U", color: (v.color || "").trim() };
  }
  const a = String(v.option1 || "").trim();
  const b = String(v.option2 || "").trim();
  const ca = canonSize(a);
  const cb = canonSize(b);
  if (cb && !ca) return { size: cb, color: a };
  if (ca) return { size: ca, color: b };
  return { size: a || "U", color: b };
}

const seed = new Map((raw.products as unknown as StockEntry[]).map((p) => [p.handle, p]));
let live: Map<string, StockEntry> | null = null;

export function hydrateInventory(entries: StockEntry[]) {
  if (!entries.length) return;
  live = new Map(entries.map((p) => [p.handle, p]));
}

export function stockFromVariants(
  handle: string,
  variants: Array<{
    option1?: string | null;
    option2?: string | null;
    available?: boolean;
    inventory_quantity?: number;
    size?: string;
    color?: string;
  }>,
): StockEntry {
  const sizes: Record<string, number> = {};
  const lines: StockLine[] = [];
  for (const v of variants) {
    const { size, color } = sizeAndColor(v);
    const qty =
      typeof v.inventory_quantity === "number" ? Math.max(0, v.inventory_quantity) : v.available ? 1 : 0;
    lines.push({ size, color, qty });
    sizes[size] = (sizes[size] ?? 0) + qty;
  }
  return { handle, onHand: Object.values(sizes).reduce((a, b) => a + b, 0), sizes, lines };
}

export function inventoryFor(handle?: string | null) {
  if (!handle) return null;
  return live?.get(handle) ?? seed.get(handle) ?? null;
}

export function sizeOnHand(handle: string | undefined, size: string, color?: string) {
  const row = inventoryFor(handle);
  if (!row) return null;
  const want = canonSize(size) || size;
  if (color) {
    const line = row.lines.find(
      (l) =>
        (canonSize(l.size) || l.size).toLowerCase() === want.toLowerCase() &&
        l.color.toLowerCase() === color.toLowerCase(),
    );
    if (line) return line.qty;
  }
  return row.sizes[want] ?? row.sizes[size] ?? row.sizes[size.toUpperCase()] ?? 0;
}
