// El-Masry Store - per-game wallpaper
// Exactly ONE wallpaper per game: the PC size at 1920x1080 (Steam's native
// screenshot resolution), with an open-full-size link. Hotlinked from
// Steam's CDN. Ahmed's call: no galleries, no phone/tablet crops.
// Author: Ahmed El-Masry

export default function WallpaperGallery({ game }) {
  // first official screenshot is native 1920x1080; store background as fallback
  const src = game.screenshots?.[0]?.full || game.wallpaper || game.artWide || game.poster
  if (!src) return null

  return (
    <div className="wp">
      <h3 className="wp-title">Wallpaper</h3>
      <div className="wp-single">
        <div className="wp-frame" style={{ aspectRatio: '16 / 9' }}>
          <img src={src} alt={`${game.title} wallpaper (PC 1920x1080)`} loading="lazy" decoding="async" />
        </div>
        <p className="wp-caption">
          <span>PC · 1920×1080</span>
          <a href={src} target="_blank" rel="noreferrer">
            Full size ↗
          </a>
        </p>
      </div>
      <p className="wp-note">Official artwork hotlinked from Steam's CDN.</p>
    </div>
  )
}
