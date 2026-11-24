// El-Masry Store - currency config
// Catalog prices are stored in USD (Steam snapshot, see catalog.json).
// Everything the user sees is converted to Egyptian pounds at the rate below.
// To refresh the rate: node scripts/update-fx.mjs  (rewrites this file)
// or just edit USD_TO_EGP + FX_DATE by hand.
export const USD_TO_EGP = 54.33
export const FX_DATE = '2026-11-24'
export const FX_SOURCE = 'ExchangeRate-API (open.er-api.com/v6/latest/USD)'

// sensible rounding for storefront display: whole pounds, thousands separator
const nf = new Intl.NumberFormat('en-EG')
export function egp(usd) {
  return Math.round(usd * USD_TO_EGP)
}
export function fmtPriceEGP(usd) {
  // Latin "EGP" label (Ahmed's choice over ج.م); isolate keeps number order
  // stable inside RTL chat bubbles
  return `\u2066${nf.format(egp(usd))} EGP\u2069`
}
// card/modal label for any game, keeping the non-Steam fallbacks
export function priceLabel(game) {
  if (game.price == null) return game.priceNote ? 'See store' : 'Coming soon'
  if (game.isFree) return 'Free'
  return fmtPriceEGP(game.price)
}
// small print shown under the store header
export const FX_NOTE_AR = `بسعر صرف \u2066${USD_TO_EGP} EGP\u2069 للدولار بتاريخ \u2066${FX_DATE}\u2069`
