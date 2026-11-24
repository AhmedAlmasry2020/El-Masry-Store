# El-Masry Store

A premium game-reservation web experience. Browse the vault, watch official
trailers, reserve your next obsession, and ask **Masry AI** what to play next.

**Author: Ahmed El-Masry**

---

## What's inside

- **Intro splash** - "click to enter" gate (browser autoplay rules need a user
  gesture). On entry, a monstrous generated voice growls *"El-Masry Store"*
  (`public/media/intro-voice.mp3`, TTS + pitch-down/distortion/reverb), then
  the store fades in and the ambient pad starts.
- **Full-page video wallpaper** - drop any looping gaming montage you have
  rights to at `public/media/bg-video.mp4`. Until then, a built-in animated
  aurora-gradient scene keeps the background alive.
- **Ambient sound** - a synthesized dark pad (Web Audio API, no audio file
  needed) with an animated mute/unmute toggle in the navbar.
- **Catalog** - 1,004 titles (Steam snapshot, see the data notes below) with
  search, genre filters, trilogies/series and a Nostalgia aisle.
- **Every game** has a cover and wallpaper header, and its official trailer -
  streamed from Steam's own servers (HLS) or embedded from the publisher's
  YouTube channel (click-to-load).
- **Sign-in cinematic** - an original hand-drawn wizard duel (young mage vs
  shadow lord) plays before the form (once per browser session;
  `prefers-reduced-motion` skips it), and "Scarab", an original masked hero,
  walks in and leans/sits on the card. All characters are original art.
- **Reservations** - register / log in (demo accounts live in your browser's
  localStorage only), reserve games, see them under *My Reservations*, cancel
  anytime. **No payments - demo only.**
- **Masry AI chatbot** - floating advisor. With a Gemini API key it answers
  freely; without one, a built-in offline engine recommends games from the
  catalog (genre, budget, "cheapest", "best rated"...).
- **Fully responsive** - phone, tablet and desktop layouts, plus
  `prefers-reduced-motion` support.

## Run it

Requires Node 18+.

```bash
npm install
npm run dev        # local dev server (http://localhost:5173)
npm run build      # production build -> dist/
npm run preview    # serve the production build
```

## AI key setup (optional)

1. Get a free key at https://aistudio.google.com/app/apikey
2. Copy `.env.example` to `.env` and paste it:

```
VITE_GEMINI_API_KEY=your_key_here
VITE_GEMINI_MODEL=gemini-1.5-flash
```

3. Restart `npm run dev`.

`.env` is gitignored and never committed. Without a key the chatbot shows an
"Offline mode" banner and answers from the local rule-based engine.

## Media placeholders

See `public/media/README.md`. Covers and wallpapers are CSS gradients per game
(`src/data/games.js`); swap in licensed key art when you have it.

## Project structure

```
public/
  logo.svg                 # hand-designed brand mark
  media/intro-voice.mp3    # generated monster voice
  media/README.md          # where to drop bg-video.mp4 / ambient.mp3
src/
  main.jsx                 # entry
  App.jsx                  # shell: intro gate, routing, reservations, toasts
  index.css                # theme, layout, all animations, responsive rules
  data/catalog.json        # the catalog (1,004 games, Steam snapshot)
  data/games.js            # catalog helpers
  data/nostalgia.json      # the Nostalgia aisle
  utils/auth.js            # localStorage auth + bookings (demo)
  utils/ambient.js         # Web Audio ambient pad
  utils/ai.js              # Gemini client + offline fallback engine
  components/
    IntroGate.jsx  Background.jsx  SoundToggle.jsx  Navbar.jsx  Logo.jsx
    GameCard.jsx   GameModal.jsx   ChatBot.jsx      WizardDuel.jsx
    ScarabGreeter.jsx  TrailerVideo.jsx  WallpaperGallery.jsx
  pages/
    Home.jsx  Store.jsx  Bookings.jsx  Auth.jsx  Library.jsx  Series.jsx  Nostalgia.jsx
```

## Verification status

- `npm run build` passes (production bundle generated).
- Trailer YouTube IDs were each verified against YouTube's oEmbed API as the
  official publisher upload (Rockstar, Bandai Namco, The Witcher, Cyberpunk
  2077, Minecraft, Xbox, PlayStation, Bethesda, EA SPORTS FC, Capcom).
- The intro voice file was generated programmatically and verified to decode
  with audio present; its final *sound* was not reviewed by ear - regenerate
  or replace it if the growl isn't monstrous enough.

## Honest notes

- Auth is a frontend demo: credentials are obfuscated, not encrypted, and
  live only in your browser. Do not reuse a real password.
- Reservations are demo bookings; nothing is charged and nothing leaves the
  browser.

## Next steps

- Drop a real looping montage into `public/media/bg-video.mp4`.
- Add a Gemini key for full AI answers.
- Replace gradient placeholder art with licensed key art per game.

## v3 data & features (2026-11-24)

- Catalog: 507 games from the Steam storefront API (USD, snapshot 2026-11-24)
  + recent releases and upcoming titles via Steam store search. Prices are a
  moment-in-time snapshot (many were on sale); ratings are Metacritic/20 when
  Steam lists one, otherwise Steam review % via SteamSpy. Rebuild/extend with
  `node scripts/fetch-catalog.mjs`, `node scripts/fetch-recent.mjs`,
  `node scripts/enrich-catalog.mjs`, `node scripts/add-apps.mjs <appids>` (all
  resume-safe via scripts/.cache - not shipped in the zip).
- Images/video are hotlinked from Valve's CDN with CSS-gradient fallbacks -
  fine for this demo/portfolio, not for a commercial site.
- New sections: New releases / Coming soon (sorted by release date, verified
  from Steam), Games Trilogy (franchise collections), Nostalgia (743 classics
  1965-2012 from Wikidata; 132 have Wikimedia Commons cover art, the rest get
  generated placeholders; reference links only - no ROMs or downloads).
- Wallpapers: each game modal lists every official artwork/screenshot with
  PC/phone/tablet preview crops and open-full-size links (Steam CDN).
- "Download now" is a DEMO animation only (adds to Library). No game files,
  keys or cracks are served anywhere. "Get it on Steam" is the real path.
- Chatbot voice: `npm run dev` now also starts server/tts-proxy.mjs
  (/api/tts) which uses the unofficial msedge-tts package with the natural
  Egyptian voice ar-EG-ShakirNeural - no API key needed, but it is unofficial
  and may break; set AZURE_TTS_KEY/AZURE_TTS_REGION for Azure, and the
  chatbot falls back to the browser's speechSynthesis if the proxy is down.
  Voice quality then depends on the device's installed Arabic voices.

## v4 sign-in & data (2026-11-24)

- Catalog grown to 1,004 games (979 Steam HLS trailers + 25 official YouTube
  embeds for titles not on Steam). Newest editions only (GOTY/Remastered
  deduped). Prices in EGP (snapshot).
- Sign-in flow: wizard duel (once per session) -> form + greeter; reserving a
  game while signed out remembers the game and returns to it after sign-in.
