import { useState } from 'react'
import RankBadge from './RankBadge'
import './AccountTable.css'

function SortIcon({ col, sortConfig }) {
  const active = sortConfig.key === col
  return (
    <span className={`sort-icon ${active ? 'sort-icon--active' : ''}`}>
      {active ? (sortConfig.dir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

export default function AccountTable({ accounts, loading, sortConfig, onSort, onRowClick, onToast }) {
  const [copiedId, setCopiedId] = useState(null)

  const copyCredentials = async (e, acc) => {
    e.stopPropagation()
    const text = `${acc.username} ${acc.password}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
    }
    setCopiedId(acc.id)
    setTimeout(() => setCopiedId(null), 1600)
    onToast('Credentials copied!')
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
            <th className="sortable" onClick={() => onSort('ign')}>
              IGN <SortIcon col="ign" sortConfig={sortConfig} />
            </th>
            <th className="sortable" onClick={() => onSort('tagline')}>
              Tagline <SortIcon col="tagline" sortConfig={sortConfig} />
            </th>
            <th className="sortable" onClick={() => onSort('rank')}>
              Rank <SortIcon col="rank" sortConfig={sortConfig} />
            </th>
            <th className="th-copy"></th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc, idx) => {
            const copied = copiedId === acc.id
            return (
              <tr
                key={acc.id}
                className="account-row"
                style={{ '--row-delay': `${idx * 30}ms` }}
                onClick={() => onRowClick(acc)}
                title="Click to view details"
              >
                <td>
                  <div className="ign-cell">
                    <span className="ign-text">{acc.ign}</span>
                    {acc.verified && (
                      <span className="verified-badge" title="Verified">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    )}
                  </div>
                </td>

                <td>
                  <span className="tagline-tag">#{acc.tagline}</span>
                </td>

                <td>
                  <RankBadge rank={acc.live?.label ?? acc.rank} rr={acc.live?.rr} loading={acc.liveLoading} />
                </td>

                <td className="td-copy" onClick={e => e.stopPropagation()}>
                  <button
                    className={`copy-all-btn ${copied ? 'copy-all-btn--copied' : ''}`}
                    onClick={e => copyCredentials(e, acc)}
                    title="Copy credentials"
                  >
                    {copied ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon />
                        Copy
                      </>
                    )}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
