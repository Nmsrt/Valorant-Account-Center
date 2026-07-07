import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import AccountTable from './components/AccountTable'
import AccountModal from './components/AccountModal'
import AccountDetailModal from './components/AccountDetailModal'
import DeleteModal from './components/DeleteModal'
import Toast from './components/Toast'
import LockScreen from './components/LockScreen'
import { getAccounts, createAccount, updateAccount, deleteAccount } from './accountService'
import { fetchRanksFor, tierOf, TIERS } from './rankService'
import './App.css'

// Tier for filter/sort: parsed live tier when the lookup landed, else manual rank.
const displayTier = a => a.live?.tier ?? tierOf(a.rank)

// Single sort key per account: tier, then division, then RR. Bands are wide
// enough that RR (hundreds at most) can never spill into the division band.
const rankScore = a =>
  TIERS.indexOf(displayTier(a)) * 1e6 + (a.live?.division ?? 0) * 1e5 + (a.live?.rr ?? 0)

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('vac_unlocked') === '1')

  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRank, setFilterRank] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', dir: 'desc' })
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [toasts, setToasts] = useState([])
  const [liveRanks, setLiveRanks] = useState({})

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAccounts()
      setAccounts(data)
    } catch (e) {
      console.error('fetchAccounts error:', e)
      showToast(e.message || 'Failed to load accounts', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { if (unlocked) fetchAccounts() }, [unlocked, fetchAccounts])

  // Fill in live rank/RR in the background; table renders instantly from DB
  // and rank cells update as lookups land (cached entries resolve at once).
  // The cleanup cancels the previous pool so an edit/delete can't receive a
  // stale result for the old identity; the identity check skips re-renders
  // when a re-run just replays cache hits.
  useEffect(() => {
    if (!accounts.length) return
    const { cancel } = fetchRanksFor(accounts, (id, r) =>
      setLiveRanks(prev => (prev[id] === r ? prev : { ...prev, [id]: r }))
    )
    return cancel
  }, [accounts])

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />
  }

  // Live rank rides alongside the stored fields as `a.live` — it must never
  // overwrite `rank`, which is the manual fallback the edit form round-trips
  // back to the DB. Display prefers `live.label`; `rank` stays authoritative.
  const merged = accounts.map(a => {
    const live = liveRanks[a.id]
    return live ? { ...a, live } : a
  })

  const displayed = merged
    .filter(a => {
      const q = search.toLowerCase()
      return (
        a.ign?.toLowerCase().includes(q) ||
        a.tagline?.toLowerCase().includes(q) ||
        a.username?.toLowerCase().includes(q)
      )
    })
    .filter(a => !filterRank || displayTier(a) === filterRank)
    .sort((a, b) => {
      const { key, dir } = sortConfig
      let va = a[key] ?? ''
      let vb = b[key] ?? ''
      if (key === 'rank') {
        va = rankScore(a)
        vb = rankScore(b)
      }
      if (va < vb) return dir === 'asc' ? -1 : 1
      if (va > vb) return dir === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = key =>
    setSortConfig(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' })

  // Add/edit errors propagate to AccountModal, which shows them inline.
  const handleAdd = async data => {
    const created = await createAccount(data)
    setAccounts(prev => [created, ...prev])
    showToast('Account added!')
    setAddOpen(false)
  }

  const handleEdit = async data => {
    const updated = await updateAccount(editTarget.id, data)
    setAccounts(prev => prev.map(a => (a.id === updated.id ? updated : a)))
    showToast('Account updated!')
    setEditTarget(null)
  }

  const handleDelete = async () => {
    try {
      await deleteAccount(deleteTarget.id)
      setAccounts(prev => prev.filter(a => a.id !== deleteTarget.id))
      showToast('Account deleted')
      setDeleteTarget(null)
    } catch (e) {
      showToast(e.message || 'Error deleting account', 'error')
      fetchAccounts()
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <div className="page-header">
          <div className="page-header__left">
            <h2 className="page-title">Account Vault</h2>
            <span className="account-count">{displayed.length} accounts</span>
          </div>
          <div className="page-header__right">
            <button className="btn-add" onClick={() => setAddOpen(true)}>
              <span>+</span> Add Account
            </button>
          </div>
        </div>

        <div className="filters">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search IGN, tagline, username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>×</button>
            )}
          </div>
          <select
            className="rank-select"
            value={filterRank}
            onChange={e => setFilterRank(e.target.value)}
          >
            <option value="">All Ranks</option>
            {TIERS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <AccountTable
          accounts={displayed}
          loading={loading}
          sortConfig={sortConfig}
          onSort={handleSort}
          onRowClick={setDetailTarget}
          onToast={showToast}
        />
      </main>

      {addOpen && (
        <AccountModal title="Add Account" onSubmit={handleAdd} onClose={() => setAddOpen(false)} />
      )}
      {editTarget && (
        <AccountModal title="Edit Account" initial={editTarget} onSubmit={handleEdit} onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteModal account={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
      {detailTarget && (
        <AccountDetailModal
          account={detailTarget}
          onEdit={acc => { setDetailTarget(null); setEditTarget(acc) }}
          onDelete={acc => { setDetailTarget(null); setDeleteTarget(acc) }}
          onClose={() => setDetailTarget(null)}
        />
      )}

      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} message={t.msg} type={t.type} />)}
      </div>
    </div>
  )
}
