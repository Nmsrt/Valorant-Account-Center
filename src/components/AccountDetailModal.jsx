import { useEffect, useState } from 'react'
import RankBadge from './RankBadge'
import './AccountDetailModal.css'

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export default function AccountDetailModal({ account, onEdit, onDelete, onClose }) {
  const [showPw, setShowPw] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const copy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1600)
  }

  const copyAll = async () => {
    const text = `${account.username} ${account.password}`
    await copy(text, 'all')
  }

  return (
    <div className="adm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-box" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="adm-header">
          <div className="adm-header__left">
            <span className="adm-accent" />
            <div>
              <h2 className="adm-ign">{account.ign}<span className="adm-tag">#{account.tagline}</span></h2>
              <div className="adm-rank-row">
                <RankBadge rank={account.rank} rr={account.rr} />
                {account.verified && (
                  <span className="adm-verified">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="adm-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Credentials */}
        <div className="adm-body">
          <div className="adm-section-label">Credentials</div>
          <div className="adm-creds">
            <div className="adm-cred-row">
              <span className="adm-cred-label">Username</span>
              <div className="adm-cred-value-wrap">
                <span className="adm-cred-value">{account.username}</span>
                <button
                  className={`adm-copy-btn ${copiedField === 'username' ? 'adm-copy-btn--copied' : ''}`}
                  onClick={() => copy(account.username, 'username')}
                  title="Copy username"
                >
                  {copiedField === 'username' ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>

            <div className="adm-cred-row">
              <span className="adm-cred-label">Password</span>
              <div className="adm-cred-value-wrap">
                <span className="adm-cred-value adm-cred-value--pw">
                  {showPw ? account.password : '••••••••••••'}
                </span>
                <button
                  className="adm-copy-btn adm-copy-btn--eye"
                  onClick={() => setShowPw(p => !p)}
                  title={showPw ? 'Hide' : 'Show'}
                >
                  {showPw ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
                <button
                  className={`adm-copy-btn ${copiedField === 'password' ? 'adm-copy-btn--copied' : ''}`}
                  onClick={() => copy(account.password, 'password')}
                  title="Copy password"
                >
                  {copiedField === 'password' ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>
          </div>

          {/* Copy All */}
          <button
            className={`adm-copy-all ${copiedField === 'all' ? 'adm-copy-all--copied' : ''}`}
            onClick={copyAll}
          >
            {copiedField === 'all' ? (
              <>
                <CheckIcon />
                Copied to clipboard!
              </>
            ) : (
              <>
                <CopyIcon />
                Copy all credentials
              </>
            )}
          </button>

          {/* Notes */}
          {account.notes && (
            <>
              <div className="adm-section-label" style={{ marginTop: '20px' }}>Notes</div>
              <div className="adm-notes">{account.notes}</div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="adm-actions">
          <button className="adm-btn-delete" onClick={() => { onClose(); onDelete(account) }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            Delete
          </button>
          <button className="adm-btn-edit" onClick={() => { onClose(); onEdit(account) }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Account
          </button>
        </div>
      </div>
    </div>
  )
}
