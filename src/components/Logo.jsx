// El-Masry Store - brand logo
// Author: Ahmed El-Masry
export default function Logo({ size = 40 }) {
  return (
    <span className="logo">
      <img src={`${import.meta.env.BASE_URL}logo.svg`} width={size} height={size} alt="El-Masry Store logo" />
      <span className="logo-text">
        <strong>EL-MASRY</strong>
        <em>STORE</em>
      </span>
    </span>
  )
}
