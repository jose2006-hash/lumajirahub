// ================================================================
// SERVICIOS — MVP: solo Metalmecánica
// ================================================================
export const SERVICES = [
  {
    id: "metalmecanica",
    label: "Metalmecánica",
    icon: "⚙",
    desc: "Reparación y fabricación de piezas — torno, fresa, soldadura y mecanizado",
    accent: "#FF6B35",
  },
];

/** Servicio visual para un pedido (pedidos antiguos caen al servicio actual). */
export function serviceForOrder(order) {
  if (!order) return SERVICES[0];
  return SERVICES.find((s) => s.id === order.service) ?? SERVICES[0];
}

export const ADMIN_CREDS    = { email: "admin@lumajirahub.com", password: "lumaadmin2024" };
export const DEBT_LIMIT_DAYS = 30;
export const CAD_ACCEPT      = ".pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.sldprt,.sldasm";