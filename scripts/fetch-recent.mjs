// El-Masry Store - recent & upcoming titles fetcher
// Pulls the newest released games and coming-soon games from Steam's store
// search (sort_by=Released_DESC / filter=comingsoon), fetches appdetails for
// each, keeps notable ones, and merges them into src/data/catalog.json with
// releaseDate + comingSoon fields. Resume-safe via scripts/.cache.
// Usage: node scripts/fetch-recent.mjs [--maxfetch 80]
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

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function searchAppIds(filter) {
  const ids = []
  const base = 'https://store.steampowered.com/search/results/?query&count=100&json=1&cc=us&l=en&category1=998'
  const extra = filter === 'recent' ? '&sort_by=Released_DESC' : '&filter=comingsoon'
  const pages = filter === 'recent' ? 5 : 3
  for (let p = 0; p < pages; p++) {
    try {
      const data = await getJson(`${base}&start=${p * 100}${extra}`)
      for (const item of data.items || []) {
        const m = (item.logo || '').match(/apps\/(\d+)\//)
        if (m) ids.push(Number(m[1]))
      }
    } catch (e) {
      console.error('search page failed', filter, p, e.message)
    }
    await sleep(400)
  }
  return [...new Set(ids)]
}

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

const stripHtml = (s = '') => s.replace(/<[^>]*>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()

async function main() {
  await mkdir(CACHE, { recursive: true })
  const [recent, coming] = [await searchAppIds('recent'), await searchAppIds('coming')]
  const comingSet = new Set(coming)
  const candidates = [...new Set([...recent, ...coming])]
  console.error(`candidates recent=${recent.length} coming=${coming.length} unique=${candidates.length}`)

  const catalog = JSON.parse(await readFile(OUT, 'utf8'))
  const byId = new Map(catalog.games.map((g) => [g.appid, g]))
  let added = 0
  for (const appid of candidates) {
    if (byId.has(appid)) continue
    const result = await fetchApp(appid)
    if (result === 'STOP') { console.error('CHUNK DONE'); break }
    const d = result?.raw?.[String(appid)]
    const data = d?.success ? d.data : null
    if (!data || data.type !== 'game' || !data.name || !data.header_image) continue
    const comingSoon = Boolean(data.release_date?.coming_soon)
    const isFree = Boolean(data.is_free)
    const price = data.price_overview ? data.price_overview.final / 100 : isFree ? 0 : null
    const recos = data.recommendations?.total || 0
    if (!comingSoon && price === null) continue
    // released: keep notable titles only (big recent releases, not shovelware)
    if (!comingSoon && !data.metacritic?.score && recos < 300 && !isFree) continue
    if (result.net) await sleep(DELAY_MS)
    const year = Number((data.release_date?.date || '').match(/(\d{4})/)?.[1]) || null
    byId.set(appid, {
      appid,
      title: stripHtml(data.name),
      steamGenres: (data.genres || []).map((g) => g.description),
      price: comingSoon && price === null ? null : price,
      isFree,
      discount: data.price_overview?.discount_percent || 0,
      basePrice: data.price_overview ? data.price_overview.initial / 100 : price,
      rating: data.metacritic?.score ? Math.round((data.metacritic.score / 20) * 10) / 10 : null,
      ratingSource: data.metacritic?.score ? 'metacritic' : null,
      reviewCount: recos || null,
      year,
      releaseDate: data.release_date?.date || null,
      comingSoon,
      poster: data.header_image,
      wallpaper: data.background_raw || data.background || null,
      trailer: data.movies?.[0]?.mp4?.max || data.movies?.[0]?.webm?.max || null,
      description: stripHtml(data.short_description || '').slice(0, 260),
      store: `https://store.steampowered.com/app/${appid}/`,
    })
    added++
  }
  catalog.games = [...byId.values()]
  catalog.count = catalog.games.length
  await writeFile(OUT, JSON.stringify(catalog))
  console.error(`DONE added=${added} total=${catalog.count} newNetwork=${networkFetches}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
