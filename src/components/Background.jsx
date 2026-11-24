// El-Masry Store - full-page video wallpaper with animated fallback
// Author: Ahmed El-Masry
// Drop your own clip at public/media/bg-video.mp4 (any looping gaming
// montage you have rights to). If the file is missing, the animated
// gradient scene below renders instead, so the site always looks alive.
import { useRef, useState } from 'react'

export default function Background() {
  const [videoOk, setVideoOk] = useState(true)
  const videoRef = useRef(null)

  return (
    <div className="bg-root" aria-hidden="true">
      <div className="bg-aurora" />
      {videoOk && (
        <video
          ref={videoRef}
          className="bg-video"
          src="/media/bg-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      )}
      <div className="bg-grid" />
      <div className="bg-vignette" />
    </div>
  )
}
