// El-Masry Store - Nostalgia dataset builder (1965-2012 classics)
// Source: Wikidata SPARQL (query.wikidata.org) - video games by publication
// date, ordered by sitelink count (notability proxy), with platform labels,
// series and cover images from Wikimedia Commons (hotlinking allowed).
// Reference links point to Wikipedia/Wikidata - no ROMs, no downloads.
// Usage: node scripts/fetch-nostalgia.mjs
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'src', 'data', 'nostalgia.json')
const ENDPOINT = 'https://query.wikidata.org/sparql'
const UA = 'ElMasryStoreDemo/1.0 (student project; contact via github)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const RANGES = [
  [1965, 1979],
  [1980, 1989],
  [1990, 1999],
  [2000, 2009],
  [2010, 2012],
]

async function sparql(query) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}&format=json`, {
        headers: { 'user-agent': UA, accept: 'application/sparql-results+json' },
        signal: AbortSignal.timeout(60000),
      })
      if (res.status === 429 || res.status >= 500) { await sleep(4000 * (attempt + 1)); continue }
      return await res.json()
    } catch { await sleep(3000 * (attempt + 1)) }
  }
  return null
}

const query = (from, to) => `
SELECT ?game ?gameLabel (MIN(?d) AS ?date) (SAMPLE(?img) AS ?image) (MAX(?sl) AS ?sitelinks)
       (GROUP_CONCAT(DISTINCT ?pLabel; separator="|") AS ?platforms)
       (GROUP_CONCAT(DISTINCT ?gLabel; separator="|") AS ?genres)
       (SAMPLE(?sLabel) AS ?series)
WHERE {
  ?game wdt:P31/wdt:P279* wd:Q7889; wdt:P577 ?d; wikibase:sitelinks ?sl.
  FILTER(YEAR(?d) >= ${from} && YEAR(?d) <= ${to})
  FILTER(?sl >= 5)
  OPTIONAL { ?game wdt:P18 ?img. }
  OPTIONAL { ?game wdt:P400 ?p. ?p rdfs:label ?pLabel. FILTER(LANG(?pLabel) = "en") }
  OPTIONAL { ?game wdt:P136 ?gn. ?gn rdfs:label ?gLabel. FILTER(LANG(?gLabel) = "en") }
  OPTIONAL { ?game wdt:P179 ?s. ?s rdfs:label ?sLabel. FILTER(LANG(?sLabel) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?game ?gameLabel
ORDER BY DESC(?sitelinks)
LIMIT 220`

const all = new Map()
for (const [from, to] of RANGES) {
  const data = await sparql(query(from, to))
  const rows = data?.results?.bindings || []
  console.error(`${from}-${to}: ${rows.length}`)
  for (const r of rows) {
    const qid = r.game.value.split('/').pop()
    const title = r.gameLabel?.value
    if (!title || title.startsWith('Q')) continue
    const img = r.image?.value || null
    all.set(qid, {
      id: qid,
      title,
      year: Number(r.date.value.slice(0, 4)),
      platforms: (r.platforms?.value || '').split('|').filter(Boolean).slice(0, 6),
      genres: (r.genres?.value || '').split('|').filter(Boolean).slice(0, 3),
      series: r.series?.value || null,
      // Commons Special:FilePath serves a scaled, hotlinkable thumbnail
      // P18 is already a Special:FilePath URL - just ask for a scaled thumb
      image: img ? (img.includes('Special:FilePath') ? `${img}?width=600` : `https://commons.wikimedia.org/wiki/Special:FilePath/${img}?width=600`) : null,
      wiki: `https://www.wikidata.org/wiki/${qid}`,
      sitelinks: Number(r.sitelinks?.value || 0),
    })
  }
  await sleep(2500) // polite to Wikidata
}

const games = [...all.values()].sort((a, b) => a.year - b.year || b.sitelinks - a.sitelinks)
await writeFile(OUT, JSON.stringify({
  fetchedAt: new Date().toISOString().slice(0, 10),
  source: 'Wikidata (query.wikidata.org SPARQL) + Wikimedia Commons images; reference links only, no downloads',
  count: games.length,
  games,
}))
console.error(`DONE total=${games.length} withImage=${games.filter((g) => g.image).length}`)
