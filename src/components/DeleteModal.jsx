import { useEffect } from 'react'
import './DeleteModal.css'

export default function DeleteModal({ account, onConfirm, onClose }) {
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="del-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="del-box" role="dialog" aria-modal="true">
        <div className="del-icon-wrap">
          <svg className="del-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <h2 className="del-title">Delete Account</h2>
        <p className="del-message">
          Are you sure you want to delete{' '}
          <strong className="del-name">{account.ign}</strong>?
          This action cannot be undone.
        </p>
        <div className="del-meta">
          <span className="del-meta__item">
            <span className="del-meta__label">Username</span>
            <span className="del-meta__value">{account.username}</span>
          </span>
          {account.rank && (
            <span className="del-meta__item">
              <span className="del-meta__label">Rank</span>
              <span className="del-meta__value">{account.rank}</span>
            </span>
          )}
        </div>
        <div className="del-actions">
          <button className="del-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="del-btn-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
