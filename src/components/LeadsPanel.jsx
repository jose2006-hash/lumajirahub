import { useCollection } from '../hooks/useCollection'
import { leadsQuery } from '../lib/firebase'
import { timeAgo } from '../utils/pricing'

const DOT_COLOR = {
  ok:      '#22c55e',
  warn:    '#f59e0b',
  info:    '#60a5fa',
  purple:  '#a78bfa',
  default: '#f59e0b',
}

export default function LeadsPanel() {
  const { data: leads, loading, error } = useCollection(leadsQuery)

  if (error) return <div className="banner banner-err">⚠️ {error}</div>

  const total    = leads.length
  const hoy      = leads.filter(l => { const d = l.createdAt?.toDate?.(); return d && (Date.now()-d.getTime()) < 86400000 }).length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Panel de leads</h1>
        <p className="page-sub">Registro cronológico de toda la actividad del pipeline</p>
      </div>

      <div className="metric-grid" style={{marginBottom:20}}>
        <div className="metric-card">
          <div className="metric-label">Leads totales</div>
          <div className="metric-value" style={{color:'var(--amber)'}}>{loading?'—':total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Hoy</div>
          <div className="metric-value" style={{color:'var(--ok)'}}>{loading?'—':hoy}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Actividad del pipeline</div>
        {loading ? (
          <div style={{textAlign:'center',padding:'32px'}}><div className="spinner" style={{margin:'0 auto'}} /></div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div style={{fontSize:36,marginBottom:10}}>🔥</div>
            <p>No hay actividad aún. Registra una máquina para comenzar.</p>
          </div>
        ) : (
          leads.map((l, i) => (
            <div key={l.id || i} className="lead-item">
              <div className="lead-dot" style={{background: l.color || DOT_COLOR.default}} />
              <div className="lead-content">
                <div className="lead-machine">{l.maquinaNombre || '—'}</div>
                <div className="lead-action">
                  {l.comprador && <strong style={{color:'var(--t1)'}}>{l.comprador}</strong>}
                  {l.comprador && ' · '}
                  {l.accion}
                </div>
              </div>
              <div className="lead-time">{timeAgo(l.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
