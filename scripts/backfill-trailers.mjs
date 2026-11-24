// El-Masry Store - trailer backfill
// Re-reads appdetails (cache first) and fills the trailer field with the best
// available stream (mp4/webm if present, else HLS m3u8, else DASH mpd).
// Usage: node scripts/backfill-trailers.mjs [--maxfetch 120]
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE = path.join(ROOT, 'scripts', '.cache')
const OUT = path.join(ROOT, 'src', 'data', 'catalog.json')
const argVal = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? Number(process.argv[i + 1]) : d }
const MAXFETCH = argVal('--maxfetch', Infinity)
const DELAY = Number(process.env.DELAY_MS || 250)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let networkFetches = 0
async function fetchApp(appid) {
  try { return { raw: JSON.parse(await readFile(path.join(CACHE, `${appid}.json`), 'utf8')), net: false } } catch {}
  if (networkFetches >= MAXFETCH) return 'STOP'
  networkFetches++
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=en&filters=movies`
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (catalog builder)' }, signal: AbortSignal.timeout(12000) })
      if (res.status === 429 || res.status >= 500) { await sleep(3000 * (attempt + 1)); continue }
      const text = await res.text()
      if (!text) { await sleep(1500); continue }
      // merge into the full cache file if one exists later; store partial as-is
      await writeFile(path.join(CACHE, `${appid}.movies.json`), text)
      return { raw: JSON.parse(text), net: true }
    } catch { await sleep(1500 * (attempt + 1)) }
  }
  return null
}

const best = (m) => m?.mp4?.max || m?.webm?.max || m?.hls_h264 || m?.dash_h264 || m?.dash_av1 || null

async function readCacheAny(appid) {
  for (const f of [`${appid}.json`, `${appid}.movies.json`]) {
    try { return JSON.parse(await readFile(path.join(CACHE, f), 'utf8')) } catch {}
  }
  return null
}

const catalog = JSON.parse(await readFile(OUT, 'utf8'))
await mkdir(CACHE, { recursive: true })
let filled = 0, kept = 0, none = 0, stopped = false
// pass 1: entries already cached (free); pass 2: network for the rest
for (const phase of ['cache', 'network']) {
  for (const g of catalog.games) {
    if (g.trailer) { if (phase === 'cache') kept++; continue }
    let raw = await readCacheAny(g.appid)
    if (!raw) {
      if (phase === 'cache') continue
      const r = await fetchApp(g.appid)
      if (r === 'STOP') { stopped = true; break }
      raw = r?.raw
      if (r?.net) await sleep(DELAY)
    }
    const d = raw?.[String(g.appid)]?.success ? raw[String(g.appid)].data : null
    const t = d ? best(d.movies?.[0]) : null
    if (t) { g.trailer = t; filled++ } else if (phase === 'network') none++
  }
  if (stopped) break
}
await writeFile(OUT, JSON.stringify(catalog))
console.error(`DONE filled=${filled} already=${kept} noMovie=${none} stopped=${stopped} network=${networkFetches}`)
