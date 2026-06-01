import { useState, useEffect, useRef } from 'react'
import './AccountModal.css'

const RANKS = ['Unranked','Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant']
const EMPTY = { ign: '', tagline: '', username: '', password: '', rank: '', verified: false, notes: '' }

export default function AccountModal({ title, initial, onSubmit, onClose }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : { ...EMPTY })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const firstRef = useRef(null)

  useEffect(() => {
    firstRef.current?.focus()
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const validate = () => {
    const errs = {}
    if (!form.ign.trim()) errs.ign = 'Required'
    if (!form.tagline.trim()) errs.tagline = 'Required'
    if (!form.username.trim()) errs.username = 'Required'
    if (!form.password.trim()) errs.password = 'Required'
    return errs
  }

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }))
    setSubmitError('')
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Check console.')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-header__left">
            <span className="modal-accent" />
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <Field label="IGN" error={errors.ign}>
              <input
                ref={firstRef}
                type="text"
                className={`field-input ${errors.ign ? 'field-input--error' : ''}`}
                value={form.ign}
                onChange={e => handleChange('ign', e.target.value)}
                placeholder="Player name"
                autoComplete="off"
              />
            </Field>
            <Field label="Tagline" error={errors.tagline}>
              <div className="tagline-wrap">
                <span className="tagline-prefix">#</span>
                <input
                  type="text"
                  className={`field-input tagline-input ${errors.tagline ? 'field-input--error' : ''}`}
                  value={form.tagline}
                  onChange={e => handleChange('tagline', e.target.value)}
                  placeholder="0000"
                  autoComplete="off"
                />
              </div>
            </Field>
          </div>

          <Field label="Username" error={errors.username}>
            <input
              type="text"
              className={`field-input ${errors.username ? 'field-input--error' : ''}`}
              value={form.username}
              onChange={e => handleChange('username', e.target.value)}
              placeholder="Riot account username"
              autoComplete="off"
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                className={`field-input pw-input ${errors.password ? 'field-input--error' : ''}`}
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="off"
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                {showPw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </Field>

          <div className="form-row">
            <Field label="Rank" error={errors.rank}>
              <select
                className={`field-select ${errors.rank ? 'field-input--error' : ''}`}
                value={form.rank}
                onChange={e => handleChange('rank', e.target.value)}
              >
                <option value="">Select rank</option>
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <Field label="Verified">
              <div className="verified-toggle-wrap">
                <button
                  type="button"
                  className={`verified-toggle ${form.verified ? 'verified-toggle--on' : ''}`}
                  onClick={() => handleChange('verified', !form.verified)}
                  role="switch"
                  aria-checked={form.verified}
                >
                  <span className="verified-toggle__track">
                    <span className="verified-toggle__thumb" />
                  </span>
                  <span className="verified-toggle__label">
                    {form.verified ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Verified
                      </>
                    ) : 'Not verified'}
                  </span>
                </button>
              </div>
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              className="field-input field-textarea"
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Any extra notes about this account..."
              rows={3}
              autoComplete="off"
            />
          </Field>

          {submitError && (
            <div className="submit-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving...' : (initial ? 'Update Account' : 'Add Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="form-field">
      <label className="field-label">{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
