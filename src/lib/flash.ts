/** Sitewide 25% until midnight 11→12 Sep 2026, America/Sao_Paulo. */
export const FLASH_CODE = "FLASH25";
export const FLASH_RATE = 0.25;
export const FLASH_ENDS = Date.parse("2026-09-12T00:00:00-03:00");

export function flashActive(now = Date.now()) {
  return now < FLASH_ENDS;
}

export function salePrice(list: number, now = Date.now()) {
  if (!flashActive(now) || list <= 0) return list;
  return Math.round(list * (1 - FLASH_RATE) * 100) / 100;
}
