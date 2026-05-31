import './Navbar.css'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <div className="navbar__logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="20,2 38,36 20,28 2,36" fill="#ff4655"/>
              <polygon points="20,28 38,36 20,38" fill="#c0392b" opacity="0.7"/>
            </svg>
          </div>
          <div className="navbar__titles">
            <span className="navbar__acronym">V.A.C.</span>
            <span className="navbar__subtitle">Valorant Account Center</span>
          </div>
        </div>
        <div className="navbar__right">
          <div className="navbar__status">
            <span className="status-dot" />
            <span className="status-text">CONNECTED</span>
          </div>
        </div>
      </div>
      <div className="navbar__accent" />
    </header>
  )
}
