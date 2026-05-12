import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { machinesQuery, updateMachine, deleteMachine, addLead, buyersQuery } from '../lib/firebase'
import { generateWhatsAppMessage } from '../lib/openai'
import { fmtUSD, ESTADO_CONFIG, timeAgo } from '../utils/pricing'

function fmtPEN(n) {
  return `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const FILTERS = ['Todos', 'Registrada', 'Publicada', 'Con leads', 'En negociación', 'Vendida', 'Retirada']

export default function Catalog({ isAdmin = false }) {
  const { data: machines, loading, error } = useCollection(machinesQuery)
  const { data: buyers }                   = useCollection(buyersQuery)
  const [filter,  setFilter]  = useState('Todos')
  const [notify,  setNotify]  = useState(null)
  const [msg,     setMsg]     = useState('')
  const [genLoad, setGenLoad] = useState(false)

  // Público solo ve máquinas publicadas / con leads / en negociación
  const visibleMachines = isAdmin
    ? machines
    : machines.filter(m => ['Publicada', 'Con leads', 'En negociación'].includes(m.estado))

  const list = filter === 'Todos'
    ? visibleMachines
    : visibleMachines.filter(m => m.estado === filter)

  const nextEstado = async (m) => {
    const cfg = ESTADO_CONFIG[m.estado]
    if (!cfg?.next) return
    await updateMachine(m.id, { estado: cfg.next })
    await addLead({
      maquinaNombre: `${m.tipo} ${m.marca} ${m.modelo}`,
      comprador: 'Sistema',
      accion: `Estado actualizado: ${m.estado} → ${cfg.next}`,
      color: ESTADO_CONFIG[cfg.next]?.color || '#f59e0b',
    })
  }

  const openNotify = async (m) => {
    setNotify(m); setMsg('')
    const matching = buyers.filter(b => b.tipos?.includes(m.tipo))
    setGenLoad(true)
    try {
      const txt = await generateWhatsAppMessage({ machine: m, buyerName: matching[0]?.nombre || 'Cliente' })
      setMsg(txt)
    } catch {
      setMsg(
        `Hola, te contacta LumajiraHub 📞 935211605.\n\n` +
        `✅ ${m.tipo} ${m.marca} ${m.modelo} (${m.anio})\n` +
        `Estado: ${m.estado_op || 'Operativo'}\n` +
        `💰 Precio: ${fmtPEN(m.ppublicado)}\n\n` +
        `¿Te interesa? Escríbenos para coordinar una visita.`
      )
    }
    setGenLoad(false)
  }

  if (error) return <div className="banner banner-err">⚠️ {error}</div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {isAdmin ? 'Catálogo de maquinaria' : 'Maquinaria disponible'}
        </h1>
        <p className="page-sub">
          {isAdmin
            ? 'Ciclo de vida: Registrada → Publicada → Con leads → En negociación → Vendida'
            : 'Equipos industriales usados disponibles para compra — LumajiraHub · 📲 935211605'}
        </p>
      </div>

      {/* Filtros — solo admin ve todos los estados */}
      <div className="filter-bar">
        {(isAdmin ? FILTERS : ['Todos', 'Publicada', 'Con leads', 'En negociación']).map(f => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--t3)' }}>
          {list.length} máquinas
        </span>
      </div>

      {loading
        ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        : list.length === 0
        ? (
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
            <p>{isAdmin ? 'No hay máquinas en esta categoría' : 'No hay equipos disponibles en este momento'}</p>
          </div>
        )
        : (
          <div className="machines-list">
            {list.map(m => {
              const cfg = ESTADO_CONFIG[m.estado] || ESTADO_CONFIG['Registrada']
              return (
                <div key={m.id} className="machine-card">

                  {/* Imagen */}
                  <div className="machine-thumb">
                    {m.fotos?.[0]
                      ? <img src={m.fotos[0]} alt={m.modelo} />
                      : <span>⚙️</span>}
                  </div>

                  {/* Info */}
                  <div className="machine-body">
                    <div className="machine-name">
                      {m.tipo} {m.marca} {m.modelo} ({m.anio})
                    </div>

                    <div className="machine-meta">
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                        ● {m.estado}
                      </span>
                      {m.estado_op && (
                        <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                          {m.estado_op.split('—')[0].trim()}
                        </span>
                      )}
                      {isAdmin && m.duracion > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                          {m.duracion}d acuerdo
                        </span>
                      )}
                    </div>

                    {/* Descripción visible para todos */}
                    {m.descripcion && (
                      <p style={{
                        fontSize: 12, color: 'var(--t2)', marginTop: 6,
                        lineHeight: 1.6, maxWidth: 480,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {m.descripcion}
                      </p>
                    )}

                    {/* Precios */}
                    <div className="machine-prices" style={{ marginTop: 8 }}>
                      {isAdmin ? (
                        // Admin ve todos los precios internos
                        <>
                          <div className="price-item">
                            <div className="price-label">Al vendedor</div>
                            <div className="price-value">{fmtPEN(m.pvendedor)}</div>
                          </div>
                          <div className="price-item">
                            <div className="price-label">Precio mínimo</div>
                            <div className="price-value">{fmtPEN(m.pminimo)}</div>
                          </div>
                          <div className="price-item">
                            <div className="price-label">Publicado</div>
                            <div className="price-value" style={{ color: 'var(--amber)' }}>
                              {fmtPEN(m.ppublicado)}
                            </div>
                          </div>
                          <div className="price-item">
                            <div className="price-label">Utilidad</div>
                            <div className="price-value" style={{ color: 'var(--ok)' }}>
                              {fmtPEN(m.margenReal || m.utilidad)}
                            </div>
                          </div>
                        </>
                      ) : (
                        // Público solo ve el precio publicado
                        <div className="price-item">
                          <div className="price-label">Precio</div>
                          <div className="price-value" style={{ color: 'var(--amber)', fontSize: 17 }}>
                            {fmtPEN(m.ppublicado)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="machine-actions">
                    {isAdmin ? (
                      // Admin: cambiar estado, notificar, retirar
                      <>
                        {cfg.next && (
                          <button className="btn btn-secondary btn-sm" onClick={() => nextEstado(m)}>
                            → {cfg.next}
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => openNotify(m)}>
                          📲 Notificar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => confirm('¿Retirar máquina?') && updateMachine(m.id, { estado: 'Retirada' })}
                        >
                          Retirar
                        </button>
                      </>
                    ) : (
                      // Público: solo botón de contacto
                      <a
                        href={`https://wa.me/51935211605?text=${encodeURIComponent(`Hola, estoy interesado en: ${m.tipo} ${m.marca} ${m.modelo} (${m.anio}) — ${fmtPEN(m.ppublicado)}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: '#25D366', color: '#fff',
                          padding: '8px 14px', borderRadius: 'var(--r-md)',
                          fontSize: 13, fontWeight: 700, textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        📲 Me interesa
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      {/* Banner contacto — solo vista pública */}
      {!isAdmin && (
        <div style={{
          marginTop: 32, padding: '20px 24px',
          background: 'var(--amberBg)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 'var(--r-lg)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
              ¿Tienes maquinaria para vender?
            </div>
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>
              La vendemos por ti. Sin inventario, sin riesgo. Solo resultados.
            </div>
          </div>
          <a
            href="https://wa.me/51935211605?text=Hola, quiero consignar una máquina con LumajiraHub"
            target="_blank" rel="noreferrer"
            style={{
              background: '#25D366', color: '#fff',
              padding: '10px 22px', borderRadius: 'var(--r-md)',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            📲 Contáctanos por WhatsApp
          </a>
        </div>
      )}

      {/* Modal notificación — solo admin */}
      {notify && isAdmin && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setNotify(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">📲 Notificar compradores</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setNotify(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 14 }}>
              Mensaje generado para{' '}
              <strong style={{ color: 'var(--t1)' }}>
                {notify.tipo} {notify.marca} {notify.modelo}
              </strong>.
              Copia y envía por WhatsApp a los compradores interesados.
            </p>
            {genLoad
              ? <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              : <textarea className="inp" rows={7} value={msg}
                          onChange={e => setMsg(e.target.value)}
                          style={{ marginBottom: 12 }} />
            }
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary"
                      onClick={() => { navigator.clipboard.writeText(msg); alert('¡Copiado!') }}>
                📋 Copiar mensaje
              </button>
              <button className="btn btn-ghost" onClick={() => setNotify(null)}>Cerrar</button>
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>
              Compradores con interés en <strong style={{ color: 'var(--t2)' }}>{notify.tipo}</strong>:{' '}
              {buyers.filter(b => b.tipos?.includes(notify.tipo)).map(b => b.nombre).join(', ') || 'Ninguno registrado'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
