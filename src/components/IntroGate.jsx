// El-Masry Store - "click to enter" intro
// Author: Ahmed El-Masry
// Browser autoplay rules require a user gesture before audio, so the whole
// experience opens behind this splash. On click: a monstrous voice growls
// "El-Masry Store" (public/media/intro-voice.mp3, generated with TTS +
// pitch-down/reverb/distortion; falls back to the Web Speech API if the
// file is missing), then the store fades in and the ambient pad starts.
import { useState } from 'react'
import Logo from './Logo.jsx'

export default function IntroGate({ onEnter }) {
  const [leaving, setLeaving] = useState(false)

  function speakFallback() {
    try {
      const u = new SpeechSynthesisUtterance('El-Masry Store')
      u.pitch = 0.1
      u.rate = 0.7
      u.volume = 1
      speechSynthesis.speak(u)
    } catch {
      /* no speech available - continue silently */
    }
  }

  function enter() {
    if (leaving) return
    setLeaving(true)
    const voice = new Audio('/media/intro-voice.mp3')
    voice.onerror = speakFallback
    voice.play().catch(speakFallback)
    // let the growl land, then open the store
    setTimeout(onEnter, 2400)
  }

  return (
    <div className={`intro ${leaving ? 'leaving' : ''}`} onClick={enter} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && enter()}>
      <div className="intro-ring" />
      <div className="intro-ring intro-ring-2" />
      <div className="intro-inner">
        <Logo size={72} />
        <h1 className="intro-title">EL-MASRY STORE</h1>
        <p className="intro-sub">Reserve the games. Feel the power.</p>
        <span className="intro-cta">CLICK TO ENTER</span>
      </div>
    </div>
  )
}
