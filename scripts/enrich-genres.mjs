// El-Masry Store - genre fixer
// Steam's own genre field lumps horror under Action/Adventure, so we pull
// SteamSpy's per-app tags (api.php?request=appdetails) and remap store
// genres from tags: Horror/Fighting/Shooter/Racing/Sports first, then the
// existing Steam-genre mapping. Also drops non-games (utilities like
// Wallpaper Engine). Resume-safe via scripts/.cache-spy.
// Usage: node scripts/enrich-genres.mjs [--maxfetch 100]
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE = path.join(ROOT, 'scripts', '.cache-spy')
const OUT = path.join(ROOT, 'src', 'data', 'catalog.json')
const argVal = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? Number(process.argv[i + 1]) : d }
const MAXFETCH = argVal('--maxfetch', Infinity)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let networkFetches = 0
async function fetchSpy(appid) {
  const cacheFile = path.join(CACHE, `${appid}.json`)
  try { return JSON.parse(await readFile(cacheFile, 'utf8')) } catch {}
  if (networkFetches >= MAXFETCH) return 'STOP'
  networkFetches++
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appid}`, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) })
      if (res.status === 429 || res.status >= 500) { await sleep(3000 * (attempt + 1)); continue }
      const text = await res.text()
      if (!text) { await sleep(1500); continue }
      await writeFile(cacheFile, text)
      await sleep(300)
      return JSON.parse(text)
    } catch { await sleep(1500 * (attempt + 1)) }
  }
  return null
}

const TAG_GENRE = [
  [['Horror', 'Survival Horror', 'Psychological Horror'], 'Horror'],
  [['Fighting'], 'Fighting'],
  [['Shooter', 'FPS', 'Third-Person Shooter'], 'Shooter'],
  [['Racing', 'Driving'], 'Racing'],
  [['Sports', 'Football', 'Soccer', 'Basketball'], 'Sports'],
  [['Sandbox', 'Open World Survival Craft'], 'Sandbox'],
]
const NON_GAME_TAGS = ['Utilities', 'Software', 'Animation & Modeling', 'Design & Illustration', 'Audio Production', 'Video Production', 'Game Development', 'Photo Editing', 'Web Publishing', 'Tutorial']
const NON_GAME_NAMES = [/wallpaper engine/i, /soundtrack/i, /sdk$/i, /dedicated server/i]

async function main() {
  await mkdir(CACHE, { recursive: true })
  const catalog = JSON.parse(await readFile(OUT, 'utf8'))
  let done = 0, dropped = 0
  const keep = []
  for (const g of catalog.games) {
    if (NON_GAME_NAMES.some((r) => r.test(g.title))) { g.storeGenre = 'Software'; keep.push(g); continue }
    const spy = await fetchSpy(g.appid)
    if (spy === 'STOP') { keep.push(g); continue }
    if (spy) {
      // vote-ranked tags: users tag loosely, so a genre only counts when it
      // is among the app's top tags (e.g. People Playground has a stray
      // 'Horror' tag deep down the list; it is a Sandbox game)
      const ranked = Object.entries(spy.tags || {}).sort((a, b) => b[1] - a[1]).map(([name]) => name)
      g.tags = ranked.slice(0, 20)
      done++
      const spyGenres = (spy.genre || '').split(',').map((x) => x.trim())
      if (NON_GAME_TAGS.some((t) => spyGenres.includes(t) || g.tags.includes(t))) { g.storeGenre = 'Software'; keep.push(g); done++; continue }
      const topTags = ranked.slice(0, 6)
      delete g.storeGenre
      for (const [tags, genre] of TAG_GENRE) {
        if (tags.some((t) => topTags.includes(t))) {
          g.storeGenre = genre
          break
        }
      }
    }
    keep.push(g)
  }
  catalog.games = keep
  catalog.count = keep.length
  await writeFile(OUT, JSON.stringify(catalog))
  const counts = {}
  for (const g of keep) counts[g.storeGenre || 'unmapped'] = (counts[g.storeGenre || 'unmapped'] || 0) + 1
  console.error(`DONE tagged=${done} dropped=${dropped} total=${keep.length}`)
  console.error(JSON.stringify(counts))
}

main().catch((e) => { console.error(e); process.exit(1) })
