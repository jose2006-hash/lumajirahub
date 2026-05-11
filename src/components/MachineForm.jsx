import { useState, useRef } from 'react'
import { addMachine, addLead, uploadMachineImage, buyersQuery } from '../lib/firebase'
import { generateDescription } from '../lib/openai'
import { useCollection } from '../hooks/useCollection'

const MACHINE_TIPOS = [
  'Excavadora','Retroexcavadora','Grúa','Compactadora','Bulldozer',
  'Cargador frontal','Montacargas','Motoniveladora','Perforadora',
  'Torno','Fresadora','Camión minero','Otro'
]

const COMPANY_WA = '51935211605'

function fmtPEN(n) {
  return `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function calcPricing(pvendedor, needsMaintenance) {
  const marketing      = Math.round(pvendedor * 0.10)
  const mantenimiento  = needsMaintenance ? Math.round(pvendedor * 0.10) : 0
  const utilidad       = Math.round(pvendedor * 0.15)
  const ppublicado     = pvendedor + marketing + mantenimiento + utilidad
  return { marketing, mantenimiento, utilidad, ppublicado }
}

export default function MachineForm({ setTab }) {
  const { data: buyers } = useCollection(buyersQuery)

  const [f, setF] = useState({
    tipo:             'Excavadora',
    marca:            '',
    modelo:           '',
    anio:             new Date().getFullYear() - 3,
    estado_op:        'Operativo — sin observaciones',
    descripcion:      '',
    notas:            '',
    pvendedor:        '',
    needsMaintenance: false,
  })

  const [imgs,      setImgs]      = useState([])
  const [saving,    setSaving]    = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError,   setAiError]   = useState('')
  const fileRef = useRef()

  const set = k => e => setF(p => ({
    ...p,
    [k]: k === 'pvendedor' || k === 'anio'
           ? parseFloat(e.target.value) || ''
           : k === 'needsMaintenance'
           ? e.target.checked
           : e.target.value,
  }))

  const pv      = parseFloat(f.pvendedor) || 0
  const pricing = calcPricing(pv, f.needsMaintenance)

  const matchingBuyers = buyers.filter(b => b.tipos?.includes(f.tipo))

  const waText = (buyerName) =>
    encodeURIComponent(
      `Hola ${buyerName}, te contacta LumajiraHub 📞 935211605.\n\n` +
      `✅ Nuevo equipo disponible:\n` +
      `${f.tipo} ${f.marca} ${f.modelo} (${f.anio})\n` +
      `Estado: ${f.estado_op}\n` +
      `💰 Precio: ${fmtPEN(pricing.ppublicado)}\n` +
      (f.descripcion ? `\n${f.descripcion}\n` : '') +
      `\n¿Te interesa? Escríbenos para coordinar una visita.`
    )

  const handleFiles = e => {
    const files = Array.from(e.target.files)
    setImgs(p => [...p, ...files.map(file => ({ file, url: URL.createObjectURL(file) }))])
  }

  const runAI = async () => {
    setAiLoading(true); setAiError('')
    try {
      const d = await generateDescription({
        tipo: f.tipo, marca: f.marca, modelo: f.modelo,
        anio: f.anio, estado_op: f.estado_op, notas: f.notas,
      })
      setF(p => ({ ...p, descripcion: d }))
    } catch (e) { setAiError(e.message) }
    setAiLoading(false)
  }

  const handleSubmit = async () => {
    if (!f.marca.trim() || !f.modelo.trim()) { alert('Completa Marca y Modelo'); return }
    if (pv <= 0) { alert('Ingresa el precio neto al vendedor en soles'); return }
    setSaving(true)
    try {
      const docData = {
        ...f,
        pvendedor: pv,
        ...pricing,
        moneda: 'PEN',
        estado: 'Publicada',
        fotos:  [],
      }
      const ref       = await addMachine(docData)
      const machineId = ref.id

      // Subir fotos a Firebase Storage
      const fotoUrls = []
      for (const img of imgs) {
        try {
          const url = await uploadMachineImage(img.file, machineId)
          fotoUrls.push(url)
        } catch (e) { console.warn('Error subiendo imagen', e) }
      }
      if (fotoUrls.length > 0) {
        const { updateMachine } = await import('../lib/firebase')
        await updateMachine(machineId, { fotos: fotoUrls })
      }

      // Registrar en leads
      await addLead({
        maquinaNombre: `${f.tipo} ${f.marca} ${f.modelo} (${f.anio})`,
        comprador:     'Sistema',
        accion:        `✅ Publicada — ${matchingBuyers.length} compradores notificados por WA y email`,
        color:         '#22c55e',
      })

      alert(
        `✅ Máquina publicada a ${fmtPEN(pricing.ppublicado)}.\n` +
        `${matchingBuyers.length} comprador(es) serán notificados por WhatsApp y email.`
      )
      setTab('catalogo')
    } catch (e) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Registrar nueva máquina</h1>
        <p className="page-sub">
          Ingresa el precio del vendedor — el sistema calcula el precio de publicación automáticamente en soles
        </p>
      </div>

      {aiError && <div className="banner banner-err">⚠️ OpenAI: {aiError}</div>}

      <div className="grid2">

        {/* ─── COLUMNA IZQUIERDA ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="card">
            <div className="card-title">Datos de la máquina</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div className="inp-row">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="inp" value={f.tipo} onChange={set('tipo')}>
                    {MACHINE_TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Año</label>
                  <input className="inp inp-mono" type="number" min="1970" max="2030"
                         value={f.anio} onChange={set('anio')} />
                </div>
              </div>

              <div className="inp-row">
                <div className="form-group">
                  <label className="form-label">Marca</label>
                  <input className="inp" type="text" placeholder="SEW, Caterpillar…"
                         value={f.marca} onChange={set('marca')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo</label>
                  <input className="inp" type="text" placeholder="3 piñones, 320D…"
                         value={f.modelo} onChange={set('modelo')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estado operativo</label>
                <select className="inp" value={f.estado_op} onChange={set('estado_op')}>
                  <option>Operativo — sin observaciones</option>
                  <option>Operativo — requiere mantenimiento menor</option>
                  <option>No operativo — necesita reparación</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notas del vendedor</label>
                <textarea className="inp" rows={2}
                          placeholder="Horas trabajadas, historial, accesorios incluidos…"
                          value={f.notas} onChange={set('notas')} />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Descripción de venta <span className="ai-tag">✨ IA</span>
                  </label>
                  <button className="btn btn-ai btn-sm" onClick={runAI}
                          disabled={aiLoading || !f.marca || !f.modelo}>
                    {aiLoading ? <><span className="spinner" /> Generando…</> : '✨ Generar con IA'}
                  </button>
                </div>
                <textarea className="inp" rows={3}
                          placeholder="Descripción para el listing y notificaciones…"
                          value={f.descripcion} onChange={set('descripcion')} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Fotos</div>
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
              <div style={{ fontSize: 13 }}>Haz clic para agregar fotos</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
                Se subirán a Firebase Storage automáticamente
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple
                   style={{ display: 'none' }} onChange={handleFiles} />
            {imgs.length > 0 && (
              <div className="img-previews">
                {imgs.map((img, i) => (
                  <div key={i} className="img-preview-wrap">
                    <img src={img.url} alt="" />
                    <button className="img-remove"
                            onClick={() => setImgs(p => p.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── COLUMNA DERECHA ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Precio del vendedor */}
          <div className="card">
            <div className="card-title">Precio del vendedor (soles)</div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">¿Cuánto quiere recibir el vendedor?</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: 'var(--t3)'
                }}>S/</span>
                <input
                  className="inp inp-mono"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={f.pvendedor}
                  onChange={set('pvendedor')}
                  style={{ fontSize: 24, padding: '12px 14px 12px 44px', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Checkbox mantenimiento */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 13px',
                background: f.needsMaintenance ? 'var(--warnBg)' : 'var(--bg2)',
                border: `1px solid ${f.needsMaintenance ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all .15s',
              }}
              onClick={() => setF(p => ({ ...p, needsMaintenance: !p.needsMaintenance }))}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0, transition: 'all .15s',
                border: `2px solid ${f.needsMaintenance ? 'var(--amber)' : 'var(--border)'}`,
                background: f.needsMaintenance ? 'var(--amber)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {f.needsMaintenance && <span style={{ fontSize: 12, color: '#000', fontWeight: 700 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Requiere mantenimiento</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                  Agrega +10% al precio de publicación
                </div>
              </div>
            </div>
          </div>

          {/* Precio de publicación */}
          <div className="card">
            <div className="card-title">Precio de publicación</div>

            <div className="pricing-table">
              <div className="pricing-row">
                <span>Precio neto al vendedor</span>
                <span className="amount">{fmtPEN(pv)}</span>
              </div>
              <div className="pricing-row sub">
                <span>+ Marketing y publicidad (10%)</span>
                <span className="amount" style={{ color: 'var(--warn)' }}>
                  {fmtPEN(pricing.marketing)}
                </span>
              </div>
              {f.needsMaintenance && (
                <div className="pricing-row sub">
                  <span>+ Mantenimiento (10%)</span>
                  <span className="amount" style={{ color: 'var(--warn)' }}>
                    {fmtPEN(pricing.mantenimiento)}
                  </span>
                </div>
              )}
              <div className="pricing-row sub">
                <span>+ Utilidad (15%)</span>
                <span className="amount" style={{ color: 'var(--ok)' }}>
                  {fmtPEN(pricing.utilidad)}
                </span>
              </div>
              <div className="pricing-row" style={{
                background: 'var(--amberBg)',
                borderTop: '2px solid rgba(245,158,11,0.4)',
              }}>
                <span style={{ fontWeight: 700, color: 'var(--amberL)', fontSize: 14 }}>
                  = Precio de publicación
                </span>
                <span className="amount" style={{ color: 'var(--amber)', fontSize: 20 }}>
                  {fmtPEN(pricing.ppublicado)}
                </span>
              </div>
            </div>

            {pv > 0 && (
              <div style={{
                marginTop: 8, padding: '7px 12px',
                background: 'var(--bg2)', borderRadius: 'var(--r-md)',
                fontSize: 12, color: 'var(--t3)',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Tu ganancia: <strong style={{ color: 'var(--ok)' }}>{fmtPEN(pricing.marketing + pricing.mantenimiento + pricing.utilidad)}</strong></span>
                <span>Sobre precio del vendedor: <strong style={{ color: 'var(--t1)' }}>
                  +{pv > 0 ? ((pricing.ppublicado / pv - 1) * 100).toFixed(0) : 0}%
                </strong></span>
              </div>
            )}
          </div>

          {/* Notificación automática */}
          <div className="card">
            <div className="card-title">
              Notificación automática al publicar
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 700,
                color: '#25D366', background: 'rgba(37,211,102,0.1)',
                border: '1px solid rgba(37,211,102,0.2)',
                padding: '1px 7px', borderRadius: 20,
              }}>WhatsApp + Email</span>
            </div>

            <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 10, lineHeight: 1.6 }}>
              Se enviará desde <strong style={{ color: 'var(--t1)', fontFamily: 'var(--mono)' }}>
                📲 935211605
              </strong> a{' '}
              <strong style={{ color: matchingBuyers.length > 0 ? 'var(--ok)' : 'var(--err)' }}>
                {matchingBuyers.length} comprador{matchingBuyers.length !== 1 ? 'es' : ''}
              </strong>{' '}
              interesados en <strong style={{ color: 'var(--amber)' }}>{f.tipo}</strong>:
            </div>

            {/* Preview del mensaje */}
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid #25D366',
              borderRadius: 'var(--r-md)',
              padding: '12px 14px',
              fontSize: 12,
              color: 'var(--t2)',
              fontFamily: 'var(--mono)',
              lineHeight: 1.9,
              marginBottom: 12,
            }}>
              Hola [nombre], te contacta LumajiraHub 📞 935211605.<br />
              <br />
              ✅ Nuevo equipo disponible:<br />
              <span style={{ color: 'var(--t1)' }}>
                {f.tipo || '—'} {f.marca || '—'} {f.modelo || '—'} ({f.anio})
              </span><br />
              Estado: {f.estado_op}<br />
              💰 Precio:{' '}
              <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
                {fmtPEN(pricing.ppublicado)}
              </span><br />
              <br />
              ¿Te interesa? Escríbenos para coordinar una visita.
            </div>

            {/* Lista de compradores */}
            {matchingBuyers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {matchingBuyers.map(b => (
                  <div key={b.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 10px', background: 'var(--bg2)',
                    borderRadius: 'var(--r-sm)', fontSize: 12,
                  }}>
                    <div>
                      <span style={{ color: 'var(--t1)', fontWeight: 500 }}>{b.nombre}</span>
                      {b.empresa && <span style={{ color: 'var(--t3)' }}> · {b.empresa}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {b.telefono && (
                        <a
                          href={`https://wa.me/${b.telefono.replace(/\D/g, '')}?text=${waText(b.nombre)}`}
                          target="_blank" rel="noreferrer"
                          style={{
                            background: '#25D366', color: '#fff',
                            padding: '2px 9px', borderRadius: 20,
                            fontSize: 11, fontWeight: 700, textDecoration: 'none',
                          }}
                        >
                          WA
                        </a>
                      )}
                      {b.email && (
                        <a
                          href={`mailto:${b.email}?subject=Nuevo equipo: ${f.tipo} ${f.marca} ${f.modelo}&body=Hola ${b.nombre},%0A%0ANuevo equipo disponible en LumajiraHub:%0A${f.tipo} ${f.marca} ${f.modelo} (${f.anio})%0APrecio: ${fmtPEN(pricing.ppublicado)}%0A%0AContacto: 935211605`}
                          style={{
                            background: 'var(--infoBg)', color: 'var(--info)',
                            padding: '2px 9px', borderRadius: 20,
                            fontSize: 11, fontWeight: 700, textDecoration: 'none',
                          }}
                        >
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '10px 12px', background: 'var(--errBg)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--err)',
              }}>
                ⚠️ No hay compradores registrados para <strong>{f.tipo}</strong>.
                Agrégalos en la sección Compradores antes de publicar.
              </div>
            )}
          </div>

          {/* Botón de publicar */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', fontSize: 16 }}
            onClick={handleSubmit}
            disabled={saving || pv <= 0}
          >
            {saving
              ? <><span className="spinner" /> Publicando y notificando…</>
              : pricing.ppublicado > 0
              ? `✅ Publicar a ${fmtPEN(pricing.ppublicado)}`
              : '✅ Publicar máquina'
            }
          </button>
        </div>
      </div>
    </div>
  )
}