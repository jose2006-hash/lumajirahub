import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot, orderBy,
  doc, getDoc, updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { SERVICES } from "../config";
import Nav from "./Nav";

// Convierte cualquier valor a string de forma segura
const safe = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

export default function MyOrders({ ctx }) {
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ctx.user?.id) return;
    const q = query(
      collection(db, "orders"),
      where("userId", "==", ctx.user.id),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [ctx.user?.id]);

  useEffect(() => {
    if (orders.length === 0) { setLoading(false); return; }
    const ids = orders.map((o) => o.id);
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
    let all = [];
    const unsubs = [];
    chunks.forEach((chunk) => {
      const q = query(collection(db, "quotes"), where("orderId", "in", chunk));
      unsubs.push(
        onSnapshot(q, (snap) => {
          const fresh = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          all = [...all.filter((q) => !chunk.includes(q.orderId)), ...fresh];
          setQuotes([...all]);
        })
      );
    });
    return () => unsubs.forEach((u) => u());
  }, [orders.length]);

  const closeDeal = async (quote) => {
    const amount = parseFloat(quote.price);
    const commission = +(amount * 0.05).toFixed(2);
    try {
      await updateDoc(doc(db, "quotes", quote.id), { status: "closed", dealAmount: amount });
      await updateDoc(doc(db, "orders", quote.orderId), { status: "closed" });
      const tSnap = await getDoc(doc(db, "profiles", quote.tallerId));
      if (tSnap.exists()) {
        const debts = tSnap.data().debts || [];
        await updateDoc(doc(db, "profiles", quote.tallerId), {
          debts: [
            ...debts,
            { id: `d${Date.now()}`, amount: commission, date: new Date().toISOString(), paid: false, orderId: quote.orderId },
          ],
        });
      }
      ctx.showToast(`¡Trato cerrado! Comisión 5% (S/ ${commission}) registrada.`);
    } catch (e) {
      ctx.showToast("Error: " + e.message, "err");
    }
  };

  const formatDate = (val) => {
    try {
      if (!val) return "";
      if (typeof val.toDate === "function") return val.toDate().toLocaleDateString("es-PE");
      if (typeof val === "string") return new Date(val).toLocaleDateString("es-PE");
      return "";
    } catch { return ""; }
  };

  const truncate = (val, max = 200) => {
    const str = typeof val === "string" ? val : safe(val);
    return str.length > max ? str.slice(0, max) + "..." : str;
  };

  return (
    <div>
      <Nav ctx={ctx} title="Mis Pedidos" />
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div className="section-title">Mis Pedidos</div>
            <div className="section-sub">{orders.length} pedido(s) publicado(s)</div>
          </div>
          <button className="btn-primary" onClick={() => ctx.setView("userHome")}>+ Nuevo pedido</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : orders.length === 0 ? (
          <div className="card" style={{ padding: 52, textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <div style={{ color: "#71717A", marginBottom: 16 }}>Aún no tienes pedidos publicados.</div>
            <button className="btn-primary" onClick={() => ctx.setView("userHome")}>Publicar mi primer pedido</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {orders.map((order) => {
              const myQ = quotes.filter((q) => q.orderId === order.id);
              const svc = SERVICES.find((s) => s.id === order.service);
              const titulo = safe(order.brief?.titulo || order.serviceName);
              const descripcion = truncate(order.brief?.descripcion);
              return (
                <div key={order.id} className="card" style={{ padding: 24, borderLeft: `3px solid ${svc?.accent || "#F97316"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{titulo}</div>
                      <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>
                        <span className="tag" style={{ marginRight: 8 }}>{safe(order.serviceName)}</span>
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <span className={`badge ${order.status === "open" ? "badge-open" : "badge-closed"}`}>
                      {order.status === "open" ? "● Abierto" : "✓ Cerrado"}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.55, marginBottom: 14 }}>
                    {descripcion}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {order.images?.length > 0 && <span style={{ fontSize: 12, color: "#52525B" }}>🖼️ {order.images.length} imagen(es)</span>}
                    {order.audio && <span style={{ fontSize: 12, color: "#52525B" }}>🎙️ {safe(order.audio)}</span>}
                    {order.cadFile && <span style={{ fontSize: 12, color: "#60A5FA" }}>📐 {safe(order.cadFile)}</span>}
                  </div>

                  {myQ.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#F97316", marginBottom: 12 }}>
                        💼 {myQ.length} cotización(es) recibida(s)
                      </div>
                      {myQ.map((q) => (
                        <div key={q.id} className="card" style={{ padding: 18, marginBottom: 10, background: "#0F0F11" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ fontWeight: 700 }}>🏭 {safe(q.tallerName)}</div>
                            <span className={`badge ${q.status === "closed" ? "badge-closed" : "badge-pending"}`}>
                              {q.status === "closed" ? "✓ Trato cerrado" : "⏳ Pendiente"}
                            </span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: "#A1A1AA", marginBottom: 12 }}>
                            <span>💰 S/ {safe(q.price)}</span>
                            <span>📍 {safe(q.location)}</span>
                            <span>📅 {safe(q.deliveryDate)}</span>
                          </div>
                          {q.notes && <div style={{ fontSize: 12, color: "#71717A", marginBottom: 12 }}>{safe(q.notes)}</div>}
                          {q.status !== "closed" && order.status === "open" && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn-ghost btn-sm" onClick={() => {
                                ctx.setActiveChat({ chatId: `${order.id}_${q.tallerId}`, order, quote: q });
                                ctx.setView("chat");
                              }}>
                                💬 Chatear con el taller
                              </button>
                              <button className="btn-success" onClick={() => closeDeal(q)}>
                                ✓ Cerrar trato — S/ {safe(q.price)}
                              </button>
                            </div>
                          )}
                          {q.status === "closed" && (
                            <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>
                              ✓ Trato cerrado por S/ {safe(q.dealAmount)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#3F3F46" }}>⏳ Esperando cotizaciones de talleres...</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}