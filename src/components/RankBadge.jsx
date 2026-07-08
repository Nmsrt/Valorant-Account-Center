import { tierOf } from '../rankService'
import './RankBadge.css'

const RANK_CONFIG = {
  Unranked:  { color: '#666688', bg: 'rgba(102,102,136,0.12)', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png' },
  Iron:      { color: '#8c9196', bg: 'rgba(140,145,150,0.12)', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/3/smallicon.png' },
  Bronze:    { color: '#a8693a', bg: 'rgba(168,105,58,0.12)',  img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/6/smallicon.png' },
  Silver:    { color: '#b0c0c8', bg: 'rgba(176,192,200,0.12)', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/9/smallicon.png' },
  Gold:      { color: '#e8b84b', bg: 'rgba(232,184,75,0.12)',  img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/12/smallicon.png' },
  Platinum:  { color: '#4db8a8', bg: 'rgba(77,184,168,0.12)',  img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/15/smallicon.png' },
  Diamond:   { color: '#8a6fff', bg: 'rgba(138,111,255,0.12)', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/18/smallicon.png' },
  Ascendant: { color: '#4bbd8c', bg: 'rgba(75,189,140,0.12)',  img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/smallicon.png' },
  Immortal:  { color: '#c43e4e', bg: 'rgba(196,62,78,0.12)',   img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/smallicon.png' },
  Radiant:   { color: '#ffd700', bg: 'rgba(255,215,0,0.15)',   img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/smallicon.png' },
}

export default function RankBadge({ rank, rr, loading }) {
  // `loading` = live lookup in flight; pulse so an old value reads as updating.
  const pulse = loading ? ' rank-badge--loading' : ''
  if (!rank) return <span className={`rank-badge rank-badge--none${pulse}`}>—</span>
  // rank may carry a division ("Immortal 2"); colors/icons key off the tier.
  const tier = tierOf(rank)
  const cfg = RANK_CONFIG[tier] || { color: '#888', bg: 'rgba(136,136,136,0.1)', img: null }
  return (
    <span
      className={`rank-badge${pulse}`}
      style={{
        color: cfg.color,
        background: cfg.bg,
        borderColor: `${cfg.color}40`,
        boxShadow: `0 0 8px ${cfg.color}20`,
      }}
    >
      {cfg.img && (
        <img
          className="rank-badge__img"
          src={cfg.img}
          alt={rank}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      )}
      {rank}
      {rr != null && <span className="rank-badge__rr">{rr} RR</span>}
    </span>
  )
}
