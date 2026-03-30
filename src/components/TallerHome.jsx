import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { SERVICES, DEBT_LIMIT_DAYS } from "../config";
import Nav from "./Nav";

export default function TallerHome({ ctx }) {
  const [tab, setTab]               = useState("orders");
  const [openOrders, setOpenOrders] = useState([]);
  const [myQuotes, setMyQuotes]     = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), where("status", "==", "open"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setOpenOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!ctx.user?.id) return;
    const q = query(collection(db, "quotes"), where("tallerId", "==", ctx.user.id), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setMyQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [ctx.user?.id]);

  useEffect(() => { ctx.refreshUser(); }, []);

  const tallerData   = ctx.user;
  const pendingDebts = (tallerData?.debts || []).filter((d) => !d.paid);
  const totalDebt    = pendingDebts.reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <Nav ctx={ctx} title="Panel Taller" />
      <div className="page-wide">
        {tallerData?.blocked && (
          <div className="alert-warn" style={{ marginBottom: 20, display: "flex", gap: 12 }}>
            <span style={{ fontSize: 22 }}>🚫</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Cuenta bloqueada</div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                Tu cuenta fue bloqueada automáticamente por tener deudas con más de {DEBT_LIMIT_DAYS} días sin pagar. Contacta al administrador.
              </div>
            </div>
          </div>
        )}
        {!tallerData?.blocked && pendingDebts.length > 0 && (
          <div className="alert-warn" style={{ marginBottom: 20 }}>
            ⚠️ Tienes <b>S/ {totalDebt.toFixed(2)}</b> en comisiones pendientes. Si superas {DEBT_LIMIT_DAYS} días sin pagar, tu cuenta será bloqueada automáticamente.
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Bienvenido, {ctx.user?.tallerName || ctx.user?.name}</div>
          <div className="section-sub">Gestiona pedidos y cotizaciones</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { key: "orders",   label: `Pedidos (${openOrders.length})` },
            { key: "myquotes", label: `Mis cotizaciones (${myQuotes.length})` },
            { key: "debts",    label: `Deudas (${pendingDebts.length})` },
          ].map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PEDIDOS ── */}
        {tab === "orders" && (
          loading ? (
            <div style={{ textAlign: "center", padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
          ) : openOrders.length === 0 ? (
            <div className="card" style={{ padding: 52, textAlign: "center", color: "#71717A" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              No hay pedidos disponibles aún
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {openOrders.map((order) => {
                const alreadySent = myQuotes.find((q) => q.orderId === order.id);
                const svc = SERVICES.find((s) => s.id === order.service);
                return (
                  <div key={order.id} className="card" style={{ padding: 24, borderLeft: `3px solid ${svc?.accent || "#F97316"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{order.brief?.titulo || order.serviceName}</div>
                        <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>
                          Por <b>{order.userName}</b> · {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("es-PE") : ""}
                        </div>
                      </div>
                      <span className="tag" style={{ background: "#1a1a2e", color: "#818cf8" }}>{order.serviceName}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.55, marginBottom: 12 }}>
                      {order.brief?.descripcion?.slice(0, 220)}{order.brief?.descripcion?.length > 220 ? "..." : ""}
                    </div>
                    {order.brief?.especificaciones && Object.keys(order.brief.especificaciones).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {Object.entries(order.brief.especificaciones).map(([k, v]) => (
                          <span key={k} className="tag">{k}: {v}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#71717A", marginBottom: 14 }}>
                      {order.brief?.cantidad      && <span>📦 {order.brief.cantidad}</span>}
                      {order.brief?.plazo_estimado && <span>📅 {order.brief.plazo_estimado}</span>}
                      {order.images?.length > 0   && <span>🖼️ {order.images.length} imagen(es)</span>}
                      {order.audio                && <span>🎙️ Audio</span>}
                      {order.cadFile              && <span style={{ color: "#60A5FA" }}>📐 {order.cadFile}</span>}
                    </div>
                    {alreadySent ? (
                      <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>✓ Cotización enviada</span>
                    ) : tallerData?.blocked ? (
                      <span style={{ fontSize: 13, color: "#fb923c" }}>⚠ Cuenta bloqueada</span>
                    ) : (
                      <button className="btn-primary" onClick={() => { ctx.setSelectedOrder(order); ctx.setView("orderDetail"); }}>
                        Enviar cotización →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── TAB: MIS COTIZACIONES ── */}
        {tab === "myquotes" && (
          myQuotes.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "#71717A" }}>
              Aún no has enviado cotizaciones
            </div>
          ) : myQuotes.map((q) => (
            <div key={q.id} className="card" style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{q.orderTitle || "Pedido"}</div>
                <span className={`badge ${q.status === "closed" ? "badge-closed" : "badge-pending"}`}>
                  {q.status === "closed" ? "✓ Cerrado" : "⏳ Pendiente"}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: "#A1A1AA", marginBottom: 10 }}>
                <span>💰 S/ {q.price}</span>
                <span>📍 {q.location}</span>
                <span>📅 {q.deliveryDate}</span>
              </div>
              {q.status !== "closed" && (
                <button className="btn-ghost btn-sm" onClick={() => {
                  const order = openOrders.find((o) => o.id === q.orderId);
                  if (order) {
                    ctx.setActiveChat({ chatId: `${q.orderId}_${q.tallerId}`, order, quote: q });
                    ctx.setView("chat");
                  } else {
                    ctx.showToast("El pedido ya fue cerrado", "err");
                  }
                }}>
                  💬 Chat con el cliente
                </button>
              )}
              {q.status === "closed" && (
                <div style={{ fontSize: 13, color: "#4ade80" }}>
                  Cerrado por S/ {q.dealAmount} · Comisión: S/ {(q.dealAmount * 0.05).toFixed(2)}
                </div>
              )}
            </div>
          ))
        )}

        {/* ── TAB: DEUDAS ── */}
        {tab === "debts" && (
          pendingDebts.length === 0 ? (
            <div className="alert-ok">✓ Sin deudas pendientes. ¡Estás al día!</div>
          ) : (
            <>
              <div className="alert-warn" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Total pendiente: S/ {totalDebt.toFixed(2)}</div>
                <div style={{ fontSize: 12 }}>Comisión del 5% sobre tratos cerrados. Contacta al administrador para regularizar.</div>
              </div>
              {pendingDebts.map((d) => {
                const daysOld = Math.floor((Date.now() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={d.id} className="card" style={{ padding: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `3px solid ${daysOld > DEBT_LIMIT_DAYS ? "#ef4444" : "#F97316"}` }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#F97316" }}>S/ {d.amount.toFixed(2)}</div>
                      <div style={{ fontSize: 12, color: "#71717A" }}>Generado el {new Date(d.date).toLocaleDateString("es-PE")}</div>
                      <div style={{ fontSize: 11, color: daysOld > DEBT_LIMIT_DAYS ? "#f87171" : "#71717A", marginTop: 2 }}>
                        {daysOld} días {daysOld > DEBT_LIMIT_DAYS ? ` ⚠️ Límite de ${DEBT_LIMIT_DAYS} días superado` : ""}
                      </div>
                    </div>
                    <span className="badge badge-pending">Pendiente</span>
                  </div>
                );
              })}
            </>
          )
        )}
      </div>
    </div>
  );
}
