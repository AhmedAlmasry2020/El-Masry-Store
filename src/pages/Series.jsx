// El-Masry Store - Games Trilogy: franchise/series collections
// Steam catalog titles grouped by franchise (heuristic on titles); opening a
// series lists every part with its poster, price, rating, year and actions.
// Author: Ahmed El-Masry
import { useMemo, useState } from 'react'
import { SERIES } from '../data/games.js'
import { fmtPriceEGP } from '../data/currency.js'

export default function Series({ onOpen }) {
  const [query, setQuery] = useState('')
  const [openKey, setOpenKey] = useState(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SERIES.filter((s) => !q || s.name.toLowerCase().includes(q) || s.games.some((g) => g.title.toLowerCase().includes(q)))
  }, [query])

  const open = SERIES.find((s) => s.key === openKey)

  return (
    <section className="store page-enter">
      <div className="store-head">
        <h2>Games Trilogy</h2>
        <p>{SERIES.length} series and collections - every part of each saga in one place.</p>
      </div>
      <div className="store-controls">
        <input
          className="store-search"
          type="search"
          placeholder="Search series..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search series"
        />
      </div>

      {!open && (
        <div className="series-grid">
          {list.map((s) => (
            <button className="series-card" key={s.key} onClick={() => setOpenKey(s.key)}>
              <div className="series-stack">
                {s.games.slice(0, 3).map((g, i) => (
                  <img key={g.id} src={g.posterSmall || g.poster} alt="" loading="lazy" decoding="async" style={{ '--i': i }} onError={(e) => { e.currentTarget.src = g.poster || g.posterSmall }} />
                ))}
              </div>
              <strong>{s.name}</strong>
              <span>{s.games.length} parts</span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="series-detail">
          <button className="btn btn-ghost btn-sm" onClick={() => setOpenKey(null)}>
            ← All series
          </button>
          <h3>{open.name}</h3>
          <div className="bookings-list">
            {[...open.games]
              .sort((a, b) => (a.year || 0) - (b.year || 0))
              .map((g) => (
                <div className="booking-row" key={g.id}>
                  <img className="series-thumb" src={g.posterSmall || g.poster} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.src = g.poster || g.posterSmall }} />
                  <div className="booking-info">
                    <strong>{g.title}</strong>
                    <span>
                      {g.year || 'TBA'} · {g.rating ? `★ ${g.rating.toFixed(1)}` : 'no rating'} ·{' '}
                      {g.price == null ? g.releaseDate || 'Coming soon' : g.isFree ? 'Free' : fmtPriceEGP(g.price)}
                    </span>
                  </div>
                  <button className="btn btn-sm" onClick={() => onOpen(g)}>
                    Open
                  </button>
                </div>
              ))}
          </div>
          <p className="wp-note">Reserve, Steam and demo-download buttons live on each game's page - press Open.</p>
        </div>
      )}
    </section>
  )
}
