// El-Masry Store - tiny TTS proxy for the Masry AI chatbot
// GET /api/tts?text=...&pitch=1.1&rate=1.05 -> audio/mpeg
//
// Default engine: msedge-tts (unofficial wrapper around Microsoft Edge's
// online neural voices, ar-EG-ShakirNeural by default). It needs no API key
// but is unofficial and may break - the chatbot falls back to the browser's
// own speechSynthesis when this server is down.
// Optional: set AZURE_TTS_KEY + AZURE_TTS_REGION to use Azure Cognitive
// Speech instead (keys stay server-side in .env, never in the bundle).
// Author: Ahmed El-Masry
import http from 'node:http'

const PORT = Number(process.env.TTS_PORT || 8787)
const DEFAULT_VOICE = process.env.TTS_VOICE || 'ar-EG-ShakirNeural'
// voices the chat UI may pick: Masry (male) and Chloe (female)
const ALLOWED_VOICES = new Set(['ar-EG-ShakirNeural', 'ar-EG-SalmaNeural'])
const AZURE_KEY = process.env.AZURE_TTS_KEY
const AZURE_REGION = process.env.AZURE_TTS_REGION

let edge = null
async function edgeTTS() {
  if (!edge) {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts')
    edge = { MsEdgeTTS, OUTPUT_FORMAT }
  }
  return edge
}

function clamp(n, lo, hi, dflt) {
  const v = Number(n)
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt
}

async function synthEdge(text, pitch, rate, voice) {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await edgeTTS()
  const tts = new MsEdgeTTS()
  await tts.setMetadata(voice || DEFAULT_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
  const prosody = {
    pitch: `${Math.round((pitch - 1) * 100) >= 0 ? '+' : ''}${Math.round((pitch - 1) * 100)}%`,
    rate: `${Math.round((rate - 1) * 100) >= 0 ? '+' : ''}${Math.round((rate - 1) * 100)}%`,
  }
  const { audioStream } = tts.toStream(text, prosody)
  const chunks = []
  for await (const c of audioStream) chunks.push(c)
  return Buffer.concat(chunks)
}

async function synthAzure(text, pitch, rate) {
  const ssml = `<speak version="1.0" xml:lang="ar-EG"><voice name="${DEFAULT_VOICE}"><prosody pitch="${Math.round((pitch - 1) * 100)}%" rate="${rate}">${text.replace(/[<>&]/g, ' ')}</prosody></voice></speak>`
  const res = await fetch(`https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
    },
    body: ssml,
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`azure tts ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x')
    if (url.pathname === '/api/tts-health') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ ok: true, engine: AZURE_KEY ? 'azure' : 'msedge-tts', voice: DEFAULT_VOICE }))
    }
    if (url.pathname !== '/api/tts') {
      res.writeHead(404)
      return res.end()
    }
    const text = (url.searchParams.get('text') || '').slice(0, 600).trim()
    if (!text) {
      res.writeHead(400)
      return res.end('missing text')
    }
    const pitch = clamp(url.searchParams.get('pitch'), 0.5, 2, 1)
    const rate = clamp(url.searchParams.get('rate'), 0.5, 2, 1)
    const voiceParam = url.searchParams.get('voice')
    const voice = ALLOWED_VOICES.has(voiceParam) ? voiceParam : null
    const audio = AZURE_KEY ? await synthAzure(text, pitch, rate) : await synthEdge(text, pitch, rate, voice)
    res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' })
    res.end(audio)
  } catch (e) {
    console.error('tts error:', e.message)
    res.writeHead(502)
    res.end('tts failed')
  }
})

server.listen(PORT, () => console.log(`[tts] listening on :${PORT} (${AZURE_KEY ? 'azure' : 'msedge-tts'}, voice ${DEFAULT_VOICE})`))
