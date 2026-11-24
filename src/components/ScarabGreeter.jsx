// El-Masry Store - masked hero greeter for the sign-in card
// "Scarab": an original masked hero in a teal-and-gold suit with an angular
// gold visor and a scarab chest emblem. Walks in from the left edge, then
// leans on the card (desktop) or sits on its top edge (mobile), breathing
// softly. Pure decorative; pointer-events none, hidden from screen readers.
// Original hand-drawn character, drawn as inline SVG - no film/comic/game
// art or assets. Author: Ahmed El-Masry
import { useEffect, useState } from 'react'

function Defs() {
  return (
    <defs>
      <linearGradient id="sc-gold" x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0" stopColor="#f0c455" />
        <stop offset="0.55" stopColor="#d9a428" />
        <stop offset="1" stopColor="#9c6d12" />
      </linearGradient>
      <linearGradient id="sc-head" x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor="#156274" />
        <stop offset="0.6" stopColor="#0f4d5c" />
        <stop offset="1" stopColor="#062027" />
      </linearGradient>
      <linearGradient id="sc-teal" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0" stopColor="#1a7285" />
        <stop offset="0.6" stopColor="#0f4d5c" />
        <stop offset="1" stopColor="#072a33" />
      </linearGradient>
      <linearGradient id="sc-visor" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#ffe9a8" />
        <stop offset="0.7" stopColor="#f0c455" />
        <stop offset="1" stopColor="#c8912a" />
      </linearGradient>
    </defs>
  )
}

function Head() {
  return (
    <g>
      <path d="M80 22 Q99 22 101 45 Q103 63 93 74 Q86 80 80 80 Q74 80 67 74 Q57 63 59 45 Q61 22 80 22 Z" fill="url(#sc-head)" />
      {/* gold center stripe */}
      <path d="M78 22 Q76 50 78 79 L82 79 Q84 50 82 22 Z" fill="url(#sc-gold)" opacity="0.9" />
      {/* angular wraparound visor */}
      <path d="M62 40 L76 36 L84 36 L98 40 L96 52 L84 56 L76 56 L64 52 Z" fill="url(#sc-visor)" stroke="#0d0d0d" strokeWidth="2.6" />
      <path d="M66 42 L76 39" stroke="#fff" strokeWidth="1.8" opacity="0.8" strokeLinecap="round" />
      <path d="M60 39 Q58 60 67 72" stroke="#7fd4e0" strokeWidth="1.8" fill="none" opacity="0.7" />
      <path d="M72 78 L72 84 Q80 88 88 84 L88 78 Z" fill="url(#sc-teal)" />
    </g>
  )
}

function Torso({ short = false }) {
  const body = short
    ? 'M52 90 Q50 82 59 80 L67 78 Q80 74 93 78 L101 80 Q110 82 108 90 Q106 112 102 134 Q99 148 96 158 Q80 166 64 158 Q61 148 58 134 Q54 112 52 90 Z'
    : 'M52 90 Q50 82 59 80 L67 78 Q80 74 93 78 L101 80 Q110 82 108 90 Q107 112 103 138 Q100 162 96 180 Q80 188 64 180 Q60 162 57 138 Q53 112 52 90 Z'
  return (
    <g>
      <path d={body} fill="url(#sc-teal)" />
      <path d="M57 96 Q62 112 61 130 M103 96 Q98 112 99 130" stroke="#04222a" strokeWidth="1.8" fill="none" opacity="0.55" />
      <path d="M63 106 Q71 100 79 106 M81 106 Q89 100 97 106" stroke="#04222a" strokeWidth="1.6" fill="none" opacity="0.65" />
      <path d={short ? 'M68 124 h24 M69 137 h22' : 'M68 124 h24 M69 137 h22 M71 150 h18 M73 162 h14'} stroke="#04222a" strokeWidth="1.3" fill="none" opacity="0.5" />
      {/* gold scarab emblem */}
      <g fill="url(#sc-gold)">
        <ellipse cx="80" cy="97" rx="4" ry="6" />
        <ellipse cx="80" cy="89.5" rx="2.4" ry="3" />
        <path d="M75 94 q-8 -6 -11 -14 q9 2 13 8 Z" />
        <path d="M85 94 q8 -6 11 -14 q-9 2 -13 8 Z" />
      </g>
      <path d="M74 103 q-7 1 -10 7 M86 103 q7 1 10 7 M76 107 q-5 4 -6 11 M84 107 q5 4 6 11" stroke="url(#sc-gold)" strokeWidth="1.8" fill="none" />
      <path d={short ? 'M53 90 Q56 122 63 154' : 'M53 90 Q56 130 63 176'} stroke="#7fd4e0" strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  )
}

// Standing figure: walk-in and desktop lean.
function Standing() {
  return (
    <svg viewBox="0 0 160 330" className="scarab-svg scarab-stand" aria-hidden="true">
      {/* back arm */}
      <g>
        <circle cx="53" cy="90" r="10" fill="url(#sc-teal)" />
        <path d="M52 96 Q43 104 42 122" fill="none" stroke="url(#sc-teal)" strokeWidth="14" strokeLinecap="round" />
        <path d="M42 122 Q41 142 44 158" fill="none" stroke="url(#sc-teal)" strokeWidth="11" strokeLinecap="round" />
        <circle cx="45" cy="164" r="9" fill="url(#sc-gold)" />
      </g>
      {/* legs */}
      <g>
        <path d="M66 184 Q62 208 62 232" fill="none" stroke="url(#sc-teal)" strokeWidth="18" strokeLinecap="round" />
        <circle cx="62" cy="234" r="9" fill="url(#sc-teal)" />
        <path d="M62 236 Q61 262 60 288" fill="none" stroke="url(#sc-teal)" strokeWidth="14" strokeLinecap="round" />
        <path d="M50 288 Q48 304 55 309 L75 309 Q79 304 74 293 Q68 284 60 284 Z" fill="url(#sc-gold)" />
        <path d="M94 184 Q99 208 97 232" fill="none" stroke="url(#sc-teal)" strokeWidth="18" strokeLinecap="round" />
        <circle cx="97" cy="234" r="9" fill="url(#sc-teal)" />
        <path d="M97 236 Q96 262 98 286" fill="none" stroke="url(#sc-teal)" strokeWidth="14" strokeLinecap="round" />
        <path d="M88 286 Q86 304 93 309 L113 309 Q117 304 112 291 Q104 282 98 282 Z" fill="url(#sc-gold)" />
        <path d="M61 176 Q80 185 99 176 L97 194 Q80 201 63 194 Z" fill="url(#sc-gold)" />
      </g>
      <Torso />
      <Head />
      {/* front arm - raises onto the card when leaning */}
      <g className="scarab-arm-front">
        <circle cx="107" cy="90" r="10" fill="url(#sc-teal)" />
        <path d="M108 96 Q117 104 118 122" fill="none" stroke="url(#sc-teal)" strokeWidth="14" strokeLinecap="round" />
        <path d="M118 122 Q119 142 116 158" fill="none" stroke="url(#sc-teal)" strokeWidth="11" strokeLinecap="round" />
        <circle cx="115" cy="164" r="9" fill="url(#sc-gold)" />
      </g>
    </svg>
  )
}

// Sitting figure: mobile only, legs dangling over the card's face.
function Sitting() {
  return (
    <svg viewBox="0 0 160 260" className="scarab-svg scarab-sit" aria-hidden="true">
      <g>
        <path d="M66 146 Q56 156 52 166" fill="none" stroke="url(#sc-teal)" strokeWidth="17" strokeLinecap="round" />
        <circle cx="51" cy="169" r="8.5" fill="url(#sc-teal)" />
        <path d="M51 171 Q49 192 49 208" fill="none" stroke="url(#sc-teal)" strokeWidth="13" strokeLinecap="round" />
        <path d="M39 208 Q37 222 44 226 L62 226 Q66 222 61 211 Q55 203 49 203 Z" fill="url(#sc-gold)" />
        <path d="M94 146 Q104 156 108 166" fill="none" stroke="url(#sc-teal)" strokeWidth="17" strokeLinecap="round" />
        <circle cx="109" cy="169" r="8.5" fill="url(#sc-teal)" />
        <path d="M109 171 Q111 192 111 208" fill="none" stroke="url(#sc-teal)" strokeWidth="13" strokeLinecap="round" />
        <path d="M99 208 Q97 222 104 226 L122 226 Q126 222 121 211 Q115 203 111 203 Z" fill="url(#sc-gold)" />
        <path d="M60 140 Q80 150 100 140 L98 160 Q80 168 62 160 Z" fill="url(#sc-gold)" />
      </g>
      <Torso short />
      {/* arms down at his sides, hands resting on the edge */}
      <g>
        <circle cx="53" cy="90" r="9.5" fill="url(#sc-teal)" />
        <path d="M52 96 Q44 104 44 120 Q44 136 49 148" fill="none" stroke="url(#sc-teal)" strokeWidth="12" strokeLinecap="round" />
        <circle cx="51" cy="153" r="8.5" fill="url(#sc-gold)" />
        <circle cx="107" cy="90" r="9.5" fill="url(#sc-teal)" />
        <path d="M108 96 Q116 104 116 120 Q116 136 111 148" fill="none" stroke="url(#sc-teal)" strokeWidth="12" strokeLinecap="round" />
        <circle cx="109" cy="153" r="8.5" fill="url(#sc-gold)" />
      </g>
      <Head />
    </svg>
  )
}

export default function ScarabGreeter({ startLeaned = false }) {
  const [leaning, setLeaning] = useState(startLeaned)

  useEffect(() => {
    if (startLeaned) return
    const t = setTimeout(() => setLeaning(true), 3000) // matches the walk-in CSS
    return () => clearTimeout(t)
  }, [startLeaned])

  return (
    <div className={`scarab ${leaning ? 'scarab-lean' : 'scarab-walk'}`} aria-hidden="true">
      {/* shared paint servers live in this zero-size svg: url(#) refs fail if their home svg is display:none */}
      <svg width="0" height="0" style={{ position: 'absolute' }}><Defs /></svg>
      <Standing />
      <Sitting />
    </div>
  )
}
