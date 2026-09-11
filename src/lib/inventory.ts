import raw from "../data/inventory.json";

type Line = { size: string; color: string; qty: number };
type Entry = { handle: string; onHand: number; sizes: Record<string, number>; lines: Line[] };

const byHandle = new Map((raw.products as Entry[]).map((p) => [p.handle, p]));

export function inventoryFor(handle?: string | null) {
  if (!handle) return null;
  return byHandle.get(handle) ?? null;
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
