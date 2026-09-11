import raw from "../data/inventory.json";

export type StockLine = { size: string; color: string; qty: number };
export type StockEntry = { handle: string; onHand: number; sizes: Record<string, number>; lines: StockLine[] };

const seed = new Map((raw.products as unknown as StockEntry[]).map((p) => [p.handle, p]));
let live: Map<string, StockEntry> | null = null;

export function hydrateInventory(entries: StockEntry[]) {
  if (!entries.length) return;
  live = new Map(entries.map((p) => [p.handle, p]));
}

export function stockFromVariants(
  handle: string,
  variants: Array<{ option1?: string | null; option2?: string | null; available?: boolean }>,
): StockEntry {
  const sizes: Record<string, number> = {};
  const lines: StockLine[] = [];
  for (const v of variants) {
    const size = String(v.option1 || "").trim() || "U";
    const color = String(v.option2 || "").trim();
    const qty = v.available ? 1 : 0;
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
  if (color) {
    const line = row.lines.find(
      (l) => l.size.toLowerCase() === size.toLowerCase() && l.color.toLowerCase() === color.toLowerCase(),
    );
    if (line) return line.qty;
  }
  return row.sizes[size] ?? row.sizes[size.toUpperCase()] ?? row.sizes[size.toLowerCase()] ?? 0;
}
