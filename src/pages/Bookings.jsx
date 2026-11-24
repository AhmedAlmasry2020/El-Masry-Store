// El-Masry Store - my reservations
// Author: Ahmed El-Masry
import { GAMES } from '../data/games.js'
import { priceLabel } from '../data/currency.js'

export default function Bookings({ user, bookings, onCancel, onBrowse, onLogin }) {
  if (!user) {
    return (
      <section className="page-enter bookings-empty">
        <h2>My Reservations · الألعاب المحجوزة</h2>
        <p>Sign in to see and manage your reserved games.</p>
        <button className="btn" onClick={onLogin}>
          Sign in
        </button>
      </section>
    )
  }

  const items = bookings
    .map((b) => ({ booking: b, game: GAMES.find((g) => g.id === b.gameId) }))
    .filter((x) => x.game)

  return (
    <section className="page-enter bookings">
      <h2>My Reservations · الألعاب المحجوزة</h2>
      {items.length === 0 ? (
        <div className="bookings-empty">
          <p>Nothing reserved yet, {user.name.split(' ')[0]}. The vault is waiting.</p>
          <button className="btn" onClick={onBrowse}>
            Browse games
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {items.map(({ booking, game }, i) => (
            <div className="booking-row" style={{ '--d': `${i * 70}ms` }} key={booking.id}>
              <span
                className="booking-swatch"
                style={{ background: `linear-gradient(135deg, ${game.hues[0]}, ${game.hues[1]})` }}
              >
                {game.title.charAt(0)}
              </span>
              <div className="booking-info">
                <strong>{game.title}</strong>
                <span>
                  {game.genre} · {priceLabel(game)} · reserved{' '}
                  {new Date(booking.at).toLocaleDateString()}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onCancel(booking.id)}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
