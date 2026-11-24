// El-Masry Store - responsive navigation
// Author: Ahmed El-Masry
import { useState } from 'react'
import Logo from './Logo.jsx'
import SoundToggle from './SoundToggle.jsx'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'store', label: 'Store' },
  { id: 'series', label: 'Trilogies' },
  { id: 'nostalgia', label: 'Nostalgia' },
  { id: 'library', label: 'Library' },
  { id: 'bookings', label: 'My Reservations' },
]

export default function Navbar({ view, onNavigate, user, onLogout, bookingCount, libraryCount }) {
  const [open, setOpen] = useState(false)

  function go(id) {
    onNavigate(id)
    setOpen(false)
  }

  return (
    <header className="nav">
      <button className="nav-brand" onClick={() => go('home')} aria-label="El-Masry Store home">
        <Logo />
      </button>

      <button
        className={`nav-burger ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`nav-links ${open ? 'open' : ''}`}>
        {LINKS.map((l) => (
          <button
            key={l.id}
            className={`nav-link ${view === l.id ? 'active' : ''}`}
            onClick={() => go(l.id)}
          >
            {l.label}
            {l.id === 'bookings' && bookingCount > 0 && (
              <span className="nav-badge">{bookingCount}</span>
            )}
            {l.id === 'library' && libraryCount > 0 && (
              <span className="nav-badge">{libraryCount}</span>
            )}
          </button>
        ))}
        <div className="nav-side">
          <SoundToggle />
          {user ? (
            <div className="nav-user">
              <span className="nav-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="nav-username">{user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={onLogout}>
                Log out
              </button>
            </div>
          ) : (
            <button className="btn btn-sm" onClick={() => go('auth')}>
              Sign in
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
