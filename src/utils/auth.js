// El-Masry Store - demo auth + bookings, browser localStorage only (no backend)
// Author: Ahmed El-Masry

const USERS_KEY = 'ems_users'
const SESSION_KEY = 'ems_session'
const BOOKINGS_KEY = 'ems_bookings'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// Demo-only obfuscation. NOT real security - this project has no backend.
function scramble(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

export function registerUser({ name, email, password }) {
  const users = read(USERS_KEY, [])
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase())
  if (exists) return { ok: false, error: 'This email is already registered.' }
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim(),
    pass: scramble(password),
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  write(USERS_KEY, users)
  write(SESSION_KEY, user.id)
  return { ok: true, user: publicUser(user) }
}

export function loginUser({ email, password }) {
  const users = read(USERS_KEY, [])
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user || user.pass !== scramble(password)) {
    return { ok: false, error: 'Wrong email or password.' }
  }
  write(SESSION_KEY, user.id)
  return { ok: true, user: publicUser(user) }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
}

export function currentUser() {
  const id = read(SESSION_KEY, null)
  if (!id) return null
  const user = read(USERS_KEY, []).find((u) => u.id === id)
  return user ? publicUser(user) : null
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

export function listBookings(userId) {
  return read(BOOKINGS_KEY, []).filter((b) => b.userId === userId)
}

export function addBooking(userId, gameId) {
  const bookings = read(BOOKINGS_KEY, [])
  if (bookings.some((b) => b.userId === userId && b.gameId === gameId)) {
    return { ok: false, error: 'Already reserved.' }
  }
  const booking = { id: crypto.randomUUID(), userId, gameId, at: new Date().toISOString() }
  bookings.push(booking)
  write(BOOKINGS_KEY, bookings)
  return { ok: true, booking }
}

export function cancelBooking(userId, bookingId) {
  const bookings = read(BOOKINGS_KEY, [])
  write(BOOKINGS_KEY, bookings.filter((b) => !(b.userId === userId && b.id === bookingId)))
}

export function hasBooking(userId, gameId) {
  return read(BOOKINGS_KEY, []).some((b) => b.userId === userId && b.gameId === gameId)
}
