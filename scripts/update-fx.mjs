// El-Masry Store - refresh the USD->EGP display rate
// Fetches the live rate from ExchangeRate-API's open endpoint and rewrites
// USD_TO_EGP / FX_DATE in src/data/currency.js. Cross-checks against the
// fawazahmed0 currency-api and warns if the two disagree by more than 3%.
// Usage: node scripts/update-fx.mjs
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FILE = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'src', 'data', 'currency.js')

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

const primary = await getJson('https://open.er-api.com/v6/latest/USD')
if (primary.result !== 'success' || !primary.rates?.EGP) throw new Error('primary FX source failed')
const rate = Math.round(primary.rates.EGP * 100) / 100
const date = new Date().toISOString().slice(0, 10)

try {
  const check = await getJson('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')
  const other = check?.usd?.egp
  if (other && Math.abs(other - rate) / rate > 0.03)
    console.warn(`WARNING: sources disagree: ${rate} vs ${other} (${check.date})`)
  else console.log(`cross-check ok: ${rate} vs ${other} (${check?.date})`)
} catch (e) {
  console.warn('cross-check skipped:', e.message)
}

let src = await readFile(FILE, 'utf8')
src = src
  .replace(/export const USD_TO_EGP = [\d.]+/, `export const USD_TO_EGP = ${rate}`)
  .replace(/export const FX_DATE = '[^']*'/, `export const FX_DATE = '${date}'`)
await writeFile(FILE, src)
console.log(`updated: 1 USD = ${rate} EGP (${date})`)
