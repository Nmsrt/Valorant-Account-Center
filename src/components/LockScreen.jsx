import { useState, useRef, useEffect } from 'react'
import './LockScreen.css'

const PASSCODE = 'NIGGA' // Change this to your desired passcode

export default function LockScreen({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = e => {
    e.preventDefault()
    if (value === PASSCODE) {
      sessionStorage.setItem('vac_unlocked', '1')
      onUnlock()
    } else {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 600)
      setTimeout(() => setError(false), 2000)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-bg" />

      <div className={`lock-box ${shake ? 'lock-box--shake' : ''}`}>
        {/* Logo */}
        <div className="lock-logo">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
            <polygon points="20,2 38,36 20,28 2,36" fill="#ff4655"/>
            <polygon points="20,28 38,36 20,38" fill="#c0392b" opacity="0.7"/>
          </svg>
        </div>

        <h1 className="lock-title">V.A.C.</h1>
        <p className="lock-subtitle">VALORANT ACCOUNT CENTER</p>

        <div className="lock-divider" />

        <p className="lock-prompt">Enter passcode to continue</p>

        <form className="lock-form" onSubmit={handleSubmit} noValidate>
          <div className={`lock-input-wrap ${error ? 'lock-input-wrap--error' : ''}`}>
            <span className="lock-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              ref={inputRef}
              className="lock-input"
              type="password"
              value={value}
              onChange={e => { setValue(e.target.value); setError(false) }}
              placeholder="••••••••"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <p className="lock-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Incorrect passcode
            </p>
          )}

          <button type="submit" className="lock-btn">
            Unlock
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
