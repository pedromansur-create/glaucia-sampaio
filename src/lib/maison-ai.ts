import { allProducts, inferOccasions, searchProducts, whatsappUrl, type Product } from "./catalog";
import { sizeOnHand } from "./inventory";
import { formatBRL } from "./format";

export type MaisonClient = {
  id: string;
  name: string;
  phone: string;
  size: string;
  notes: string;
  lastVisit: string;
  lastPieces: string[];
};

export type MaisonPick = {
  product: Product;
  why: string;
  sizeNote: string;
};

export type MaisonAdvice = {
  query: string;
  size: string;
  occasion: string;
  picks: MaisonPick[];
  draft: string;
  whatsapp: string;
};

const OCCASION_LABEL: Record<string, string> = {
  madrinhas: "madrinha",
  "casamento-dia": "casamento de dia",
  "all-white": "all white",
  "eventos-noturnos": "noite",
  resort: "resort",
  workwear: "workwear",
};

function sizeFrom(text: string, fallback = "") {
  const n = text.toLowerCase();
  const hit = n.match(/\b(pp|p|m|g|gg|34|36|38|40|42)\b/);
  if (!hit) return fallback;
  return hit[1]
    .toUpperCase()
    .replace("34", "PP")
    .replace("36", "P")
    .replace("38", "M")
    .replace("40", "G")
    .replace("42", "GG");
}

function occasionFrom(text: string) {
  const ids = inferOccasions([], "", text);
  return OCCASION_LABEL[ids[0] ?? ""] || (ids[0] ?? "");
}

function why(p: Product, size: string, occasion: string) {
  const bits = [p.brand];
  if (occasion) bits.push(occasion);
  if (p.composition || p.fabric) bits.push((p.composition || p.fabric).split(".")[0]);
  if (size) bits.push(`tam. ${size}`);
  return bits.filter(Boolean).slice(0, 3).join(" · ");
}

function stockLine(p: Product, size: string) {
  if (!size) return "Confirmar tamanho na casa.";
  const on = sizeOnHand(p.shopifyHandle ?? p.slug, size);
  if (on == null) return `Tam. ${size} — confirmar na casa.`;
  if (on <= 0) return `Tam. ${size} em falta. Reservar outra cor ou avisar.`;
  if (on === 1) return `Tam. ${size} — última.`;
  return `Tam. ${size} em casa.`;
}

export function maisonAdvise(query: string, client?: MaisonClient | null): MaisonAdvice {
  const q = query.trim();
  const size = sizeFrom(q, client?.size ?? "");
  const occasion = occasionFrom([q, client?.notes ?? ""].join(" "));
  const ranked = searchProducts(q || occasion || client?.notes || "", size).slice(0, 8);
  const picks: MaisonPick[] = [];
  for (const product of ranked) {
    if (picks.length >= 3) break;
    const on = size ? sizeOnHand(product.shopifyHandle ?? product.slug, size) : null;
    if (on === 0) continue;
    picks.push({
      product,
      why: why(product, size, occasion),
      sizeNote: stockLine(product, size),
    });
  }
  if (!picks.length) {
    const fallback = (ranked.length ? ranked : allProducts()).slice(0, 2);
    for (const product of fallback) {
      picks.push({
        product,
        why: why(product, size, occasion),
        sizeNote: stockLine(product, size),
      });
    }
  }

  const first = client?.name.split(" ")[0];
  const event = occasion || "o evento";
  const lines = [
    `Olá${first ? `, ${first}` : ""}. A casa separou ${picks.length === 1 ? "uma peça" : `${picks.length} peças`}${size ? ` no ${size}` : ""} para ${event}.`,
    "",
    ...picks.map((x, i) => `${i + 1}. ${x.product.brand} ${x.product.shortName} — ${formatBRL(x.product.price)}.`),
    "",
    "Quer que eu reserve o tamanho, ou prefere passar na Rua Rodolfo Correa?",
  ];
  const draft = lines.join("\n").replace(/\n{3,}/g, "\n\n");
  const wa = whatsappUrl(
    client?.phone
      ? draft
      : `Olá. ${q || event}. ${picks.map((x) => x.product.shortName).join(", ")}.`,
  );

  return { query: q, size, occasion, picks, draft, whatsapp: wa };
}

export function quietClients(clients: MaisonClient[], days = 90) {
  const cut = Date.now() - days * 86400000;
  return clients
    .filter((c) => {
      const t = Date.parse(c.lastVisit);
      return Number.isFinite(t) ? t < cut : true;
    })
    .sort((a, b) => Date.parse(a.lastVisit || "0") - Date.parse(b.lastVisit || "0"));
}

export function followUpDraft(client: MaisonClient) {
  const first = client.name.split(" ")[0] || "";
  const size = client.size ? ` No seu ${client.size}` : "";
  return `Olá, ${first}. Passou um tempo.${size} a casa tem peças novas. Quer que eu separe duas para você ver, ou prefere vir à Rua Rodolfo Correa?`;
}
