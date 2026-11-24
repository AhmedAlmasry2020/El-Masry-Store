// El-Masry Store - my library (games marked as owned/installed, demo)
// Author: Ahmed El-Masry
import { GAMES } from '../data/games.js'
import nostalgia from '../data/nostalgia.json'

export default function Library({ ownedIds, onRemove, onBrowse }) {
  const items = [...ownedIds]
    .map((id) => {
      const steam = GAMES.find((g) => g.id === id)
      if (steam) return steam
      if (id.startsWith('nostalgia-')) {
        const n = nostalgia.games.find((g) => `nostalgia-${g.id}` === id)
        if (n) return { id, title: n.title, genre: 'Classic', hues: ['#7a5c2e', '#2b2118'], store: n.wiki }
      }
      return null
    })
    .filter(Boolean)

  return (
    <section className="page-enter bookings">
      <h2>My Library · مكتبتي</h2>
      {items.length === 0 ? (
        <div className="bookings-empty">
          <p>Nothing here yet. Mark a game as "I own it" or finish a demo download and it lands here.</p>
          <button className="btn" onClick={onBrowse}>
            Browse games
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {items.map((game, i) => (
            <div className="booking-row" style={{ '--d': `${i * 70}ms` }} key={game.id}>
              <span
                className="booking-swatch"
                style={{ background: `linear-gradient(135deg, ${game.hues[0]}, ${game.hues[1]})` }}
              >
                {game.title.charAt(0)}
              </span>
              <div className="booking-info">
                <strong>{game.title}</strong>
                <span>{game.genre} · in your library</span>
              </div>
              {game.store && (
                <a className="btn btn-ghost btn-sm" href={game.store} target="_blank" rel="noreferrer">
                  Open on Steam ↗
                </a>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => onRemove(game.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
