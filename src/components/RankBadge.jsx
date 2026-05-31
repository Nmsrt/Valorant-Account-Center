import './RankBadge.css'

const RANK_CONFIG = {
  Iron:      { color: '#9ea0a6', bg: 'rgba(158,160,166,0.12)' },
  Bronze:    { color: '#cd7f32', bg: 'rgba(205,127,50,0.12)' },
  Silver:    { color: '#c0c0c0', bg: 'rgba(192,192,192,0.12)' },
  Gold:      { color: '#f0c040', bg: 'rgba(240,192,64,0.12)' },
  Platinum:  { color: '#5fbfad', bg: 'rgba(95,191,173,0.12)' },
  Diamond:   { color: '#4fc3f7', bg: 'rgba(79,195,247,0.12)' },
  Ascendant: { color: '#4caf84', bg: 'rgba(76,175,132,0.12)' },
  Immortal:  { color: '#e040fb', bg: 'rgba(224,64,251,0.12)' },
  Radiant:   { color: '#ffe566', bg: 'rgba(255,229,102,0.15)' },
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
