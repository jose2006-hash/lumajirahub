import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { buyersQuery, addBuyer, deleteBuyer } from '../lib/firebase'
import { MACHINE_TIPOS, fmtUSD } from '../utils/pricing'

const DEF = { nombre:'', empresa:'', telefono:'', email:'', tipos:[], presupuesto:0, notas:'' }

export default function BuyerCRM() {
  const { data: buyers, loading, error } = useCollection(buyersQuery)
  const [showForm, setShowForm] = useState(false)
  const [f, setF] = useState(DEF)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const set = k => e => setF(p => ({ ...p, [k]: k==='presupuesto' ? parseFloat(e.target.value)||0 : e.target.value }))

  const toggleTipo = tipo => setF(p => ({
    ...p,
    tipos: p.tipos.includes(tipo) ? p.tipos.filter(t => t !== tipo) : [...p.tipos, tipo]
  }))

  const handleAdd = async () => {
    if (!f.nombre.trim()) { alert('Ingresa el nombre'); return }
    setSaving(true)
    try { await addBuyer(f); setF(DEF); setShowForm(false) }
    catch(e) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  const ini = n => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2)

  const filtered = buyers.filter(b =>
    !search || [b.nombre, b.empresa, b.email].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  if (error) return <div className="banner banner-err">⚠️ {error}</div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">CRM de compradores</h1>
        <p className="page-sub">Base de datos segmentada por tipo de maquinaria</p>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <input className="inp" style={{maxWidth:280}} placeholder="Buscar por nombre, empresa…" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancelar' : '+ Agregar comprador'}
        </button>
        <span style={{marginLeft:'auto',fontSize:12,color:'var(--t3)'}}>{filtered.length} compradores</span>
      </div>

      {showForm && (
        <div className="card section-gap">
          <div className="card-title">Nuevo comprador</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div className="inp-row">
              <div className="form-group"><label className="form-label">Nombre *</label><input className="inp" placeholder="Juan Pérez" value={f.nombre} onChange={set('nombre')} /></div>
              <div className="form-group"><label className="form-label">Empresa</label><input className="inp" placeholder="Constructora XYZ" value={f.empresa} onChange={set('empresa')} /></div>
            </div>
            <div className="inp-row">
              <div className="form-group"><label className="form-label">WhatsApp</label><input className="inp" placeholder="+51 999 888 777" value={f.telefono} onChange={set('telefono')} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="inp" placeholder="juan@empresa.com" value={f.email} onChange={set('email')} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Tipos de máquina de interés</label>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:6}}>
                {MACHINE_TIPOS.map(t => (
                  <button key={t} className={`filter-chip${f.tipos.includes(t)?' active':''}`} onClick={() => toggleTipo(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Presupuesto máximo (USD)</label>
              <input className="inp inp-mono" type="number" min="0" value={f.presupuesto||''} onChange={set('presupuesto')} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea className="inp" placeholder="Preferencias, urgencia, proyectos…" value={f.notas} onChange={set('notas')} />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? <><span className="spinner" /> Guardando…</> : '✓ Guardar comprador'}
              </button>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setF(DEF) }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div style={{textAlign:'center',padding:'40px'}}><div className="spinner" style={{margin:'0 auto'}} /></div> :
       filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{fontSize:40,marginBottom:12}}>👥</div>
          <p>{search ? 'No se encontraron compradores' : 'No hay compradores registrados aún'}</p>
        </div>
       ) : (
        <div className="buyers-list">
          {filtered.map(b => (
            <div key={b.id} className="buyer-card">
              <div className="avatar">{ini(b.nombre)}</div>
              <div className="buyer-info">
                <div className="buyer-name">{b.nombre}</div>
                <div className="buyer-company">
                  {b.empresa && <span>{b.empresa}</span>}
                  {b.telefono && <> · <a href={`https://wa.me/${b.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{color:'#25D366'}}>WhatsApp</a></>}
                  {b.email && <> · <a href={`mailto:${b.email}`} style={{color:'var(--info)'}}>{b.email}</a></>}
                </div>
                <div className="buyer-tags">
                  {(b.tipos||[]).map(t => <span key={t} className="tag">{t}</span>)}
                  {b.presupuesto > 0 && <span className="tag tag-ok">hasta {fmtUSD(b.presupuesto)}</span>}
                </div>
                {b.notas && <div style={{fontSize:12,color:'var(--t3)',marginTop:6}}>{b.notas}</div>}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {b.telefono && (
                  <a href={`https://wa.me/${b.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📲 WA</a>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => confirm('¿Eliminar comprador?') && deleteBuyer(b.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
