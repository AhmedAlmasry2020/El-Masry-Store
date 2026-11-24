// El-Masry Store - game card with real cover art (Steam CDN, lazy-loaded,
// CSS gradient fallback if the image fails)
// Author: Ahmed El-Masry
import { useState } from 'react'
import { priceLabel } from '../data/currency.js'

export default function GameCard({ game, index, onOpen, reserved, owned }) {
  // capsule (small) -> header (big) -> gradient
  const [src, setSrc] = useState(game.posterSmall || game.poster || null)
  return (
    <article
      className="card"
      style={{ '--d': `${Math.min(index, 11) * 60}ms` }}
      onClick={() => onOpen(game)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(game)}
    >
      <div
        className="card-cover"
        style={{ background: `linear-gradient(135deg, ${game.hues[0]}, ${game.hues[1]})` }}
      >
        {src && (
          <img
            className="card-cover-img"
            src={src}
            alt={`${game.title} cover art`}
            loading="lazy"
            decoding="async"
            onError={() => setSrc(src === game.posterSmall && game.poster ? game.poster : null)}
          />
        )}
        <span className="card-cover-genre">{game.genre}</span>
        {owned ? (
          <span className="card-cover-owned">IN LIBRARY</span>
        ) : (
          reserved && <span className="card-cover-reserved">RESERVED</span>
        )}
        {!src && <span className="card-cover-title">{game.title}</span>}
        <span className="card-cover-shine" />
      </div>
      <div className="card-body">
        <div className="card-row">
          <span className="card-rating">{game.rating ? `★ ${game.rating.toFixed(1)}` : '★ —'}</span>
          <span className="card-year">{game.year || ''}</span>
        </div>
        <p className="card-tagline">{game.tagline}</p>
        <div className="card-row">
          <span className="card-price">
            {priceLabel(game)}
            {game.discount > 0 && <span className="card-discount">-{game.discount}%</span>}
          </span>
          <span className="card-cta">View & Reserve →</span>
        </div>
      </div>
    </article>
  )
}
