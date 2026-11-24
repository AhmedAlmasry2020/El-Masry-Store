// El-Masry Store - catalog enricher
// Adds screenshots (all official Steam screenshots), releaseDate and
// comingSoon to every catalog entry by refetching appdetails (resume-safe
// per-app cache). Usage: node scripts/enrich-catalog.mjs [--maxfetch 150]
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE = path.join(ROOT, 'scripts', '.cache')
const OUT = path.join(ROOT, 'src', 'data', 'catalog.json')
const argVal = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? Number(process.argv[i + 1]) : d }
const MAXFETCH = argVal('--maxfetch', Infinity)
const DELAY_MS = Number(process.env.DELAY_MS || 250)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let networkFetches = 0
async function fetchApp(appid) {
  const cacheFile = path.join(CACHE, `${appid}.json`)
  try {
    return { raw: JSON.parse(await readFile(cacheFile, 'utf8')), net: false }
  } catch {}
  if (networkFetches >= MAXFETCH) return 'STOP'
  networkFetches++
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=en`
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) })
      if (res.status === 429 || res.status >= 500) { await sleep(3000 * (attempt + 1)); continue }
      const text = await res.text()
      if (!text) { await sleep(1500); continue }
      await writeFile(cacheFile, text)
      return { raw: JSON.parse(text), net: true }
    } catch { await sleep(1500 * (attempt + 1)) }
  }
  return null
}

async function main() {
  await mkdir(CACHE, { recursive: true })
  const catalog = JSON.parse(await readFile(OUT, 'utf8'))
  let enriched = 0
  for (const g of catalog.games) {
    if (g.screenshots && g.releaseDate !== undefined) continue
    const result = await fetchApp(g.appid)
    if (result === 'STOP') { console.error(`CHUNK DONE enriched=${enriched}`); break }
    const d = result?.raw?.[String(g.appid)]
    const data = d?.success ? d.data : null
    if (data) {
      g.screenshots = (data.screenshots || []).slice(0, 15).map((s) => ({ thumb: s.path_thumbnail, full: s.path_full }))
      g.releaseDate = data.release_date?.date || null
      g.comingSoon = Boolean(data.release_date?.coming_soon)
      enriched++
    } else {
      g.screenshots = []
      g.releaseDate = g.releaseDate ?? null
      g.comingSoon = g.comingSoon ?? false
    }
    if (result?.net) await sleep(DELAY_MS)
  }
  await writeFile(OUT, JSON.stringify(catalog))
  const remaining = catalog.games.filter((g) => !g.screenshots).length
  console.error(`DONE enriched=${enriched} remaining=${remaining} network=${networkFetches}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
