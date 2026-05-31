import './RankBadge.css'

const RANK_CONFIG = {
  Iron:      { color: '#8c9196', bg: 'rgba(140,145,150,0.12)' },
  Bronze:    { color: '#a8693a', bg: 'rgba(168,105,58,0.12)' },
  Silver:    { color: '#b0c0c8', bg: 'rgba(176,192,200,0.12)' },
  Gold:      { color: '#e8b84b', bg: 'rgba(232,184,75,0.12)' },
  Platinum:  { color: '#4db8a8', bg: 'rgba(77,184,168,0.12)' },
  Diamond:   { color: '#8a6fff', bg: 'rgba(138,111,255,0.12)' },
  Ascendant: { color: '#4bbd8c', bg: 'rgba(75,189,140,0.12)' },
  Immortal:  { color: '#c43e4e', bg: 'rgba(196,62,78,0.12)' },
  Radiant:   { color: '#ffd700', bg: 'rgba(255,215,0,0.15)' },
}

export default function RankBadge({ rank }) {
  if (!rank) return <span className="rank-badge rank-badge--none">—</span>
  const cfg = RANK_CONFIG[rank] || { color: '#888', bg: 'rgba(136,136,136,0.1)' }
  return (
    <span
      className="rank-badge"
      style={{
        color: cfg.color,
        background: cfg.bg,
        borderColor: `${cfg.color}40`,
        boxShadow: `0 0 8px ${cfg.color}20`,
      }}
    >
      <span className="rank-badge__dot" style={{ background: cfg.color }} />
      {rank}
    </span>
  )
}
