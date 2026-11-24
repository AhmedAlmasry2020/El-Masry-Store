// El-Masry Store - catalog builder
// Fetches real game data (price, review score, cover art, background art,
// Steam trailer videos) from the public Steam storefront API
// (store.steampowered.com/api/appdetails) plus popularity/review counts from
// SteamSpy (steamspy.com/api.php). Writes src/data/catalog.json.
// Resume-safe: each app's raw response is cached under scripts/.cache/.
// Usage: node scripts/fetch-catalog.mjs [--limit 1000]
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE = path.join(ROOT, 'scripts', '.cache')
const SPY_DIR = process.env.SPY_DIR || '/tmp/steam'
const OUT = path.join(ROOT, 'src', 'data', 'catalog.json')
const argVal = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? Number(process.argv[i + 1]) : d }
const LIMIT = argVal('--limit', 1000)
const MAXFETCH = argVal('--maxfetch', Infinity)
const DELAY_MS = Number(process.env.DELAY_MS || 1000)

const CURATED_FIRST = [
  3240220, // Grand Theft Auto V Enhanced
  1174180, // Red Dead Redemption 2
  1245620, // ELDEN RING
  292030, // The Witcher 3: Wild Hunt
  1091500, // Cyberpunk 2077
  1551360, // Forza Horizon 5
  1778820, // TEKKEN 8
  782330, // DOOM Eternal
  3405690, // EA SPORTS FC 26 (FC 24 was delisted from Steam)
  2050650, // Resident Evil 4 (2023)
  1466860, // Age of Empires IV
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function loadSpy() {
  const genres = ['Action', 'Adventure', 'RPG', 'Strategy', 'Indie', 'Simulation', 'Racing', 'Sports', 'Casual', 'Massively%20Multiplayer']
  const byId = new Map()
  for (const g of genres) {
    const f = path.join(SPY_DIR, `spy_${g}.json`)
    try {
      const data = JSON.parse(await readFile(f, 'utf8'))
      for (const row of Object.values(data)) {
        const prev = byId.get(row.appid)
        if (!prev) byId.set(row.appid, { appid: row.appid, positive: row.positive || 0, negative: row.negative || 0 })
      }
    } catch (e) {
      console.error('spy file missing/unreadable:', f, e.message)
    }
  }
  // most-reviewed first so the catalog leads with popular titles
  return [...byId.values()].sort((a, b) => b.positive + b.negative - (a.positive + a.negative))
}

let networkFetches = 0
async function fetchApp(appid) {
  const cacheFile = path.join(CACHE, `${appid}.json`)
  try {
    const cached = await readFile(cacheFile, 'utf8')
    return { raw: JSON.parse(cached), net: false }
  } catch {}
  if (networkFetches >= MAXFETCH) return 'STOP'
  networkFetches++
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=en`
  let lastErr
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (catalog builder)' }, signal: AbortSignal.timeout(12000) })
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`)
        await sleep(3000 * (attempt + 1))
        continue
      }
      const text = await res.text()
      if (!text) {
        lastErr = new Error('empty body')
        await sleep(2000 * (attempt + 1))
        continue
      }
      await writeFile(cacheFile, text)
      return { raw: JSON.parse(text), net: true }
    } catch (e) {
      lastErr = e
      await sleep(2000 * (attempt + 1))
    }
  }
  console.error(`SKIP ${appid}: ${lastErr}`)
  return null
}

function steamTrailer(data) {
  const m = data?.movies?.[0]
  if (!m) return null
  // Steam retired progressive mp4/webm in late 2026; current payloads carry
  // adaptive streams only. HLS h264 plays everywhere (native on Safari,
  // hls.js elsewhere), DASH is the last-resort fallback.
  return m?.mp4?.max || m?.webm?.max || m?.hls_h264 || m?.dash_h264 || m?.dash_av1 || null
}

function stripHtml(s = '') {
  return s.replace(/<[^>]*>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
}

async function main() {
  await mkdir(CACHE, { recursive: true })
  const candidates = await loadSpy()
  const spyById = new Map(candidates.map((c) => [c.appid, c]))
  console.error(`candidates: ${candidates.length}`)
  const ordered = [
    ...CURATED_FIRST.map((id) => ({ appid: id })),
    ...candidates.filter((c) => !CURATED_FIRST.includes(c.appid)),
  ]

  const games = []
  const seen = new Set()
  let prevCount = 0
  let prevIds = []
  try {
    const prev0 = JSON.parse(await readFile(OUT, 'utf8')).games || []
    prevCount = prev0.length
    prevIds = prev0.map((g) => g.appid)
  } catch {}
  for (const id of prevIds) seen.add(id) // keep enriched entries untouched
  let fetched = 0
  for (const { appid } of ordered) {
    // collect a surplus so edition-dedupe and trimming still leave ~LIMIT
    if (prevCount + games.length >= Math.ceil(LIMIT * 1.2)) break
    if (seen.has(appid)) continue
    seen.add(appid)
    const result = await fetchApp(appid)
    if (result === 'STOP') {
      console.error(`CHUNK DONE: network fetch budget hit. kept so far=${games.length}`)
      break
    }
    if (fetched++ % 25 === 0) console.error(`progress: tried=${fetched} kept=${games.length}`)
    const entry = result?.raw?.[String(appid)]
    const d = entry?.success ? entry.data : null
    if (!d || d.type !== 'game' || !d.name || !d.header_image) continue
    const isFree = Boolean(d.is_free)
    const price = d.price_overview ? d.price_overview.final / 100 : isFree ? 0 : null
    if (price === null) continue // delisted / package-only / no USD price
    const spy = spyById.get(appid)
    const totalReviews = spy ? spy.positive + spy.negative : 0
    let rating = null
    let ratingSource = null
    if (d.metacritic?.score) {
      rating = Math.round((d.metacritic.score / 20) * 10) / 10
      ratingSource = 'metacritic'
    } else if (totalReviews >= 100) {
      rating = Math.round((spy.positive / totalReviews) * 5 * 10) / 10
      ratingSource = 'steam-reviews'
    }
    const year = Number((d.release_date?.date || '').match(/(\d{4})/)?.[1]) || null
    games.push({
      appid,
      title: stripHtml(d.name),
      steamGenres: (d.genres || []).map((g) => g.description),
      price,
      isFree,
      discount: d.price_overview?.discount_percent || 0,
      basePrice: d.price_overview ? d.price_overview.initial / 100 : price,
      rating,
      ratingSource,
      reviewCount: totalReviews || null,
      year,
      poster: d.header_image,
      wallpaper: d.background_raw || d.background || null,
      trailer: steamTrailer(d),
      description: stripHtml(d.short_description || '').slice(0, 260),
      store: `https://store.steampowered.com/app/${appid}/`,
      screenshots: (d.screenshots || []).slice(0, 15).map((x) => ({ thumb: x.path_thumbnail, full: x.path_full })),
      releaseDate: d.release_date?.date || null,
      comingSoon: Boolean(d.release_date?.coming_soon),
    })
    if (result?.net) await sleep(DELAY_MS)
  }

  // merge with any previous partial snapshot so chunked runs accumulate
  let prev = []
  try {
    prev = JSON.parse(await readFile(OUT, 'utf8')).games || []
  } catch {}
  const merged = new Map()
  for (const g of [...prev, ...games]) if (!merged.has(g.appid)) merged.set(g.appid, g)

  // Dedupe editions: same base game (GOTY / Definitive / Remastered / Legacy ...)
  // appears once, as its newest edition.
  const EDITION_WORDS = /\b(game of the year( edition)?|goty|definitive( edition)?|remastered|remaster|complete( edition)?|enhanced( edition)?|anniversary( edition)?|ultimate( edition)?|special( edition)?|collector'?s( edition)?|standard( edition)?|director'?s cut|legacy|hd|vr)\b/gi
  const baseTitle = (t) =>
    t
      .toLowerCase()
      .replace(/[™®©]/g, '')
      .replace(EDITION_WORDS, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  const byBase = new Map()
  for (const g of merged.values()) {
    const base = baseTitle(g.title)
    const prev2 = byBase.get(base)
    if (!prev2) {
      byBase.set(base, g)
      continue
    }
    // keep the newer edition; same year -> the more-reviewed one
    const gY = g.year || 0
    const pY = prev2.year || 0
    if (gY > pY || (gY === pY && (g.reviewCount || 0) > (prev2.reviewCount || 0))) byBase.set(base, g)
  }

  // Rank: popularity (review count) with a recency boost, then trim to LIMIT.
  const scored = [...byBase.values()].map((g) => ({
    g,
    score: (g.reviewCount || 1) * (1 + Math.max(0, (g.year || 2010) - 2015) / 20),
  }))
  scored.sort((a, b) => b.score - a.score)
  const all = scored.slice(0, LIMIT).map((s) => s.g)

  const snapshot = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    source: 'Steam storefront API (store.steampowered.com/api/appdetails, USD) + SteamSpy review counts',
    count: all.length,
    games: all,
  }
  await writeFile(OUT, JSON.stringify(snapshot))
  console.error(`DONE kept=${all.length} tried=${fetched} newNetwork=${networkFetches} uniqueEditions=${byBase.size}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
