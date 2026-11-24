// El-Masry Store - Steam trailer player
// Steam retired progressive mp4 trailers; current trailers are HLS (m3u8)
// or DASH (mpd) streams. HLS plays natively on Safari and via hls.js
// everywhere else. Progressive mp4/webm URLs (older entries) play directly.
// Author: Ahmed El-Masry
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

export default function TrailerVideo({ src, title }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)
  const isHls = /\.m3u8(\?|$)/.test(src)
  const isDash = /\.mpd(\?|$)/.test(src)

  useEffect(() => {
    const video = ref.current
    if (!video || !isHls) return
    if (video.canPlayType('application/vnd.apple.mpegurl')) return // Safari native
    if (!Hls.isSupported()) return
    const hls = new Hls({ enableWorker: true })
    hls.loadSource(src)
    hls.attachMedia(video)
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data?.fatal) setFailed(true)
    })
    return () => hls.destroy()
  }, [src, isHls])

  if (isDash || failed) {
    // DASH without a dash.js player, or a stream that died: link out to Steam
    return <p className="modal-hint">Trailer streams on the Steam page - use "Get it on Steam" below.</p>
  }
  return <video ref={ref} src={isHls ? undefined : src} controls autoPlay muted playsInline title={`${title} trailer`} />
}
