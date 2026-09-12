/** Sitewide 25% until midnight 11→12 Sep 2026, America/Sao_Paulo.
 *  Does not stack on pieces already marked down in Shopify. */
export const FLASH_CODE = "CASANOVA25";
export const FLASH_RATE = 0.25;
export const FLASH_ENDS = Date.parse("2026-09-12T00:00:00-03:00");

export function flashActive(now = Date.now()) {
  return now < FLASH_ENDS;
}

export function alreadyOnSale(price: number, compareAt?: number | null) {
  return Boolean(compareAt && compareAt > price * 1.02);
}

export function salePrice(list: number, compareAt?: number | null, now = Date.now()) {
  if (list <= 0 || alreadyOnSale(list, compareAt) || !flashActive(now)) return list;
  return Math.round(list * (1 - FLASH_RATE) * 100) / 100;
}

export function displayPrices(price: number, compareAt?: number | null) {
  if (alreadyOnSale(price, compareAt)) return { was: compareAt as number, now: price };
  if (flashActive()) return { was: price, now: salePrice(price, compareAt) };
  return { was: undefined as number | undefined, now: price };
}
