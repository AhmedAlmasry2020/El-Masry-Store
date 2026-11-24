// El-Masry Store - sign in / create account (demo, localStorage only)
// Author: Ahmed El-Masry
import { useState } from 'react'
import { loginUser, registerUser } from '../utils/auth.js'
import WizardDuel from '../components/WizardDuel.jsx'
import ScarabGreeter from '../components/ScarabGreeter.jsx'

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  // Cinematic intro: wizard duel first, the form rises from the blast.
  // Plays once per browser session (Ahmed, v4.5); reduced-motion users and
  // repeat visits go straight to the form.
  const [intro, setIntro] = useState(() => {
    if (REDUCED) return false
    try {
      return !sessionStorage.getItem('ems_duel_seen')
    } catch {
      return true
    }
  })

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.email.includes('@')) return setError('Enter a valid email address.')
    if (form.password.length < 4) return setError('Password needs at least 4 characters.')
    if (mode === 'register' && form.name.trim().length < 2)
      return setError('Tell us your name.')

    const res = mode === 'login' ? loginUser(form) : registerUser(form)
    if (!res.ok) return setError(res.error)
    onAuth(res.user)
  }

  if (intro)
    return (
      <WizardDuel
        onDone={() => {
          try {
            sessionStorage.setItem('ems_duel_seen', '1')
          } catch {
            // private mode: duel simply plays again next visit
          }
          setIntro(false)
        }}
      />
    )

  return (
    <section className="page-enter auth">
      <div className="auth-wrap">
        <ScarabGreeter startLeaned={REDUCED} />
        <form className="auth-card auth-card-blast" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="auth-sub">
          {mode === 'login' ? 'Sign in to manage your reservations.' : 'One account, every game in the vault.'}
        </p>

        {mode === 'register' && (
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={set('name')} placeholder="Ahmed El-Masry" autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={set('password')} placeholder="••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="btn" type="submit">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
          }}
        >
          {mode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}
        </button>
        <p className="auth-note">Demo accounts live in your browser only - nothing is sent to a server.</p>
        </form>
      </div>
    </section>
  )
}
