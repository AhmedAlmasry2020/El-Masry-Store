// El-Masry Store - app shell
// Author: Ahmed El-Masry
import { useMemo, useState } from 'react'
import Background from './components/Background.jsx'
import IntroGate from './components/IntroGate.jsx'
import Navbar from './components/Navbar.jsx'
import GameModal from './components/GameModal.jsx'
import ChatBot from './components/ChatBot.jsx'
import Home from './pages/Home.jsx'
import Store from './pages/Store.jsx'
import Bookings from './pages/Bookings.jsx'
import Library from './pages/Library.jsx'
import Series from './pages/Series.jsx'
import Nostalgia from './pages/Nostalgia.jsx'
import Auth from './pages/Auth.jsx'
import {
  currentUser,
  logoutUser,
  listBookings,
  addBooking,
  cancelBooking,
} from './utils/auth.js'
import { listLibrary, addToLibrary, removeFromLibrary } from './utils/library.js'
import { startAmbient } from './utils/ambient.js'

function toast(message) {
  window.dispatchEvent(new CustomEvent('ems-toast', { detail: message }))
}

export default function App() {
  const [entered, setEntered] = useState(false)
  const [view, setView] = useState('home')
  const [user, setUser] = useState(() => currentUser())
  const [selected, setSelected] = useState(null)
  const [pendingReserve, setPendingReserve] = useState(null)
  const [tick, setTick] = useState(0)
  const [toastMsg, setToastMsg] = useState(null)

  useState(() => {
    let timer
    const onToast = (e) => {
      setToastMsg(e.detail)
      clearTimeout(timer)
      timer = setTimeout(() => setToastMsg(null), 2600)
    }
    window.addEventListener('ems-toast', onToast)
    return () => window.removeEventListener('ems-toast', onToast)
  })

  const bookings = useMemo(() => (user ? listBookings(user.id) : []), [user, tick])
  const reservedIds = useMemo(() => new Set(bookings.map((b) => b.gameId)), [bookings])
  const ownedIds = useMemo(() => new Set(listLibrary().map((g) => g.gameId)), [tick])

  function own(game) {
    // demo "download": marks the game as owned in the local library
    const res = addToLibrary(game.id)
    if (!res.ok) return toast(res.error)
    setTick((t) => t + 1)
    toast(`${game.title} added to your Library`)
  }

  function unown(gameId) {
    removeFromLibrary(gameId)
    setTick((t) => t + 1)
    toast('Removed from Library')
  }

  function enter() {
    setEntered(true)
    startAmbient()
  }

  function reserve(game) {
    if (!user) {
      toast('Sign in first to reserve a game')
      // remember the game so sign-in returns him to it
      setPendingReserve(game)
      setSelected(null)
      setView('auth')
      return
    }
    const res = addBooking(user.id, game.id)
    if (!res.ok) return toast(res.error)
    setTick((t) => t + 1)
    toast(`${game.title} reserved. See you at pickup.`)
  }

  function cancel(bookingId) {
    cancelBooking(user.id, bookingId)
    setTick((t) => t + 1)
    toast('Reservation cancelled')
  }

  function logout() {
    logoutUser()
    setUser(null)
    setView('home')
    toast('Signed out')
  }

  if (!entered) return <IntroGate onEnter={enter} />

  return (
    <>
      <Background />
      <Navbar
        view={view}
        onNavigate={setView}
        user={user}
        onLogout={logout}
        bookingCount={bookings.length}
        libraryCount={ownedIds.size}
      />

      <main className="page" key={view}>
        {view === 'home' && <Home onBookGames={() => setView('store')} />}
        {view === 'store' && <Store onOpen={setSelected} reservedIds={reservedIds} ownedIds={ownedIds} />}
        {view === 'series' && <Series onOpen={setSelected} />}
        {view === 'nostalgia' && <Nostalgia onDemoDownload={own} />}
        {view === 'library' && (
          <Library ownedIds={ownedIds} onRemove={unown} onBrowse={() => setView('store')} />
        )}
        {view === 'bookings' && (
          <Bookings
            user={user}
            bookings={bookings}
            onCancel={cancel}
            onBrowse={() => setView('store')}
            onLogin={() => setView('auth')}
          />
        )}
        {view === 'auth' && (
          <Auth
            onAuth={(u) => {
              setUser(u)
              toast(`Welcome, ${u.name.split(' ')[0]}`)
              setView('store')
              // back to the game he tried to reserve before the sign-in gate
              if (pendingReserve) {
                setSelected(pendingReserve)
                setPendingReserve(null)
              }
            }}
          />
        )}
      </main>

      {view !== 'home' && (
        <footer className="footer">
          <span>El-Masry Store · crafted by Ahmed El-Masry</span>
          <span>Demo reservations only - no payments.</span>
        </footer>
      )}

      {selected && (
        <GameModal
          game={selected}
          user={user}
          reserved={user ? reservedIds.has(selected.id) : false}
          owned={ownedIds.has(selected.id)}
          onReserve={reserve}
          onOwn={own}
          onClose={() => setSelected(null)}
        />
      )}

      <ChatBot />
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  )
}
