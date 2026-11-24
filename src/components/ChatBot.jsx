// El-Masry Store - Masry, the floating AI game advisor
// Egyptian Arabic + English, RTL bubbles, voice replies via the browser's
// speech synthesis (ar voices depend on the device), voice picker with pitch
// presets, play button on every bot bubble, mute toggle.
// Author: Ahmed El-Masry
import { useEffect, useRef, useState } from 'react'
import { askAdvisor, aiConfigured, isArabic, stripForSpeech, PERSONAS } from '../utils/ai.js'
import { GAMES } from '../data/games.js'

const SUGGESTIONS = ['أحسن RPG؟', 'ألعاب أقل من ١٥٠٠ EGP', 'حاجة رعب', 'Best racing game?']

// pitch/rate presets so the voice can sound younger or deeper
const VOICE_PRESETS = {
  young: { label: 'شاب', pitch: 1.2, rate: 1.05 },
  normal: { label: 'عادي', pitch: 1.0, rate: 1.0 },
  deep: { label: 'رخيم', pitch: 0.85, rate: 0.95 },
}
// narrator voices served by the TTS proxy: Masry (male) and Chloe (female).
// Chloe's underlying Edge voice is ar-EG-SalmaNeural; the UI shows كلوي only.
const NARRATORS = {
  masry: { label: 'مصري', voice: 'ar-EG-ShakirNeural' },
  chloe: { label: 'كلوي', voice: 'ar-EG-SalmaNeural' },
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [muted, setMuted] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [voices, setVoices] = useState([])
  const [voiceURI, setVoiceURI] = useState('')
  const [preset, setPresetState] = useState(() => localStorage.getItem('masry-preset') || 'young')
  const [narrator, setNarratorState] = useState(() => localStorage.getItem('masry-narrator') || 'masry')
  // persist voice choices across visits
  const setPreset = (k) => { setPresetState(k); localStorage.setItem('masry-preset', k) }
  const setNarrator = (k) => { setNarratorState(k); localStorage.setItem('masry-narrator', k) }
  const [showSettings, setShowSettings] = useState(false)
  const greetingFor = (k) => {
    const me = PERSONAS[k] || PERSONAS.masry
    return `أهلاً بيك 👋 أنا ${me.nameAr}، ${me.advisorAr}. اسألني بالعربي أو بالإنجليزي، وأنا أرد عليك وأسمعك صوتي كمان.`
  }
  const [messages, setMessages] = useState(() => [{ role: 'bot', text: greetingFor(localStorage.getItem('masry-narrator') || 'masry') }])
  // narrator switch rewrites the greeting if nothing else was said yet
  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].role === 'bot' ? [{ role: 'bot', text: greetingFor(narrator) }] : m))
  }, [narrator]) // eslint-disable-line react-hooks/exhaustive-deps
  const [input, setInput] = useState('')
  const [proxyOk, setProxyOk] = useState(null)
  const memRef = useRef({}) // remembered preferences (genre, budget)
  const audioRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, open])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => {
      const ar = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('ar'))
      setVoices(ar)
      if (ar.length && !voiceURI) {
        const eg = ar.find((v) => v.lang === 'ar-EG')
        setVoiceURI((eg || ar[0]).voiceURI)
      }
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/tts-health').then((r) => setProxyOk(r.ok)).catch(() => setProxyOk(false))
  }, [])

  async function speakProxy(text) {
    const p = VOICE_PRESETS[preset]
    const n = NARRATORS[narrator] || NARRATORS.masry
    const clean = stripForSpeech(text)
    const res = await fetch(`/api/tts?text=${encodeURIComponent(clean.slice(0, 580))}&pitch=${p.pitch}&rate=${p.rate}&voice=${n.voice}`)
    if (!res.ok) throw new Error('proxy tts failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src) }
    const a = new Audio(url)
    audioRef.current = a
    a.play()
  }

  function speakBrowser(text) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(stripForSpeech(text))
    const v = voices.find((x) => x.voiceURI === voiceURI)
    if (v) u.voice = v
    u.lang = isArabic(text) ? v?.lang || 'ar-EG' : 'en-US'
    const p = VOICE_PRESETS[preset]
    u.pitch = p.pitch
    u.rate = p.rate
    window.speechSynthesis.speak(u)
  }

  function speak(text) {
    if (muted) return
    if (proxyOk !== false) {
      speakProxy(text).catch(() => {
        setProxyOk(false)
        speakBrowser(text)
      })
      return
    }
    speakBrowser(text)
  }

  async function send(text) {
    const question = (text ?? input).trim()
    if (!question || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: question }])
    setBusy(true)
    const res = await askAdvisor(question, GAMES, messages, memRef.current, narrator)
    if (res.mem) memRef.current = res.mem
    setMessages((m) => [...m, { role: 'bot', text: res.text }])
    setBusy(false)
    if (autoSpeak) speak(res.text)
  }

  return (
    <>
      <button
        className={`chat-fab ${open ? 'hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open AI game advisor"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#131020" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="8" width="16" height="12" rx="3.5" fill="#131020" stroke="none"/>
          <circle cx="9.2" cy="13.4" r="1.4" fill="#f5c76a" stroke="none"/>
          <circle cx="14.8" cy="13.4" r="1.4" fill="#f5c76a" stroke="none"/>
          <path d="M12 8V4.5" stroke="#131020"/>
          <circle cx="12" cy="3.6" r="1.1" fill="#131020" stroke="none"/>
          <path d="M8.5 17.2h7" stroke="#f5c76a" strokeWidth="1.5"/>
        </svg>
      </button>
      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <div>
              <strong>{narrator === 'chloe' ? 'Chloe · كلوي' : 'Masry AI · مصري'}</strong>
              <span className={`chat-mode ${aiConfigured() ? 'online' : ''}`}>
                {aiConfigured() ? 'Gemini online' : 'Offline mode · وضع أوفلاين'}
                {proxyOk ? ' · صوت شكير' : proxyOk === false ? ' · صوت المتصفح' : ''}
              </span>
            </div>
            <div className="chat-head-btns">
              <button
                className="chat-icon-btn"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute voice' : 'Mute voice'}
                title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
              <button className="chat-icon-btn" onClick={() => setShowSettings((s) => !s)} aria-label="Voice settings" title="إعدادات الصوت">
                ⚙
              </button>
              <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
                ×
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="chat-settings">
              <label className="chat-settings-row">
                <span>الرد الصوتي التلقائي</span>
                <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} />
              </label>
              {voices.length > 0 ? (
                <label className="chat-settings-row">
                  <span>الصوت</span>
                  <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="chat-settings-note">مفيش صوت عربي متسطب على الجهاز ده - هيستخدم صوت النظام.</p>
              )}
              <div className="chat-settings-row">
                <span>المعلق</span>
                <div className="chat-presets">
                  {Object.entries(NARRATORS).map(([k, n]) => (
                    <button key={k} className={`chip chip-btn ${narrator === k ? 'active' : ''}`} onClick={() => setNarrator(k)}>
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chat-settings-row">
                <span>طبقة الصوت</span>
                <div className="chat-presets">
                  {Object.entries(VOICE_PRESETS).map(([k, p]) => (
                    <button key={k} className={`chip chip-btn ${preset === k ? 'active' : ''}`} onClick={() => setPreset(k)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!aiConfigured() && (
            <div className="chat-banner">
              No API key set - answers come from the built-in Egyptian engine. Add
              VITE_GEMINI_API_KEY in .env for full AI answers.
            </div>
          )}

          <div className="chat-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`} dir="auto">
                {m.text}
                {m.role === 'bot' && (
                  <button className="chat-speak" onClick={() => speak(m.text)} aria-label="Play voice reply" title="اسمع الرد">
                    ▶
                  </button>
                )}
              </div>
            ))}
            {busy && (
              <div className="chat-msg bot typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسأل عن أي لعبة..."
              aria-label="Ask the game advisor"
              dir="auto"
            />
            <button type="submit" className="btn btn-sm" disabled={busy}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
