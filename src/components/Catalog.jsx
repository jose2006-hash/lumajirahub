import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { machinesQuery, updateMachine, deleteMachine, addLead } from '../lib/firebase'
import { buyersQuery } from '../lib/firebase'
import { generateWhatsAppMessage } from '../lib/openai'
import { fmtUSD, ESTADO_CONFIG, timeAgo, buyerMatchesMachineTipo } from '../utils/pricing'

const FILTERS = ['Todos','Registrada','Publicada','Con leads','En negociación','Vendida','Retirada']

export default function Catalog() {
  const { data: machines, loading, error } = useCollection(machinesQuery)
  const { data: buyers } = useCollection(buyersQuery)
  const [filter,  setFilter]  = useState('Todos')
  const [notify,  setNotify]  = useState(null)  // machine being notified
  const [msg,     setMsg]     = useState('')
  const [genLoad, setGenLoad] = useState(false)

  const list = filter === 'Todos' ? machines : machines.filter(m => m.estado === filter)

  const nextEstado = async (m) => {
    const cfg = ESTADO_CONFIG[m.estado]
    if (!cfg?.next) return
    await updateMachine(m.id, { estado: cfg.next })
    await addLead({ maquinaNombre: `${m.tipo} ${m.marca} ${m.modelo}`, comprador: 'Sistema', accion: `Estado actualizado: ${m.estado} → ${cfg.next}`, color: ESTADO_CONFIG[cfg.next]?.color || '#f59e0b' })
  }

  const openNotify = async (m) => {
    setNotify(m); setMsg('')
    const matching = buyers.filter((b) => buyerMatchesMachineTipo(b, m.tipo))
    if (matching.length > 0) {
      setGenLoad(true)
      try { const txt = await generateWhatsAppMessage({ machine: m, buyerName: matching[0].nombre }); setMsg(txt) }
      catch(e) { setMsg(`Oportunidad: ${m.tipo} ${m.marca} ${m.modelo} (${m.anio}) — $${Number(m.ppublicado||0).toLocaleString('en-US')} USD. ¿Te interesa? 📞`) }
      setGenLoad(false)
    } else {
      setMsg(`Oportunidad: ${m.tipo} ${m.marca} ${m.modelo} (${m.anio}) — $${Number(m.ppublicado||0).toLocaleString('en-US')} USD. ¿Te interesa? 📞`)
    }
  }

  if (error) return <div className="banner banner-err">⚠️ {error}</div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Catálogo de maquinaria</h1>
        <p className="page-sub">Ciclo de vida: Registrada → Publicada → Con leads → En negociación → Vendida</p>
      </div>

      <div className="filter-bar">
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip${filter===f?' active':''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <span style={{marginLeft:'auto',fontSize:12,color:'var(--t3)'}}>{list.length} máquinas</span>
      </div>

      {loading ? <div style={{textAlign:'center',padding:'40px'}}><div className="spinner" style={{margin:'0 auto'}} /></div> :
       list.length === 0 ? (
        <div className="empty-state">
          <div style={{fontSize:40,marginBottom:12}}>🏭</div>
          <p>No hay máquinas en esta categoría</p>
        </div>
       ) : (
        <div className="machines-list">
          {list.map(m => {
            const cfg = ESTADO_CONFIG[m.estado] || ESTADO_CONFIG['Registrada']
            return (
              <div key={m.id} className="machine-card">
                <div className="machine-thumb">
                  {m.fotos?.[0] ? <img src={m.fotos[0]} alt={m.modelo} /> : <span>⚙️</span>}
                </div>
                <div className="machine-body">
                  <div className="machine-name">{m.tipo} {m.marca} {m.modelo} ({m.anio})</div>
                  <div className="machine-meta">
                    <span className="badge" style={{background: cfg.bg, color: cfg.color}}>
                      ● {m.estado}
                    </span>
                    {m.duracion > 0 && <span style={{fontSize:11}}>{m.duracion}d acuerdo</span>}
                    {m.estado_op && <span style={{fontSize:11,color:'var(--t3)'}}>{m.estado_op.split('—')[0].trim()}</span>}
                  </div>
                  <div className="machine-prices">
                    <div className="price-item"><div className="price-label">Al vendedor</div><div className="price-value">{fmtUSD(m.pvendedor)}</div></div>
                    <div className="price-item"><div className="price-label">Mínimo venta</div><div className="price-value">{fmtUSD(m.pminimo)}</div></div>
                    <div className="price-item"><div className="price-label">Publicado</div><div className="price-value" style={{color:'var(--amber)'}}>{fmtUSD(m.ppublicado)}</div></div>
                    <div className="price-item"><div className="price-label">Utilidad</div><div className="price-value" style={{color:'var(--ok)'}}>{fmtUSD(m.margenReal)}</div></div>
                  </div>
                </div>
                <div className="machine-actions">
                  {cfg.next && (
                    <button className="btn btn-secondary btn-sm" onClick={() => nextEstado(m)}>
                      → {cfg.next}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => openNotify(m)}>📲 Notificar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('¿Retirar máquina?')) updateMachine(m.id, {estado:'Retirada'}) }}>Retirar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Notify modal */}
      {notify && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setNotify(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">📲 Notificar compradores</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setNotify(null)}>✕</button>
            </div>
            <p style={{fontSize:13,color:'var(--t2)',marginBottom:14}}>
              Mensaje generado con IA para <strong style={{color:'var(--t1)'}}>{notify.tipo} {notify.marca} {notify.modelo}</strong>.<br />
              Copia y envía por WhatsApp a los compradores interesados en este tipo de máquina.
            </p>
            {genLoad ? (
              <div style={{textAlign:'center',padding:'24px'}}><div className="spinner" style={{margin:'0 auto'}} /></div>
            ) : (
              <textarea className="inp" rows={6} value={msg} onChange={e => setMsg(e.target.value)} style={{marginBottom:12}} />
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(msg); alert('¡Copiado!') }}>📋 Copiar mensaje</button>
              <button className="btn btn-ghost" onClick={() => setNotify(null)}>Cerrar</button>
            </div>
            <div className="divider" />
            <div style={{fontSize:12,color:'var(--t3)'}}>
              Compradores con interés en <strong style={{color:'var(--t2)'}}>{notify.tipo}</strong>:{' '}
              {buyers.filter((b) => buyerMatchesMachineTipo(b, notify.tipo)).map((b) => b.nombre).join(', ') || 'Ninguno registrado aún'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
