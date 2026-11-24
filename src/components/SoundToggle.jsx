// El-Masry Store - ambient sound toggle
// Author: Ahmed El-Masry
import { useState } from 'react'
import { startAmbient, stopAmbient } from '../utils/ambient.js'

export default function SoundToggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)

  function toggle() {
    if (on) {
      stopAmbient()
      setOn(false)
    } else {
      startAmbient()
      setOn(true)
    }
  }

  return (
    <button
      className={`sound-toggle ${on ? 'on' : ''}`}
      onClick={toggle}
      title={on ? 'Mute ambient sound' : 'Play ambient sound'}
      aria-label={on ? 'Mute ambient sound' : 'Play ambient sound'}
    >
      <span className="sound-bars">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound-label">{on ? 'SOUND ON' : 'SOUND OFF'}</span>
    </button>
  )
}
