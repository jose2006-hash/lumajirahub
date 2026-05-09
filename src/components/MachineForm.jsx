import { useState, useRef } from 'react'
import { addMachine, addLead, uploadMachineImage } from '../lib/firebase'
import { generateDescription, estimateMaintenanceCost, suggestMarketPrice } from '../lib/openai'
import { calcPricing, checkViability, fmtUSD, MACHINE_TIPOS } from '../utils/pricing'

const DEF = {
  tipo:'Excavadora',marca:'',modelo:'',anio: new Date().getFullYear()-3,
  estado_op:'Operativo — sin observaciones',descripcion:'',notas:'',
  pvendedor:0,pmercado:0,duracion:90,
  ctransporte:400,cinspeccion:100,cmantenimiento:500,cmarketing:50,
  comisionPct:5,utilidadObjetivo:1950,bufferPct:8,margenMinimo:1500,
}

export default function MachineForm({ setTab }) {
  const [f,    setF]    = useState(DEF)
  const [imgs, setImgs] = useState([])
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState('')
  const [aiError,   setAiError]   = useState('')
  const fileRef = useRef()

  const set = k => e => setF(p => ({ ...p, [k]: ['pvendedor','pmercado','duracion','ctransporte','cinspeccion','cmantenimiento','cmarketing','comisionPct','utilidadObjetivo','bufferPct','margenMinimo','anio'].includes(k) ? parseFloat(e.target.value)||0 : e.target.value }))

  const pricing  = calcPricing(f)
  const viability = checkViability({ ppublicado: pricing.ppublicado, pmercado: f.pmercado, margenReal: pricing.margenReal, margenMinimo: f.margenMinimo })

  const handleFiles = e => {
    const files = Array.from(e.target.files)
    const previews = files.map(file => ({ file, url: URL.createObjectURL(file) }))
    setImgs(p => [...p, ...previews])
  }

  const removeImg = i => setImgs(p => p.filter((_, j) => j !== i))

  const runAI = async (type) => {
    setAiLoading(type); setAiError('')
    try {
      if (type === 'desc') {
        const d = await generateDescription({ tipo:f.tipo, marca:f.marca, modelo:f.modelo, anio:f.anio, estado_op:f.estado_op, notas:f.notas })
        setF(p => ({ ...p, descripcion: d }))
      } else if (type === 'mant') {
        const c = await estimateMaintenanceCost({ tipo:f.tipo, marca:f.marca, modelo:f.modelo, anio:f.anio })
        setF(p => ({ ...p, cmantenimiento: c }))
      } else if (type === 'market') {
        const c = await suggestMarketPrice({ tipo:f.tipo, marca:f.marca, modelo:f.modelo, anio:f.anio })
        setF(p => ({ ...p, pmercado: c }))
      }
    } catch(e) { setAiError(e.message) }
    setAiLoading('')
  }

  const handleSubmit = async () => {
    if (!f.marca.trim() || !f.modelo.trim()) { alert('Completa Marca y Modelo'); return }
    if (f.pvendedor <= 0) { alert('Ingresa el precio neto al vendedor'); return }
    setSaving(true)
    try {
      const estado = viability.status === 'ok' ? 'Publicada' : 'Registrada'
      const docData = {
        ...f, ...pricing,
        estado, fotos: [],
        createdAt: new Date().toISOString(),
      }
      const ref = await addMachine(docData)
      const machineId = ref.id

      // Upload images
      const fotoUrls = []
      for (const img of imgs) {
        try {
          const url = await uploadMachineImage(img.file, machineId)
          fotoUrls.push(url)
        } catch(e) { console.warn('Error subiendo imagen', e) }
      }
      if (fotoUrls.length > 0) {
        const { updateMachine } = await import('../lib/firebase')
        await updateMachine(machineId, { fotos: fotoUrls })
      }

      await addLead({
        maquinaNombre: `${f.tipo} ${f.marca} ${f.modelo} (${f.anio})`,
        comprador: 'Sistema',
        accion: estado === 'Publicada' ? '✅ Publicada automáticamente — compradores notificados' : '📋 Registrada pendiente de revisión',
        color: estado === 'Publicada' ? '#22c55e' : '#f59e0b',
      })

      alert(estado === 'Publicada'
        ? '✅ ¡Máquina publicada! Los compradores serán notificados.'
        : '⚠️ Máquina registrada. Requiere revisión antes de publicar.')
      setTab('catalogo')
    } catch(e) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  const PRow = ({ label, amount, className='', style={} }) => (
    <div className={`pricing-row ${className}`} style={style}>
      <span>{label}</span><span className="amount">{fmtUSD(amount)}</span>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Registrar nueva máquina</h1>
        <p className="page-sub">El motor de pricing calculará viabilidad antes de publicar</p>
      </div>
      {aiError && <div className="banner banner-err">⚠️ OpenAI: {aiError}</div>}

      <div className="grid2">
        {/* LEFT: Machine data */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="card">
            <div className="card-title">Datos de la máquina</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="inp-row">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="inp" value={f.tipo} onChange={set('tipo')}>
                    {MACHINE_TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Año</label>
                  <input className="inp inp-mono" type="number" min="1980" max="2025" value={f.anio} onChange={set('anio')} />
                </div>
              </div>
              <div className="inp-row">
                <div className="form-group">
                  <label className="form-label">Marca</label>
                  <input className="inp" type="text" placeholder="Caterpillar, Komatsu…" value={f.marca} onChange={set('marca')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo</label>
                  <input className="inp" type="text" placeholder="320D, D65…" value={f.modelo} onChange={set('modelo')} />
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
                <textarea className="inp" placeholder="Horas, historial, accesorios…" value={f.notas} onChange={set('notas')} />
              </div>
              <div className="form-group">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                  <label className="form-label">Descripción de venta <span className="ai-tag">✨ IA</span></label>
                  <button className="btn btn-ai btn-sm" onClick={() => runAI('desc')} disabled={aiLoading==='desc'||!f.marca||!f.modelo}>
                    {aiLoading==='desc' ? <><span className="spinner" /> Generando…</> : '✨ Generar con IA'}
                  </button>
                </div>
                <textarea className="inp" rows={4} placeholder="Descripción para el listing…" value={f.descripcion} onChange={set('descripcion')} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Fotos</div>
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              <div style={{fontSize:28,marginBottom:6}}>📷</div>
              <div style={{fontSize:13}}>Haz clic o arrastra las fotos aquí</div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:4}}>JPG, PNG — se subirán a Firebase Storage</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleFiles} />
            {imgs.length > 0 && (
              <div className="img-previews">
                {imgs.map((img, i) => (
                  <div key={i} className="img-preview-wrap">
                    <img src={img.url} alt={`foto ${i+1}`} />
                    <button className="img-remove" onClick={() => removeImg(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Acuerdo de consignación</div>
            <div className="form-group">
              <label className="form-label">Duración del acuerdo (días)</label>
              <input className="inp inp-mono" type="number" min="30" max="365" value={f.duracion} onChange={set('duracion')} />
            </div>
          </div>
        </div>

        {/* RIGHT: Pricing engine */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="card">
            <div className="card-title">Motor de pricing</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="form-group">
                <label className="form-label">Precio neto al vendedor (USD)</label>
                <input className="inp inp-mono" type="number" min="0" value={f.pvendedor} onChange={set('pvendedor')} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <label className="form-label" style={{margin:0}}>Precio referencial de mercado (USD) <span className="ai-tag">✨ IA</span></label>
                <button className="btn btn-ai btn-sm" onClick={() => runAI('market')} disabled={aiLoading==='market'||!f.marca||!f.modelo}>
                  {aiLoading==='market' ? <span className="spinner" /> : '🤖 Estimar'}
                </button>
              </div>
              <input className="inp inp-mono" type="number" min="0" value={f.pmercado} onChange={set('pmercado')} placeholder="0 = sin validación de mercado" />

              <div className="divider" style={{margin:'4px 0'}} />

              <div className="inp-row">
                <div className="form-group">
                  <label className="form-label">Transporte</label>
                  <input className="inp inp-mono" type="number" min="0" value={f.ctransporte} onChange={set('ctransporte')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Inspección</label>
                  <input className="inp inp-mono" type="number" min="0" value={f.cinspeccion} onChange={set('cinspeccion')} />
                </div>
              </div>
              <div className="inp-row">
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <label className="form-label" style={{margin:0}}>Mantenimiento</label>
                    <button className="btn btn-ai btn-sm" style={{fontSize:10,padding:'3px 8px'}} onClick={() => runAI('mant')} disabled={aiLoading==='mant'||!f.marca||!f.modelo}>
                      {aiLoading==='mant' ? <span className="spinner" /> : '🤖 IA'}
                    </button>
                  </div>
                  <input className="inp inp-mono" type="number" min="0" value={f.cmantenimiento} onChange={set('cmantenimiento')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Marketing</label>
                  <input className="inp inp-mono" type="number" min="0" value={f.cmarketing} onChange={set('cmarketing')} />
                </div>
              </div>
              <div className="inp-row">
                <div className="form-group">
                  <label className="form-label">Comisión (%)</label>
                  <input className="inp inp-mono" type="number" min="0" max="30" value={f.comisionPct} onChange={set('comisionPct')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Utilidad objetivo</label>
                  <input className="inp inp-mono" type="number" min="0" value={f.utilidadObjetivo} onChange={set('utilidadObjetivo')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Buffer de negociación: <span style={{color:'var(--amber)',fontFamily:'var(--mono)'}}>{f.bufferPct}%</span></label>
                <div className="range-wrap">
                  <input type="range" min="0" max="25" step="1" value={f.bufferPct} onChange={set('bufferPct')} />
                  <span className="range-val">{f.bufferPct}%</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Margen mínimo aceptable (USD)</label>
                <input className="inp inp-mono" type="number" min="0" value={f.margenMinimo} onChange={set('margenMinimo')} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Resultado del cálculo</div>
            <div className="pricing-table">
              <PRow label="Precio neto al vendedor"         amount={f.pvendedor} />
              <PRow label="+ Costos fijos (transp+insp+mant+mkt)" amount={pricing.costosFijos} className="sub" />
              <PRow label="+ Comisión"                     amount={pricing.comisionMonto} className="sub" />
              <PRow label="+ Utilidad objetivo"            amount={f.utilidadObjetivo} className="sub" />
              <PRow label="= Precio mínimo de venta"       amount={pricing.pminimo} className="total" />
              <PRow label={`+ Buffer negociación (${f.bufferPct}%)`} amount={pricing.bufferMonto} className="profit" />
              <PRow label="= Precio publicado"             amount={pricing.ppublicado} className="pub" />
              {f.pmercado > 0 && <PRow label="Referencial de mercado" amount={f.pmercado} />}
            </div>
            <div className={`viability ${viability.status}`}>
              <span style={{fontSize:16}}>{viability.status==='ok'?'✅':viability.status==='warn'?'⚠️':'❌'}</span>
              <span>{viability.msg}</span>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="spinner" /> Guardando…</> : viability.status === 'ok' ? '✅ Registrar y publicar' : '📋 Registrar (pendiente revisión)'}
          </button>
        </div>
      </div>
    </div>
  )
}
