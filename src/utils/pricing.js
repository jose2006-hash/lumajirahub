export function calcPricing({ pvendedor=0, ctransporte=0, cinspeccion=0, cmantenimiento=0, cmarketing=0, comisionPct=5, utilidadObjetivo=0, bufferPct=8 }) {
  const costosFijos   = ctransporte + cinspeccion + cmantenimiento + cmarketing
  const basePrice     = pvendedor + costosFijos + utilidadObjetivo
  const comisionMonto = basePrice * (comisionPct / 100)
  const pminimo       = basePrice + comisionMonto
  const ppublicado    = Math.round(pminimo * (1 + bufferPct / 100))
  const margenReal    = ppublicado - pvendedor - costosFijos - comisionMonto
  return { costosFijos: Math.round(costosFijos), comisionMonto: Math.round(comisionMonto), pminimo: Math.round(pminimo), ppublicado, margenReal: Math.round(margenReal), bufferMonto: ppublicado - Math.round(pminimo) }
}

export function checkViability({ ppublicado, pmercado, margenReal, margenMinimo }) {
  if (pmercado > 0 && ppublicado > pmercado * 0.98)
    return { status: 'no',   msg: `Precio publicado ($${fmt(ppublicado)}) supera el mercado ($${fmt(pmercado)}). Deal inviable.` }
  if (margenReal < margenMinimo)
    return { status: 'warn', msg: `Margen $${fmt(margenReal)} por debajo del mínimo $${fmt(margenMinimo)}. Revisar costos.` }
  return   { status: 'ok',   msg: `Deal viable — margen $${fmt(margenReal)}. Se publicará automáticamente. ✓` }
}

const fmt = n => Number(n).toLocaleString('en-US')
export const fmtUSD = n => `$${Number(n||0).toLocaleString('en-US')}`

/** Tipos sugeridos (compradores y registro de máquina); siempre se puede escribir uno distinto. */
export const MACHINE_TIPOS = [
  'Excavadora', 'Retroexcavadora', 'Grúa', 'Compactadora', 'Bulldozer',
  'Cargador frontal', 'Montacargas', 'Motoniveladora', 'Perforadora',
  'Torno', 'Fresadora', 'Camión minero',
]

/** Motores — misma lista `tipos` del comprador; cruce con tipo al publicar máquina. */
export const MOTOR_TIPOS = [
  'Motor diésel',
  'Motor gasolina',
  'Motor eléctrico',
  'Motor marino',
  'Motor industrial estacionario',
  'Grupo electrógeno',
  'Turbo / turbocompresor',
]

/** Presets que no deben mostrarse como “solo manual” en el formulario comprador. */
export const ALL_BUYER_PRESET_TIPOS = [...MACHINE_TIPOS, ...MOTOR_TIPOS]

export function normalizeTipo(s) {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Cruza interés del comprador con el tipo de máquina publicado (incluye variantes tipo "Torno" vs "Torno paralelo"). */
export function tiposCoinciden(buyerTag, machineTipo) {
  const a = normalizeTipo(buyerTag)
  const b = normalizeTipo(machineTipo)
  if (!a || !b) return false
  if (a === b) return true
  if (a.length >= 3 && b.includes(a)) return true
  if (b.length >= 3 && a.includes(b)) return true
  return false
}

export function buyerMatchesMachineTipo(buyer, machineTipo) {
  return (buyer.tipos || []).some((bt) => tiposCoinciden(bt, machineTipo))
}

export const ESTADO_CONFIG = {
  'Registrada':      { color:'#6b7280', bg:'rgba(107,114,128,0.12)', next:'Publicada' },
  'Publicada':       { color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  next:'Con leads' },
  'Con leads':       { color:'#60a5fa', bg:'rgba(96,165,250,0.12)',  next:'En negociación' },
  'En negociación':  { color:'#a78bfa', bg:'rgba(167,139,250,0.12)', next:'Vendida' },
  'Vendida':         { color:'#22c55e', bg:'rgba(34,197,94,0.12)',   next:null },
  'Retirada':        { color:'#ef4444', bg:'rgba(239,68,68,0.12)',   next:null },
}

export function timeAgo(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = (Date.now() - d.getTime()) / 1000
  if (s < 60)    return 'ahora'
  if (s < 3600)  return `hace ${Math.round(s/60)}m`
  if (s < 86400) return `hace ${Math.round(s/3600)}h`
  return `hace ${Math.round(s/86400)}d`
}
