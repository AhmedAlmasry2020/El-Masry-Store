// El-Masry Store - game catalog
// Author: Ahmed El-Masry
//
// DATA PROVENANCE (snapshot):
// Prices, ratings, cover art (poster), background art (wallpaper) and trailer
// videos come from the public Steam storefront API
// (store.steampowered.com/api/appdetails, USD, cc=us) and SteamSpy review
// counts, fetched on catalog.fetchedAt. Prices are a SNAPSHOT of that moment
// (many entries were on sale) and images/videos are hotlinked from Valve's
// CDN - fine for a demo/portfolio, not for a commercial site.
// Re-fetch: node scripts/fetch-catalog.mjs (resume-safe, see README).
//
// ratingSource: 'metacritic' (score/20) or 'steam-reviews' (% positive * 5).
// Minecraft is not sold on Steam: its price/art note Mojang as the source and
// it keeps the CSS-gradient art with a Mojang link.
import catalog from './catalog.json'

// Curated presentation for the original 12: official YouTube trailers and
// hand-written taglines/platforms. Everything else uses Steam's own data.
const CURATED = {
  3240220: {
    genre: 'Action',
    platforms: ['PC', 'PS5', 'Xbox'],
    tagline: 'Los Santos is yours. Three lives, one city of chaos.',
    trailerYouTube: 'QkkoHAzjnUs',
    hues: ['#f7971e', '#c21500'],
  },
  1174180: {
    genre: 'Adventure',
    platforms: ['PC', 'PS4', 'Xbox'],
    tagline: 'The end of the Wild West, lived one ride at a time.',
    trailerYouTube: 'gmA6MrX81z4',
    hues: ['#8e0e00', '#1f1c18'],
  },
  1245620: {
    genre: 'RPG',
    platforms: ['PC', 'PS5', 'Xbox'],
    tagline: 'Rise, Tarnished. The Lands Between await.',
    trailerYouTube: 'E3Huy2cdih0',
    hues: ['#c9a227', '#2b2118'],
  },
  292030: {
    genre: 'RPG',
    platforms: ['PC', 'PS5', 'Xbox', 'Switch'],
    tagline: 'A monster hunter chasing his daughter through war.',
    trailerYouTube: 'c0i88t0Kacs',
    hues: ['#606c88', '#3f4c6b'],
  },
  1091500: {
    genre: 'Action',
    platforms: ['PC', 'PS5', 'Xbox'],
    tagline: 'Wake up, samurai. Night City is calling.',
    trailerYouTube: '8X2kIfS6fb8',
    hues: ['#fcee09', '#ff003c'],
  },
  1551360: {
    genre: 'Racing',
    platforms: ['PC', 'Xbox'],
    tagline: 'Mexico at 300 km/h. The festival never ends.',
    trailerYouTube: 'FYH9n37B7Yw',
    hues: ['#fc4a1a', '#f7b733'],
  },
  1778820: {
    genre: 'Fighting',
    platforms: ['PC', 'PS5', 'Xbox'],
    tagline: 'Fist meets fate. The Mishima saga continues.',
    trailerYouTube: '2hPuRQz6IlM',
    hues: ['#8e2de2', '#4a00e0'],
  },
  782330: {
    genre: 'Shooter',
    platforms: ['PC', 'PS5', 'Xbox', 'Switch'],
    tagline: 'Raze Hell. The Slayer is back.',
    trailerYouTube: '_J2YcaVqjCQ',
    hues: ['#cb2d3e', '#ef473a'],
  },
  3405690: {
    // Ahmed's catalog had EA SPORTS FC 24, which Steam delisted; FC 26 is the
    // current edition, so it takes its slot with live data.
    genre: 'Sports',
    platforms: ['PC', 'PS5', 'Xbox', 'Switch'],
    tagline: "The world's game, rebuilt from the badge up.",
    hues: ['#11998e', '#38ef7d'],
  },
  2050650: {
    genre: 'Horror',
    platforms: ['PC', 'PS5', 'Xbox'],
    tagline: 'Survival is just the beginning.',
    trailerYouTube: '_FKF7GojDjM',
    hues: ['#232526', '#614385'],
  },
  1466860: {
    genre: 'Strategy',
    platforms: ['PC', 'Xbox'],
    tagline: 'History written one battle at a time.',
    trailerYouTube: 'Ovt7d34_hRA',
    hues: ['#b24592', '#f15f79'],
  },
}

// Deterministic fallback gradient (used when a CDN image fails to load).
function hashHues(title) {
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const a = h % 360
  return [`hsl(${a}, 62%, 45%)`, `hsl(${(a + 70) % 360}, 68%, 22%)`]
}

// Steam genre -> store genre (keeps the filter chips compact)
function mapGenre(steamGenres = []) {
  const order = ['Action', 'RPG', 'Adventure', 'Strategy', 'Simulation', 'Racing', 'Sports', 'Indie', 'Casual']
  for (const g of order) if (steamGenres.includes(g)) return g
  if (steamGenres.includes('Massively Multiplayer')) return 'MMO'
  return steamGenres[0] || 'Action'
}

export const FETCHED_AT = catalog.fetchedAt

const steamGames = catalog.games.map((g) => {
  const cur = CURATED[g.appid] || {}
  return {
    id: `app-${g.appid}`,
    appid: g.appid,
    title: g.title,
    genre: cur.genre || g.storeGenre || mapGenre(g.steamGenres),
    price: g.price,
    isFree: g.isFree,
    discount: g.discount,
    basePrice: g.basePrice,
    rating: g.rating,
    ratingSource: g.ratingSource,
    reviewCount: g.reviewCount,
    year: g.year,
    platforms: cur.platforms || ['PC'],
    tagline: cur.tagline || g.description,
    description: g.description,
    // grid shows Steam's small capsule (231x87, a few KB); the full header
    // is the fallback and the wallpaper only loads when the modal opens
    poster: g.poster,
    posterSmall: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}/capsule_231x87.jpg`,
    wallpaper: g.wallpaper,
    // derived official Steam CDN art (verified URL patterns)
    artHero: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}/library_hero.jpg`,
    artPortrait: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}/library_600x900.jpg`,
    artWide: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}/capsule_616x353.jpg`,
    screenshots: g.screenshots || [],
    releaseDate: g.releaseDate || null,
    comingSoon: Boolean(g.comingSoon),
    trailer: g.trailer, // Steam-hosted mp4
    trailerYouTube: cur.trailerYouTube || g.trailerYouTube || null,
    store: g.store,
    hues: cur.hues || hashHues(g.title),
  }
})

// Not on Steam - Mojang/Microsoft sell it directly. Price: minecraft.net
// (Java & Bedrock bundle for PC, USD, checked on the snapshot date).
// Art stays the CSS gradient: Mojang's CDN URLs are not stable enough to
// hotlink, so the gradient + official link is the honest fallback.
const MINECRAFT = {
  id: 'minecraft',
  appid: null,
  title: 'Minecraft',
  genre: 'Sandbox',
  price: 29.99,
  isFree: false,
  discount: 0,
  basePrice: 29.99,
  rating: 4.8,
  ratingSource: 'publisher',
  reviewCount: null,
  year: 2011,
  platforms: ['PC', 'PS5', 'Xbox', 'Switch', 'Mobile'],
  tagline: 'Build anything. Survive everything.',
  description:
    'The blocky universe that needs no introduction. Create, explore and survive alone or with friends, forever.',
  poster: null,
  wallpaper: null,
  trailer: null,
  trailerYouTube: 'MmB9b5njVbA', // Minecraft - Official Minecraft Trailer
  store: 'https://www.minecraft.net/store/minecraft-java-bedrock-edition-pc',
  hues: ['#43e97b', '#1f6f3d'],
}

// Not on Steam, added at Ahmed's request (like Minecraft). Prices are not
// verifiable from the JS-only store pages, so the UI shows "see store" and
// the button links to the official store page. Platform marked clearly.
const NON_STEAM = [
  {
    id: 'alan-wake-2',
    appid: null,
    title: 'Alan Wake 2',
    genre: 'Horror',
    price: null,
    priceNote: 'See Epic Games Store',
    isFree: false,
    discount: 0,
    basePrice: null,
    rating: 4.5, // Metacritic 89/100 at launch
    ratingSource: 'metacritic',
    reviewCount: null,
    year: 2023,
    platforms: ['PC (Epic)', 'PS5', 'Xbox Series'],
    tagline: 'Two writers, one Dark Place. Survival horror perfected.',
    description:
      'Saga Anderson arrives in Bright Falls as Alan Wake writes his way out of thirteen years in the Dark Place. Remedy at its weirdest and best. PC version is exclusive to the Epic Games Store.',
    poster: null,
    posterSmall: null,
    wallpaper: null,
    trailer: null,
    trailerYouTube: 'dlQ3FeNu5Yw', // PlayStation - Alan Wake 2 Launch Trailer (verified via oEmbed)
    store: 'https://store.epicgames.com/en-US/p/alan-wake-2',
    hues: ['#0f2f4a', '#7a1f1f'],
  },
  {
    id: 'ghost-of-yotei',
    appid: null,
    title: 'Ghost of Yotei',
    genre: 'Action',
    price: null,
    priceNote: 'See PlayStation Store',
    isFree: false,
    discount: 0,
    basePrice: null,
    rating: null,
    ratingSource: null,
    reviewCount: null,
    year: 2025,
    platforms: ['PS5'],
    tagline: 'A new ghost rises under Mount Yotei.',
    description:
      "Sucker Punch's follow-up to Ghost of Tsushima: Atsu's journey of vengeance across 1603 Ezo. PlayStation 5 exclusive.",
    poster: null,
    posterSmall: null,
    wallpaper: null,
    trailer: null,
    trailerYouTube: 'sLcksHR30UA', // PlayStation - Ghost of Yotei Launch Trailer (verified via oEmbed)
    store: 'https://store.playstation.com/en-us/search/ghost%20of%20yotei',
    hues: ['#d8b26e', '#4a3220'],
  },
]

// Minecraft sits with the other curated headliners, then the Steam catalog.
const CURATED_IDS = new Set(Object.keys(CURATED).map(Number))
const headliners = steamGames.filter((g) => CURATED_IDS.has(g.appid))
const rest = steamGames.filter((g) => !CURATED_IDS.has(g.appid))

export const GAMES = [...headliners.slice(0, 8), MINECRAFT, ...NON_STEAM, ...headliners.slice(8), ...rest]

export const GENRES = ['All', ...new Set(GAMES.map((g) => g.genre))]

// ---------- helpers for sections ----------
export function parseSteamDate(d) {
  if (!d) return null
  // Steam formats: "Mar 27, 2026" | "27 Mar, 2026" | "Q1 2027" | "2027"
  const m = d.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/)
  const norm = m ? `${m[2]} ${m[1]}, ${m[3]}` : d
  const t = Date.parse(norm)
  return Number.isNaN(t) ? null : t
}

const EDITION_TAIL = /\b(goty|definitive|remastered|remaster|complete|enhanced|anniversary|ultimate|special|collector'?s|standard|edition|legacy|hd|vr|goty edition)\b/gi
const ROMAN = /\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/gi

export function seriesKey(title) {
  let t = title.toLowerCase().replace(/[™®©:’\-–—]/g, ' ')
  t = t.replace(/\([^)]*\)/g, ' ')
  t = t.replace(EDITION_TAIL, ' ')
  // drop trailing part numbers/romans and subtitles after the franchise name:
  // keep the first two meaningful words as the franchise key
  const words = t.split(/[^a-z0-9']+/).filter(Boolean)
  const stop = new Set(['the', 'a', 'of'])
  const sig = words.filter((w) => !stop.has(w) && !/^\d+$/.test(w) && !ROMAN.test(w))
  return sig.slice(0, 2).join(' ')
}

export const SERIES = (() => {
  const groups = new Map()
  for (const g of GAMES) {
    const key = seriesKey(g.title)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(g)
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([key, list]) => ({
      key,
      name: list.sort((a, b) => (a.year || 0) - (b.year || 0))[0].title.replace(/[:\-–—].*$/, '').replace(/\s+(I{1,3}V?|VI{0,3}|IX|X|\d+)$/i, '').trim(),
      games: list,
    }))
    .sort((a, b) => b.games.length - a.games.length)
})()

export const NEW_RELEASES = GAMES.filter((g) => {
  if (g.comingSoon) return false
  // section shows notable releases (Steam review volume or a Metacritic score)
  if (!g.rating && (g.reviewCount || 0) < 150) return false
  const t = parseSteamDate(g.releaseDate)
  if (t) return Date.now() - t < 400 * 24 * 3600 * 1000
  return g.year && g.year >= 2025
}).sort((a, b) => (parseSteamDate(b.releaseDate) || 0) - (parseSteamDate(a.releaseDate) || 0))

export const UPCOMING = GAMES.filter((g) => g.comingSoon).sort(
  (a, b) => (parseSteamDate(a.releaseDate) || Infinity) - (parseSteamDate(b.releaseDate) || Infinity),
)
