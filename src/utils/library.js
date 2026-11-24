// El-Masry Store - demo game library (localStorage, no backend)
// Games the user marked as owned/installed. Demo only - nothing is verified.
// Author: Ahmed El-Masry
const KEY = 'ems-library-v1'

export function listLibrary() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function isOwned(gameId) {
  return listLibrary().some((g) => g.gameId === gameId)
}

export function addToLibrary(gameId) {
  const items = listLibrary()
  if (items.some((g) => g.gameId === gameId)) return { ok: false, error: 'Already in your library' }
  items.push({ gameId, at: Date.now() })
  localStorage.setItem(KEY, JSON.stringify(items))
  return { ok: true }
}

export function removeFromLibrary(gameId) {
  localStorage.setItem(KEY, JSON.stringify(listLibrary().filter((g) => g.gameId !== gameId)))
}
