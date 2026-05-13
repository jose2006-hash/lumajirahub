/**
 * emailService.js — Notificaciones automáticas por email usando EmailJS
 *
 * SETUP (una sola vez):
 * 1. Crea cuenta gratis en https://www.emailjs.com
 * 2. "Add New Service" → Gmail → conecta aynitek.group@gmail.com
 *    Anota el Service ID (ej. service_abc123)
 * 3. "Create New Template" → copia el HTML de abajo como cuerpo
 *    Anota el Template ID (ej. template_xyz789)
 * 4. Ve a Account → API Keys → copia la Public Key
 * 5. Agrega al .env:
 *       VITE_EMAILJS_SERVICE_ID=service_abc123
 *       VITE_EMAILJS_TEMPLATE_ID=template_xyz789
 *       VITE_EMAILJS_PUBLIC_KEY=tu_public_key
 *
 * TEMPLATE HTML sugerido en EmailJS (pégalo en el cuerpo del template):
 * -----------------------------------------------------------------------
 *   Hola {{to_name}},
 *
 *   Nuevo equipo disponible en LumajiraHub:
 *
 *   Máquina : {{tipo}} {{marca}} {{modelo}} ({{anio}})
 *   Estado  : {{estado}}
 *   Precio  : {{precio}}
 *
 *   ¿Te interesa? Escríbenos: aynitek.group@gmail.com | 935211605
 *
 *   — Equipo LumajiraHub
 * -----------------------------------------------------------------------
 *  Variables del template: to_name, to_email, tipo, marca, modelo,
 *                          anio, estado, precio, empresa
 */

import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

/**
 * Envía un email a un comprador notificándole de una nueva máquina.
 * @param {{ buyer, tipo, marca, modelo, anio, estado_op, precio }} params
 * @returns {Promise}
 */
export async function sendMachineEmail({ buyer, tipo, marca, modelo, anio, estado_op, precio }) {
  if (!buyer.email) return null           // sin email, skip
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[EmailJS] Faltan variables VITE_EMAILJS_* en .env — email omitido')
    return null
  }

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_name:  buyer.nombre,
      to_email: buyer.email,
      empresa:  buyer.empresa || '',
      tipo,
      marca,
      modelo,
      anio,
      estado:   estado_op,
      precio,
    },
    PUBLIC_KEY,
  )
}

/**
 * Envía emails a todos los compradores de la lista.
 * Devuelve { sent: number, failed: number }
 */
export async function notifyAllBuyers({ buyers, tipo, marca, modelo, anio, estado_op, precio }) {
  let sent = 0, failed = 0

  for (const buyer of buyers) {
    if (!buyer.email) continue
    try {
      await sendMachineEmail({ buyer, tipo, marca, modelo, anio, estado_op, precio })
      sent++
    } catch (err) {
      console.warn(`[EmailJS] No se pudo enviar a ${buyer.email}:`, err)
      failed++
    }
  }

  return { sent, failed }
}
