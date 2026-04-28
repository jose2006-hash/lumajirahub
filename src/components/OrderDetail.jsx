import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { serviceForOrder } from "../config";
import Nav from "./Nav";

export default function OrderDetail({ ctx }) {
  const order = ctx.selectedOrder;
  const [f, setF]       = useState({ price: "", location: "", deliveryDate: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  if (!order) return null;
  const svc = serviceForOrder(order);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.price || !f.location || !f.deliveryDate) {
      ctx.showToast("Completa precio, ubicación y fecha", "err");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "quotes"), {
        orderId: order.id,
        tallerId: ctx.user.id,
        tallerName: ctx.user.tallerName || ctx.user.name,
        orderTitle: order.brief?.titulo || order.serviceName,
        price: f.price,
        location: f.location,
        deliveryDate: f.deliveryDate,
        notes: f.notes,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      ctx.showToast("¡Cotización enviada al cliente!");
      ctx.setView("tallerHome");
    } catch (e) {
      ctx.showToast("Error: " + e.message, "err");
    }
    setLoading(false);
  };

  return (
    <div>
      <Nav ctx={ctx} title="Cotizar pedido" showBack />
      <div className="page" style={{ maxWidth: 700 }}>
        {/* Brief del pedido */}
        <div className="card" style={{ padding: 26, marginBottom: 20, borderLeft: `3px solid ${svc?.accent || "#F97316"}` }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{order.brief?.titulo || order.serviceName}</div>
          <div style={{ fontSize: 13, color: "#71717A", marginBottom: 14 }}>Publicado por <b>{order.userName}</b></div>
          <div style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.6, marginBottom: 14 }}>{order.brief?.descripcion}</div>
          {order.brief?.especificaciones && Object.keys(order.brief.especificaciones).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {Object.entries(order.brief.especificaciones).map(([k, v]) => (
                <span key={k} className="tag">{k}: {v}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13, color: "#71717A", marginBottom: order.cadFile ? 12 : 0 }}>
            {order.brief?.cantidad              && <span>📦 {order.brief.cantidad} und.</span>}
            {order.brief?.plazo_estimado        && <span>📅 {order.brief.plazo_estimado}</span>}
            {order.brief?.presupuesto_referencial && <span>💰 Ref: {order.brief.presupuesto_referencial}</span>}
          </div>
          {order.cadFile && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, background: "#0F0F11", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 16 }}>📐</span>
              <span style={{ fontSize: 12, color: "#60A5FA", fontWeight: 600 }}>Archivo CAD adjunto:</span>
              <span style={{ fontSize: 12, color: "#A1A1AA" }}>{order.cadFile}</span>
            </div>
          )}
        </div>

        {/* Formulario de cotización */}
        <div className="card" style={{ padding: 26 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Tu cotización</div>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">Precio total (S/)</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="Ej: 450.00" value={f.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label className="label">Ubicación del taller</label>
              <input className="input" placeholder="Ej: San Miguel, Lima" value={f.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha de entrega estimada</label>
              <input className="input" type="date" value={f.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} />
            </div>
            <div>
              <label className="label">Notas adicionales</label>
              <textarea className="input" rows={3} placeholder="Materiales incluidos, condiciones, garantía..." value={f.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div style={{ fontSize: 12, color: "#52525B", lineHeight: 1.5 }}>
              ⚠️ Al cerrar un trato se registrará una comisión del 5% del monto acordado.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: "12px 20px" }} disabled={loading}>
                {loading ? <span className="spinner" /> : "Enviar cotización →"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => ctx.setView("tallerHome")}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
