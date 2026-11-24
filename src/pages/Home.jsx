// El-Masry Store - landing hero (clean: logo, name, one button)
// Author: Ahmed El-Masry
import Logo from '../components/Logo.jsx'

export default function Home({ onBookGames }) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-logo">
          <Logo size={96} />
        </div>
        <h1 className="hero-title">EL-MASRY STORE</h1>
        <button className="btn btn-hero" onClick={onBookGames}>
          <span className="btn-hero-glow" />
          BOOK GAMES
        </button>
      </div>
    </section>
  )
}
