// El-Masry Store - game details dialog
// Real wallpaper art (Steam CDN, gradient fallback), official trailer
// (YouTube for the curated 12, Steam-hosted mp4 for the rest), demo
// reservation, official store link and demo library/download flow.
// NOTE: the "Download now" flow is a DEMO animation only - no game files,
// keys or cracks are served. "Get it on Steam" is the real purchase path.
// Author: Ahmed El-Masry
import { useEffect, useState } from 'react'
import WallpaperGallery from './WallpaperGallery.jsx'
import TrailerVideo from './TrailerVideo.jsx'
import { fmtPriceEGP } from '../data/currency.js'

export default function GameModal({ game, user, reserved, owned, onReserve, onOwn, onClose }) {
  const [showTrailer, setShowTrailer] = useState(false)
  const [imgOk, setImgOk] = useState(Boolean(game.wallpaper || game.poster))
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    if (!downloading) return
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t)
          setDownloading(false)
          onOwn(game) // demo: after "download" the game lands in the Library
          return 100
        }
        return Math.min(100, p + Math.random() * 14)
      })
    }, 220)
    return () => clearInterval(t)
  }, [downloading]) // eslint-disable-line react-hooks/exhaustive-deps

  const art = game.wallpaper || game.poster

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div
          className="modal-wallpaper"
          style={{ background: `linear-gradient(120deg, ${game.hues[0]}, ${game.hues[1]})` }}
        >
          {imgOk && (
            <img
              className="modal-wallpaper-img"
              src={art}
              alt={`${game.title} background art`}
              onError={() => setImgOk(false)}
            />
          )}
          <h2 className="modal-wallpaper-title">{game.title}</h2>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            <span className="chip">{game.genre}</span>
            <span className="chip">
              {game.rating ? `★ ${game.rating.toFixed(1)}` : '★ —'}
              {game.ratingSource === 'metacritic' && <em className="chip-src"> Metacritic</em>}
              {game.ratingSource === 'steam-reviews' && <em className="chip-src"> Steam reviews</em>}
            </span>
            {game.year && <span className="chip">{game.year}</span>}
            {game.platforms.map((p) => (
              <span className="chip chip-dim" key={p}>
                {p}
              </span>
            ))}
          </div>

          <p className="modal-desc">{game.description}</p>

          {showTrailer ? (
            <div className="modal-trailer">
              {game.trailerYouTube ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${game.trailerYouTube}?rel=0&autoplay=1`}
                  title={`${game.title} official trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : game.trailer ? (
                <TrailerVideo src={game.trailer} title={game.title} />
              ) : (
                <p className="modal-hint">No trailer available for this one.</p>
              )}
            </div>
          ) : (
            (game.trailerYouTube || game.trailer) && (
              <button
                className="modal-trailer-btn"
                style={{ background: `linear-gradient(135deg, ${game.hues[0]}, ${game.hues[1]})` }}
                onClick={() => setShowTrailer(true)}
              >
                <span className="play-icon">▶</span> Watch the official trailer
              </button>
            )
          )}

          <div className="modal-actions">
            <span className="modal-price">
              {game.price == null
                ? game.priceNote || `Coming soon${game.releaseDate ? ` - ${game.releaseDate}` : ''}`
                : game.isFree
                  ? 'Free to Play'
                  : fmtPriceEGP(game.price)}
              {game.discount > 0 && (
                <span className="modal-was">
                  {fmtPriceEGP(game.basePrice)} <b>-{game.discount}%</b>
                </span>
              )}
            </span>
            {reserved ? (
              <button className="btn btn-reserved" disabled>
                ✓ Reserved
              </button>
            ) : (
              <button className="btn" onClick={() => onReserve(game)}>
                {game.comingSoon ? 'Pre-order (demo)' : 'Reserve this game'}
              </button>
            )}
          </div>

          <WallpaperGallery game={game} />

          <div className="modal-actions modal-actions-2">
            <a className="btn btn-ghost btn-sm" href={game.store} target="_blank" rel="noreferrer">
              {game.isFree && game.appid ? 'Install free on Steam ↗' : game.appid ? 'Get it on Steam ↗' : `Official store ↗ (${game.platforms[0]})`}
            </a>
            {owned ? (
              <button className="btn btn-ghost btn-sm" onClick={() => { setProgress(0); setDownloading(true) }} disabled={downloading}>
                {downloading ? 'Downloading…' : '⬇ Download now (demo)'}
              </button>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => onOwn(game)}>
                ✓ I own it - add to Library
              </button>
            )}
          </div>

          {downloading && (
            <div className="download-bar">
              <div className="download-fill" style={{ width: `${progress}%` }} />
              <span>{Math.floor(progress)}% - demo download, no real files</span>
            </div>
          )}

          {!user && <p className="modal-hint">You need to sign in to reserve.</p>}
          <p className="modal-note">
            Demo reservation, demo download - no payment and no game files. The Steam button is the
            official store page.
          </p>
        </div>
      </div>
    </div>
  )
}
