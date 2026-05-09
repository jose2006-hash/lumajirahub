const BASE  = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

async function chat(system, user, maxTokens = 250) {
  const key = import.meta.env.VITE_OPENAI_API_KEY
  if (!key || key.startsWith('sk-your')) throw new Error('VITE_OPENAI_API_KEY no configurada')
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role:'system', content: system }, { role:'user', content: user }] }),
  })
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.error?.message || `OpenAI ${res.status}`) }
  return (await res.json()).choices?.[0]?.message?.content?.trim() || ''
}

export async function generateDescription({ tipo, marca, modelo, anio, estado_op, notas }) {
  return chat(
    'Eres experto en ventas de maquinaria industrial. Redactas descripciones atractivas en español. Sin bullets, prosa fluida.',
    `Descripción de venta (máx 120 palabras): ${tipo} ${marca} ${modelo} ${anio}\nEstado: ${estado_op}\nNotas: ${notas||'—'}\nDestaca confiabilidad, valor y beneficios para el comprador industrial.`,
    220
  )
}

export async function estimateMaintenanceCost({ tipo, marca, modelo, anio }) {
  const raw = await chat(
    'Eres mecánico industrial. Estimas costos de mantenimiento pre-venta. Responde SOLO un número entero USD, sin texto.',
    `Costo mantenimiento básico pre-reventa: ${tipo} ${marca} ${modelo} ${anio} (filtros, lubricantes, ajustes, limpieza)`,
    10
  )
  const n = parseInt(raw.replace(/\D/g,''))
  return isNaN(n) ? 500 : n
}

export async function suggestMarketPrice({ tipo, marca, modelo, anio }) {
  const raw = await chat(
    'Eres tasador de maquinaria industrial Latinoamérica. Responde SOLO un número entero USD, sin texto.',
    `Precio mercado estimado (buen estado): ${tipo} ${marca} ${modelo} ${anio} en Perú/Latinoamérica`,
    10
  )
  const n = parseInt(raw.replace(/\D/g,''))
  return isNaN(n) ? 0 : n
}

export async function generateWhatsAppMessage({ machine, buyerName }) {
  return chat(
    'Eres asesor de ventas de maquinaria industrial. Mensajes WhatsApp profesionales y concisos en español. Máx 80 palabras.',
    `Notifica a ${buyerName} sobre: ${machine.tipo} ${machine.marca} ${machine.modelo} (${machine.anio})\nPrecio: $${Number(machine.ppublicado||0).toLocaleString('en-US')} USD\nEstado: ${machine.estado_op||'Operativo'}\nIncluye saludo, datos clave y CTA para agendar visita.`,
    160
  )
}
