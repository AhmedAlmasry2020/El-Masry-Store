// El-Masry Store - Masry, the AI game advisor
// Author: Ahmed El-Masry
//
// Answers in Egyptian Arabic when the user writes Arabic, English otherwise.
// Uses Google Gemini when VITE_GEMINI_API_KEY is set in a local .env file;
// otherwise (or on any failure) a built-in rule-based engine with an Egyptian
// persona answers from the live catalog. The fallback always answers.

import { egp, fmtPriceEGP } from '../data/currency.js'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash'

// Advisor persona: Masry (male voice) or Chloe (female voice). Only the
// self-references change; the tone stays the same funny Egyptian friend.
export const PERSONAS = {
  masry: { nameAr: 'مصري', nameEn: 'Masry', advisorAr: 'مستشار الألعاب بتاعك', availableAr: 'أنا موجود' },
  chloe: { nameAr: 'كلوي', nameEn: 'Chloe', advisorAr: 'مستشارة الألعاب بتاعتك', availableAr: 'أنا موجودة' },
}

// emoji/symbol strip for text-to-speech: screen text keeps them, but TTS
// reads some aloud ("اشارة بتلوح بالايد" for a waving hand). Speech only.
export function stripForSpeech(text) {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function aiConfigured() {
  return Boolean(API_KEY && API_KEY.trim())
}

export function isArabic(text) {
  return /[؀-ۿ]/.test(text || '')
}

// mem: remembered preferences across the session ({genre, budget})
export async function askAdvisor(question, games, history, mem = {}, persona = 'masry') {
  if (aiConfigured()) {
    try {
      return { text: await askGemini(question, games, history, persona), mode: 'gemini', mem }
    } catch {
      // fall through to the offline engine
    }
  }
  return { ...answerOffline(question, games, mem, persona), mode: 'offline' }
}

async function askGemini(question, games, history, persona = 'masry') {
  const catalog = games
    .slice(0, 60)
    .map((g) => `${g.title} (${g.genre}, ${g.isFree ? 'free' : fmtPriceEGP(g.price)}, rating ${g.rating ?? '?'}/5)`)
    .join('\n')
  const convo = (history || [])
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Advisor'}: ${m.text}`)
    .join('\n')
  const prompt = [
    `You are ${PERSONAS[persona]?.nameEn || 'Masry'}, the in-store AI advisor of "El-Masry Store", a game reservation website.`,
    'Personality: a warm, funny Egyptian friend. Light jokes, zero rudeness.',
    'If the user writes Arabic, reply in Egyptian dialect Arabic. If English, reply in English.',
    'Recommend games ONLY from this catalog, keep it under 90 words.',
    'If asked about anything unrelated to games, steer back to games politely.',
    '',
    'CATALOG (top 60 by popularity):',
    catalog,
    '',
    convo ? `CHAT SO FAR:\n${convo}\n` : '',
    `Customer: ${question}`,
    'Advisor:',
  ].join('\n')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  )
  if (!res.ok) throw new Error('gemini request failed')
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('empty gemini response')
  return text.trim()
}

// ---------- offline Egyptian rule-based engine ----------
const GENRE_WORDS = {
  Action: ['action', 'اكشن', 'أكشن'],
  RPG: ['rpg', 'role', 'ار بي جي'],
  Racing: ['race', 'racing', 'car', 'cars', 'سباق', 'عربيات', 'عربيات'],
  Sports: ['sport', 'football', 'soccer', 'fc', 'كورة', 'كرة', 'رياضة', 'فيفا'],
  Horror: ['horror', 'scary', 'رعب', 'مخيف'],
  Strategy: ['strategy', 'tactics', 'استراتيجية', 'استراتيجي'],
  Shooter: ['shooter', 'fps', 'shoot', 'gun', 'تصويب', 'حرب', 'ضرب نار'],
  Adventure: ['adventure', 'مغامرة', 'مغامرات'],
  Sandbox: ['sandbox', 'build', 'craft', 'minecraft', 'ماينكرافت', 'بناء'],
  Fighting: ['fighting', 'fight', 'tekken', 'قتال', 'مصارعة'],
  Simulation: ['simulation', 'محاكاة', 'محاكي'],
  Indie: ['indie', 'مستقلة'],
  Software: ['software', 'برنامج', 'برامج', 'اداة', 'أداة', 'تطبيق', 'تطبيقات'],
}

const fmt = (g) => `${g.title} (${g.isFree ? 'بلاش - free' : g.price == null ? 'شوف السعر على المتجر الرسمي' : fmtPriceEGP(g.price)}, تقييم ${g.rating ?? '؟'}/5)`
const fmtEn = (g) => `${g.title} (${g.isFree ? 'free' : g.price == null ? 'see the official store' : fmtPriceEGP(g.price)}, ${g.rating ?? '?'}/5)`

function topByRating(pool, n = 3) {
  return [...pool].filter((g) => g.rating != null).sort((a, b) => b.rating - a.rating).slice(0, n)
}

function titleAliases(title) {
  const t = title.toLowerCase().replace(/[™®©]/g, '').trim()
  const short = t.split(/\s*[:\-–—]\s*/)[0].trim()
  const noPart = short.replace(/\s+\d+$/, '').trim()
  return [...new Set([t, short, noPart])].filter((a) => a.length >= 4)
}

function findTitles(q, games) {
  return games.filter((g) => titleAliases(g.title).some((a) => q.includes(a)))
}

function answerOffline(question, games, mem, persona = 'masry') {
  const me = PERSONAS[persona] || PERSONAS.masry
  const askedSoftware = /(software|wallpaper engine|برنامج|تطبيق|أداة)/.test(question.toLowerCase())
  if (!askedSoftware) games = games.filter((g) => g.genre !== 'Software')
  const q = question
    .toLowerCase()
    // Arabic-Indic digits -> Latin so budgets like "١٥٠٠ EGP" parse (budgets are EGP)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  const ar = isArabic(question)
  const priceMatch = q.match(/(?:under|below|less than|<|max|أقل من|اقل من|بأقل من|باقل من|تحت|بـ)\s*\$?\s*(\d+)/)
  const genreHit = Object.entries(GENRE_WORDS).find(([, words]) => words.some((w) => q.includes(w)))
  // remember preferences for follow-ups
  if (genreHit) mem.genre = genreHit[0]
  if (priceMatch) mem.budget = Number(priceMatch[1])
  // follow-up: "and cheaper?" / "طيب أرخص؟" reuses the remembered genre
  if (!genreHit && /(أرخص|ارخص|أغلى|cheaper|pricier|another|غيرها|تانية|غيره)/.test(q) && mem.genre) {
    let pool = games.filter((g) => g.genre === mem.genre && !g.isFree && g.price != null)
    if (q.includes('cheaper') || q.includes('أرخص') || q.includes('ارخص')) pool = pool.sort((a, b) => a.price - b.price)
    else pool = pool.sort((a, b) => b.price - a.price)
    const pick = pool[0]
    if (pick)
      return {
        text: ar
          ? `على ذوقك طبعاً 😌 في الـ${mem.genre} عندي لك ${fmt(pick)}. خدها مني، دي حتة لعبة.`
          : `In ${mem.genre}, take a look at ${fmtEn(pick)}. You will not regret it.`,
        mem,
      }
  }

  const mentioned = findTitles(q, games)

  // compare: "X vs Y" / "X ولا Y"
  if (mentioned.length >= 2 && /( vs | ولا | و لا | or )/.test(q)) {
    const [a, b] = mentioned
    const winner = (a.rating ?? 0) >= (b.rating ?? 0) ? a : b
    return { mem, text: ar
      ? `بص يا صاحبي, ${a.title} تقييمها ${a.rating ?? '؟'}/5 وسعرها ${a.price == null ? 'شوف المتجر الرسمي' : fmtPriceEGP(a.price)}، و${b.title} تقييمها ${b.rating ?? '؟'}/5 وسعرها ${b.price == null ? 'شوف المتجر الرسمي' : fmtPriceEGP(b.price)}. أنا مع ${winner.title}، دي اللي تستاهل فلوسك فعلاً 😄`
      : `${a.title}: ${a.rating ?? '?'}/5 at ${a.price == null ? 'see official store' : fmtPriceEGP(a.price)}. ${b.title}: ${b.rating ?? '?'}/5 at ${b.price == null ? 'see official store' : fmtPriceEGP(b.price)}. My money goes on ${winner.title}.` }
  }

  // one specific game mentioned
  if (mentioned.length === 1) {
    const g = mentioned[0]
    return { mem, text: ar
      ? `${g.title}؟ اختيار جامد 👌 ${g.genre} من سنة ${g.year ?? '؟'}، تقييمها ${g.rating ?? '؟'}/5 وسعرها ${g.isFree ? 'بلاش' : g.price == null ? 'شوف المتجر الرسمي' : fmtPriceEGP(g.price)}. افتحها من المتجر تشوف التريلر وتحجزها.`
      : `${g.title} - solid pick. ${g.genre}, ${g.year ?? '?'}, rated ${g.rating ?? '?'}/5 at ${g.isFree ? 'free' : g.price == null ? 'see official store' : fmtPriceEGP(g.price)}. Open it in the store for the trailer and reservation.` }
  }

  if (q.includes('cheapest') || q.includes('ارخص') || q.includes('أرخص')) {
    const paid = games.filter((g) => !g.isFree && g.price != null)
    const g = [...paid].sort((a, b) => a.price - b.price)[0]
    return { mem, text: ar
      ? `أرخص لعبة عندنا هي ${fmt(g)}. سعر زي الفول 🫘 عايز أحجزهالك؟`
      : `The cheapest pick is ${fmtEn(g)}. Great value. Want it reserved?` }
  }

  if (q.includes('free') || q.includes('بلاش') || q.includes('مجانا') || q.includes('مجانية')) {
    const free = games.filter((g) => g.isFree).slice(0, 4)
    return { mem, text: ar
      ? `عندنا ألعاب بلاش يا باشا: ${free.map((g) => g.title).join('، ')}. حمل أي واحدة منهم من Steam على طول 😎`
      : `Free to play picks: ${free.map((g) => g.title).join(', ')}. Install straight from Steam.` }
  }

  if (q.includes('best') || q.includes('top') || q.includes('احسن') || q.includes('أحسن') || q.includes('افضل') || q.includes('أفضل')) {
    const pool = genreHit ? games.filter((g) => g.genre === genreHit[0]) : games
    const top = topByRating(pool)
    return { mem, text: ar
      ? `أعلى تقييمات عندنا دلوقتي: ${top.map((g) => `${g.title} (${g.rating}/5)`).join('، ')}. قولي نوع معين وأظبطلك اختيار على مزاجك 😉`
      : `Top rated right now: ${top.map((g) => `${g.title} (${g.rating}/5)`).join(', ')}. Name a genre and I will narrow it down.` }
  }

  if (genreHit || priceMatch) {
    let pool = games
    const genre = genreHit ? genreHit[0] : mem.genre
    if (genre) {
      const narrowed = pool.filter((g) => g.genre === genre)
      // if the remembered genre has nothing in budget, widen to all genres
      if (!priceMatch || narrowed.some((g) => egp(g.price) <= Number(priceMatch[1]))) pool = narrowed
    }
    if (priceMatch) pool = pool.filter((g) => g.isFree || egp(g.price) <= Number(priceMatch[1]))
    if (pool.length === 0)
      return {
        mem,
        text: ar
          ? 'مفيش حاجة بالمواصفات دي عندنا لسه.. جرب نوع تاني أو زود الميزانية شوية 😅'
          : 'Nothing matches that yet - try another genre or a higher budget.',
      }
    const best = topByRating(pool)
    return { mem, text: ar
      ? `واللهي عندك ذوق 👏 شوف الترشيحات دي: ${best.map(fmt).join('، ')}. افتح أي واحدة منهم تشوف التريلر وتحجز.`
      : `Good taste. Try: ${best.map(fmtEn).join(', ')}. Open any of them for the trailer and reservation.` }
  }

  if (/(hi|hello|hey|salam|ازيك|اهلا|أهلا|صباح|مساء)/.test(q)) {
    return { mem, text: ar
      ? `أهلاً بيك في المصرى ستور 👋 أنا ${me.nameAr}، ${me.advisorAr}. قولي عايز لعبة إيه: أكشن؟ رعب؟ كورة؟ ولا عندك ميزانية معينة؟`
      : `Hey! I am ${me.nameEn}, your game advisor. Ask me things like "recommend a horror game", "best RPG", or "games under 1500 EGP".` }
  }

  if (q.includes('thank') || q.includes('شكرا') || q.includes('تسلم')) {
    return { mem, text: ar ? `العفو يا معلم ❤ أي وقت عايز لعبة ${me.availableAr}` : 'Anytime! I am here whenever you need a game.' }
  }

  if (q.includes('نكتة') || q.includes('ضحكني') || q.includes('joke')) {
    return {
      mem,
      text: ar
        ? 'قالوا على اللاعب المصري بياخد اللعبة على أعلى صعوبة؟ لأنه متعود يعيش على الوضع الصعب أصلاً 😂 طيب جد، عايز لعبة إيه؟'
        : 'Why do Egyptian gamers play on the hardest difficulty? They are used to life on hard mode 😂 So - what game are we getting you?',
    }
  }

  // follow-up: if we know a remembered genre, offer it before asking again
  if (mem.genre && !genreHit)
    return {
      mem,
      text: ar
        ? `لسه فاكر إنك بتحب الـ${mem.genre} 😏 عايز ترشيحات منها ولا نغير النوع؟ ولو عندك ميزانية قولي.`
        : `I remember you like ${mem.genre}. Want picks from there, or switch genres? Give me a budget if you have one.`,
    }

  return {
    mem,
    text: ar
      ? 'مش فاهم قصدك بالظبط 😅 قولي نوع (أكشن، رعب، سباق، كورة...) أو ميزانية ("أقل من ١٥٠٠ EGP") وهجيبلك أحلى ترشيحات.'
      : 'Tell me a genre (action, RPG, racing, horror...) or a budget ("under 1500 EGP") and I will recommend games from the store catalog.',
  }
}
