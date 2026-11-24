// El-Masry Store - add specific appids to the catalog (same shape as fetch-recent)
// Usage: node scripts/add-apps.mjs 3768760 2807960 ...
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE = path.join(ROOT, 'scripts', '.cache')
const OUT = path.join(ROOT, 'src', 'data', 'catalog.json')
const IDS = process.argv.slice(2).map(Number)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stripHtml = (s = '') => s.replace(/<[^>]*>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()

async function fetchApp(appid) {
  const cacheFile = path.join(CACHE, `${appid}.json`)
  try { return JSON.parse(await readFile(cacheFile, 'utf8')) } catch {}
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=en`, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) })
  const text = await res.text()
  if (text) await writeFile(cacheFile, text)
  await sleep(300)
  return JSON.parse(text)
}

const catalog = JSON.parse(await readFile(OUT, 'utf8'))
const byId = new Map(catalog.games.map((g) => [g.appid, g]))
await mkdir(CACHE, { recursive: true })
for (const appid of IDS) {
  if (byId.has(appid)) { console.error(`have ${appid}`); continue }
  const raw = await fetchApp(appid)
  const data = raw?.[String(appid)]?.success ? raw[String(appid)].data : null
  if (!data || data.type !== 'game') { console.error(`skip ${appid}`); continue }
  const comingSoon = Boolean(data.release_date?.coming_soon)
  const isFree = Boolean(data.is_free)
  const price = data.price_overview ? data.price_overview.final / 100 : isFree ? 0 : null
  const year = Number((data.release_date?.date || '').match(/(\d{4})/)?.[1]) || null
  byId.set(appid, {
    appid, title: stripHtml(data.name),
    steamGenres: (data.genres || []).map((g) => g.description),
    price, isFree,
    discount: data.price_overview?.discount_percent || 0,
    basePrice: data.price_overview ? data.price_overview.initial / 100 : price,
    rating: data.metacritic?.score ? Math.round((data.metacritic.score / 20) * 10) / 10 : null,
    ratingSource: data.metacritic?.score ? 'metacritic' : null,
    reviewCount: data.recommendations?.total || null,
    year,
    releaseDate: data.release_date?.date || null,
    comingSoon,
    poster: data.header_image,
    wallpaper: data.background_raw || data.background || null,
    trailer: data.movies?.[0]?.mp4?.max || data.movies?.[0]?.webm?.max || null,
    screenshots: (data.screenshots || []).slice(0, 15).map((s) => ({ thumb: s.path_thumbnail, full: s.path_full })),
    description: stripHtml(data.short_description || '').slice(0, 260),
    store: `https://store.steampowered.com/app/${appid}/`,
  })
  console.error(`added ${appid} ${data.name} ${comingSoon ? '(coming soon)' : ''}`)
}
catalog.games = [...byId.values()]
catalog.count = catalog.games.length
await writeFile(OUT, JSON.stringify(catalog))
console.error(`total=${catalog.count}`)
