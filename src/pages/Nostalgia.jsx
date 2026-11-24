// El-Masry Store - Nostalgia: classic games 1965-2012
// Data: Wikidata (SPARQL) + Wikimedia Commons cover art where available
// (honest coverage: most entries have generated placeholder art).
// Reference links only - no ROMs, no downloads. The Download button is the
// same demo animation as the main store (adds to Library, no real file).
// Author: Ahmed El-Masry
import { useMemo, useState } from 'react'
import nostalgia from '../data/nostalgia.json'

const PAGE = 24

function placeholderHues(title) {
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `linear-gradient(135deg, hsl(${h % 360}, 55%, 40%), hsl(${(h + 80) % 360}, 60%, 20%))`
}

export default function Nostalgia({ onDemoDownload }) {
  const [query, setQuery] = useState('')
  const [decade, setDecade] = useState('All')
  const [platform, setPlatform] = useState('All')
  const [shown, setShown] = useState(PAGE)
  const [downloading, setDownloading] = useState(null)

  const decades = useMemo(() => ['All', ...new Set(nostalgia.games.map((g) => `${Math.floor(g.year / 10) * 10}s`))], [])
  const platforms = useMemo(() => {
    const set = new Set()
    nostalgia.games.forEach((g) => g.platforms.forEach((p) => set.add(p)))
    return ['All', ...[...set].sort()]
  }, [])

  const games = useMemo(() => {
    const q = query.trim().toLowerCase()
    return nostalgia.games.filter(
      (g) =>
        (decade === 'All' || `${Math.floor(g.year / 10) * 10}s` === decade) &&
        (platform === 'All' || g.platforms.includes(platform)) &&
        (!q || g.title.toLowerCase().includes(q)),
    )
  }, [query, decade, platform])

  const visible = games.slice(0, shown)

  function demoDownload(g) {
    setDownloading(g.id)
    setTimeout(() => {
      setDownloading(null)
      onDemoDownload({ id: `nostalgia-${g.id}`, title: g.title, genre: 'Classic' })
    }, 1600)
  }

  return (
    <section className="store page-enter">
      <div className="store-head">
        <h2>Nostalgia</h2>
        <p>
          {nostalgia.count} classics from 1965 to 2012 (Wikidata, snapshot {nostalgia.fetchedAt}).{' '}
          {nostalgia.games.filter((g) => g.image).length} of them have cover art from Wikimedia
          Commons; the rest show generated placeholders.
        </p>
      </div>

      <div className="store-controls">
        <input
          className="store-search"
          type="search"
          placeholder="Search classics..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShown(PAGE) }}
          aria-label="Search classics"
        />
        <div className="store-genres">
          {decades.map((d) => (
            <button key={d} className={`chip chip-btn ${decade === d ? 'active' : ''}`} onClick={() => { setDecade(d); setShown(PAGE) }}>
              {d}
            </button>
          ))}
        </div>
        <div className="store-genres">
          <select className="store-select" value={platform} onChange={(e) => { setPlatform(e.target.value); setShown(PAGE) }} aria-label="Filter by platform">
            {platforms.map((p) => (
              <option key={p} value={p}>{p === 'All' ? 'All platforms' : p}</option>
            ))}
          </select>
        </div>
      </div>

      {games.length === 0 ? (
        <p className="store-empty">No classics match those filters.</p>
      ) : (
        <>
          <div className="store-grid">
            {visible.map((g, i) => (
              <article className="card" key={g.id} style={{ '--d': `${Math.min(i, 11) * 60}ms` }}>
                <div className="card-cover" style={{ background: placeholderHues(g.title) }}>
                  {g.image && (
                    <img className="card-cover-img" src={g.image} alt={`${g.title} cover`} loading="lazy" decoding="async" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  )}
                  <span className="card-cover-genre">{g.year}</span>
                  {!g.image && <span className="card-cover-title">{g.title}</span>}
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <span className="card-year">{g.platforms.slice(0, 2).join(' · ') || 'Retro'}</span>
                  </div>
                  <p className="card-tagline">{g.series || g.genres[0] || ''}</p>
                  <div className="card-row">
                    <a className="card-link" href={g.wiki} target="_blank" rel="noreferrer">
                      Reference ↗
                    </a>
                    <button className="btn btn-ghost btn-sm" disabled={downloading === g.id} onClick={() => demoDownload(g)}>
                      {downloading === g.id ? 'Downloading…' : '⬇ Download (demo)'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visible.length < games.length && (
            <div className="store-more">
              <button className="btn btn-ghost" onClick={() => setShown((s) => s + PAGE)}>
                Show more ({games.length - visible.length} left)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
