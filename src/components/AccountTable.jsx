import { useState } from 'react'
import RankBadge from './RankBadge'
import './AccountTable.css'

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function SortIcon({ col, sortConfig }) {
  const active = sortConfig.key === col
  return (
    <span className={`sort-icon ${active ? 'sort-icon--active' : ''}`}>
      {active ? (sortConfig.dir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )
}

export default function AccountTable({ accounts, loading, sortConfig, onSort, onEdit, onDelete, onToast }) {
  const [revealedIds, setRevealedIds] = useState(new Set())
  const [copiedId, setCopiedId] = useState(null)

  const toggleReveal = id => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const copyToClipboard = async (text, label, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(`${id}-${label}`)
      setTimeout(() => setCopiedId(null), 1500)
      onToast(`${label} copied!`)
    } catch {
      // Fallback for browsers that block clipboard
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        document.execCommand('copy')
        setCopiedId(`${id}-${label}`)
        setTimeout(() => setCopiedId(null), 1500)
        onToast(`${label} copied!`)
      } catch {
        onToast('Copy failed — please copy manually', 'error')
      }
      document.body.removeChild(ta)
    }
  }

  if (loading) {
    return (
      <div className="table-state">
        <div className="loader">
          <div className="loader__bar" />
          <div className="loader__bar" />
          <div className="loader__bar" />
        </div>
        <p className="table-state__text">Loading accounts...</p>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="table-state">
        <svg className="table-state__icon" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="16" width="48" height="36" rx="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 24h48" stroke="currentColor" strokeWidth="2"/>
          <path d="M24 36h16M28 42h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="table-state__text">No accounts found</p>
        <p className="table-state__sub">Try adjusting your search or add a new account</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table className="account-table">
        <thead>
          <tr>
            <th className="th-num">#</th>
            <th className="sortable" onClick={() => onSort('ign')}>
              IGN <SortIcon col="ign" sortConfig={sortConfig} />
            </th>
            <th className="sortable" onClick={() => onSort('tagline')}>
              Tagline <SortIcon col="tagline" sortConfig={sortConfig} />
            </th>
            <th className="sortable" onClick={() => onSort('username')}>
              Username <SortIcon col="username" sortConfig={sortConfig} />
            </th>
            <th>Password</th>
            <th className="sortable" onClick={() => onSort('rank')}>
              Rank <SortIcon col="rank" sortConfig={sortConfig} />
            </th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc, idx) => {
            const revealed = revealedIds.has(acc.id)
            const userCopied = copiedId === `${acc.id}-Username`
            const passCopied = copiedId === `${acc.id}-Password`

            return (
              <tr
                key={acc.id}
                className="account-row"
                style={{ '--row-delay': `${idx * 30}ms` }}
              >
                <td className="td-num">
                  <span className="row-num">{idx + 1}</span>
                </td>

                <td>
                  <span className="ign-text">{acc.ign}</span>
                </td>

                <td>
                  <span className="tagline-tag">#{acc.tagline}</span>
                </td>

                <td>
                  <div className="td-credential">
                    <span className="cred-text">{acc.username}</span>
                    <button
                      className={`copy-btn ${userCopied ? 'copy-btn--copied' : ''}`}
                      onClick={() => copyToClipboard(acc.username, 'Username', acc.id)}
                      title="Copy username"
                    >
                      {userCopied ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : <CopyIcon />}
                    </button>
                  </div>
                </td>

                <td>
                  <div className="td-credential">
                    <span className="cred-text cred-text--pw">
                      {revealed ? acc.password : '••••••••'}
                    </span>
                    <button
                      className="copy-btn copy-btn--reveal"
                      onClick={() => toggleReveal(acc.id)}
                      title={revealed ? 'Hide password' : 'Show password'}
                    >
                      {revealed ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button
                      className={`copy-btn ${passCopied ? 'copy-btn--copied' : ''}`}
                      onClick={() => copyToClipboard(acc.password, 'Password', acc.id)}
                      title="Copy password"
                    >
                      {passCopied ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : <CopyIcon />}
                    </button>
                  </div>
                </td>

                <td>
                  <RankBadge rank={acc.rank} />
                </td>

                <td>
                  <div className="td-actions">
                    <button className="action-btn action-btn--edit" onClick={() => onEdit(acc)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <button className="action-btn action-btn--delete" onClick={() => onDelete(acc)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
