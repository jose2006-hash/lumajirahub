import { useCollection } from '../hooks/useCollection'
import { machinesQuery, leadsQuery } from '../lib/firebase'
import { fmtUSD, ESTADO_CONFIG, timeAgo } from '../utils/pricing'

const PIPE_STAGES = ['Registrada','Publicada','Con leads','En negociación','Vendida']

export default function Dashboard({ setTab }) {
  const { data: machines, loading: mLoad, error: mErr } = useCollection(machinesQuery)
  const { data: leads,    loading: lLoad, error: lErr  } = useCollection(leadsQuery)

  const byEstado = PIPE_STAGES.reduce((a, s) => {
    a[s] = machines.filter(m => m.estado === s)
    return a
  }, {})

  const totalActivas    = machines.filter(m => !['Vendida','Retirada'].includes(m.estado)).length
  const totalVendidas   = machines.filter(m => m.estado === 'Vendida').length
  const utilidadTotal   = machines.filter(m => m.estado === 'Vendida').reduce((s, m) => s + (m.margenReal || 0), 0)
  const leadsActivos    = leads.filter(l => !l.tipo || l.tipo !== 'venta').length

  const pipelineColors = { Registrada:'rgba(107,114,128,.15)', Publicada:'rgba(245,158,11,.12)', 'Con leads':'rgba(96,165,250,.12)', 'En negociación':'rgba(167,139,250,.12)', Vendida:'rgba(34,197,94,.12)' }
  const pipelineText   = { Registrada:'#6b7280', Publicada:'#f59e0b', 'Con leads':'#60a5fa', 'En negociación':'#a78bfa', Vendida:'#22c55e' }

  if (mErr) return <div className="banner banner-err">⚠️ {mErr}</div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Vista general en tiempo real del negocio de consignación</p>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Máquinas activas</div>
          <div className="metric-value" style={{color:'var(--amber)'}}>{mLoad ? '—' : totalActivas}</div>
          <div className="metric-sub">En pipeline</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Leads totales</div>
          <div className="metric-value" style={{color:'var(--info)'}}>{lLoad ? '—' : leads.length}</div>
          <div className="metric-sub">Interacciones</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Vendidas</div>
          <div className="metric-value" style={{color:'var(--ok)'}}>{mLoad ? '—' : totalVendidas}</div>
          <div className="metric-sub">Consignaciones cerradas</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Utilidad generada</div>
          <div className="metric-value" style={{color:'var(--ok)'}}>{mLoad ? '—' : fmtUSD(utilidadTotal)}</div>
          <div className="metric-sub">Máquinas vendidas</div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Pipeline de valor</div>
        <div className="pipeline">
          {PIPE_STAGES.map((s, i) => {
            const list = byEstado[s] || []
            const valor = list.reduce((a, m) => a + (m.ppublicado || 0), 0)
            return (
              <div key={s} style={{display:'contents'}}>
                {i > 0 && <div className="pipeline-arrow">›</div>}
                <div className="pipeline-stage" style={{background: pipelineColors[s]}}>
                  <div className="pipeline-label" style={{color: pipelineText[s]}}>{s}</div>
                  <div className="pipeline-count" style={{color: pipelineText[s]}}>{mLoad ? '—' : list.length}</div>
                  {valor > 0 && <div className="pipeline-value" style={{color: pipelineText[s]}}>{fmtUSD(valor)}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-title">Actividad reciente</div>
          {lLoad ? <div className="spinner" /> :
           leads.length === 0 ? <div className="empty-state"><p>Sin actividad aún</p></div> :
           leads.slice(0, 6).map((l, i) => (
            <div key={l.id || i} className="lead-item">
              <div className="lead-dot" style={{background: l.color || 'var(--amber)'}} />
              <div className="lead-content">
                <div className="lead-machine">{l.maquinaNombre || '—'}</div>
                <div className="lead-action">{l.comprador} · {l.accion}</div>
              </div>
              <div className="lead-time">{timeAgo(l.createdAt)}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Acciones rápidas</div>
          <div className="rows-gap">
            <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={() => setTab('nueva')}>
              ➕ Registrar nueva máquina
            </button>
            <button className="btn btn-secondary" style={{width:'100%'}} onClick={() => setTab('catalogo')}>
              🏭 Ver catálogo completo
            </button>
            <button className="btn btn-ghost" style={{width:'100%'}} onClick={() => setTab('compradores')}>
              👥 Gestionar compradores
            </button>
          </div>
          <div className="divider" />
          <div className="card-title">Estado del sistema</div>
          <div style={{fontSize:'13px',display:'flex',flexDirection:'column',gap:'8px'}}>
            <div style={{display:'flex',justifyContent:'space-between',color:'var(--t2)'}}>
              <span>Firebase</span>
              <span style={{color: mErr ? 'var(--err)' : 'var(--ok)'}}>{mErr ? '✗ Error' : '✓ Conectado'}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',color:'var(--t2)'}}>
              <span>Tiempo real</span>
              <span style={{color:'var(--ok)'}}>✓ Activo</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',color:'var(--t2)'}}>
              <span>OpenAI</span>
              <span style={{color: import.meta.env.VITE_OPENAI_API_KEY?.startsWith('sk-your') ? 'var(--warn)' : 'var(--ok)'}}>
                {import.meta.env.VITE_OPENAI_API_KEY?.startsWith('sk-your') ? '⚠ No configurado' : '✓ Configurado'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
