// El-Masry Store - catalog with search, genre filter and load-more pagination
// Author: Ahmed El-Masry
import { useMemo, useState } from 'react'
import { GAMES, GENRES, FETCHED_AT, NEW_RELEASES, UPCOMING } from '../data/games.js'
import { FX_NOTE_AR, FX_SOURCE } from '../data/currency.js'
import GameCard from '../components/GameCard.jsx'

const PAGE = 24

// Search matching: ignore punctuation/spaces/case so "spiderman", "spider man"
// and "Spider-Man" all match, plus common Arabic spellings of big titles.
const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '')
const AR_ALIASES = {
  'سبايدرمان': 'spider-man', 'سبايدر مان': 'spider-man',
  'لاست اوف اس': 'last of us', 'ذا لاست اوف اس': 'last of us',
  'انشارتد': 'uncharted', 'جود اوف وور': 'god of war', 'راتشيت': 'ratchet',
  'ريد ديد': 'red dead', 'جي تي ايه': 'grand theft auto', 'جتا': 'grand theft auto',
  'ويتشر': 'witcher', 'الدن رينج': 'elden ring', 'ماينكرافت': 'minecraft',
  'ريزدنت ايفل': 'resident evil', 'سايبربانك': 'cyberpunk', 'فورتنايت': 'fortnite',
  'مورتال كومبات': 'mortal kombat', 'تيكن': 'tekken', 'هوجوورتس': 'hogwarts',
  'باتلفيلد': 'battlefield', 'كول اوف ديوتي': 'call of duty', 'فالورانت': 'valorant',
  'ستيلار بليد': 'stellar blade', 'سايلنت هيل': 'silent hill',
}
const queryTerms = (q) => {
  const terms = [norm(q)]
  for (const [ar, en] of Object.entries(AR_ALIASES)) if (q.includes(ar)) terms.push(norm(en))
  return terms.filter(Boolean)
}

export default function Store({ onOpen, reservedIds, ownedIds }) {
  const [genre, setGenre] = useState('All')
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(PAGE)

  const games = useMemo(() => {
    const terms = queryTerms(query.trim().toLowerCase())
    return GAMES.filter(
      (g) =>
        (genre === 'All' || g.genre === genre) &&
        (!terms.length ||
          terms.some(
            (t) => norm(g.title).includes(t) || norm(g.tagline || '').includes(t),
          )),
    )
  }, [genre, query])

  const visible = games.slice(0, shown)

  return (
    <section className="store page-enter">
      <div className="store-head">
        <h2>The Vault</h2>
        <p>
          {GAMES.length} titles across {GENRES.length - 1} genres. Watch the trailer, reserve your
          copy.
        </p>
        <p className="store-snapshot">
          Real Steam prices & ratings, snapshot {FETCHED_AT}, shown in Egyptian pounds - <span dir="rtl">{FX_NOTE_AR}</span> ({FX_SOURCE}).
          Sale prices move; check the Steam page for today.
        </p>
      </div>

      <div className="store-controls">
        <input
          className="store-search"
          type="search"
          placeholder={`Search ${GAMES.length} games...`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShown(PAGE)
          }}
          aria-label="Search games"
        />
        <div className="store-genres">
          {GENRES.map((g) => (
            <button
              key={g}
              className={`chip chip-btn ${genre === g ? 'active' : ''}`}
              onClick={() => {
                setGenre(g)
                setShown(PAGE)
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {genre === 'All' && !query.trim() && (
        <>
          <h3 className="store-section">New releases</h3>
          <div className="store-grid">
            {NEW_RELEASES.slice(0, 12).map((g, i) => (
              <GameCard key={g.id} game={g} index={i} onOpen={onOpen} reserved={reservedIds.has(g.id)} owned={ownedIds.has(g.id)} />
            ))}
          </div>
          {UPCOMING.length > 0 && (
            <>
              <h3 className="store-section">Coming soon</h3>
              <div className="store-grid">
                {UPCOMING.slice(0, 8).map((g, i) => (
                  <GameCard key={g.id} game={g} index={i} onOpen={onOpen} reserved={reservedIds.has(g.id)} owned={ownedIds.has(g.id)} />
                ))}
              </div>
            </>
          )}
          <h3 className="store-section">All games</h3>
        </>
      )}

      {games.length === 0 ? (
        <p className="store-empty">No games match that search. Try another title or genre.</p>
      ) : (
        <>
          <div className="store-grid">
            {visible.map((g, i) => (
              <GameCard
                key={g.id}
                game={g}
                index={i}
                onOpen={onOpen}
                reserved={reservedIds.has(g.id)}
                owned={ownedIds.has(g.id)}
              />
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
