import { useState, useEffect } from "react";
import {
  collection, query, where, getDocs, doc, updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import Nav from "./Nav";

export default function Admin({ ctx }) {
  const [tab, setTab]                   = useState("users");
  const [users, setUsers]               = useState([]);
  const [talleres, setTalleres]         = useState([]);
  const [orders, setOrders]             = useState([]);
  const [closedQuotes, setClosedQuotes] = useState([]);
  const [loading, setLoading]           = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [uSnap, tSnap, oSnap, qSnap] = await Promise.all([
      getDocs(query(collection(db, "profiles"), where("type", "==", "usuario"))),
      getDocs(query(collection(db, "profiles"), where("type", "==", "taller"))),
      getDocs(collection(db, "orders")),
      getDocs(query(collection(db, "quotes"), where("status", "==", "closed"))),
    ]);
    setUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setTalleres(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setOrders(oSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setClosedQuotes(qSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const toggleBlock = async (t) => {
    const newVal = !t.blocked;
    await updateDoc(doc(db, "profiles", t.id), { blocked: newVal });
    setTalleres((p) => p.map((x) => (x.id === t.id ? { ...x, blocked: newVal } : x)));
    ctx.showToast(newVal ? "Taller bloqueado." : "Taller habilitado.");
  };

  const markDebtPaid = async (tallerId, debtId) => {
    const taller = talleres.find((t) => t.id === tallerId);
    if (!taller) return;
    const updDebts = (taller.debts || []).map((d) => (d.id === debtId ? { ...d, paid: true } : d));
    const allPaid  = updDebts.filter((d) => !d.paid).length === 0;
    await updateDoc(doc(db, "profiles", tallerId), { debts: updDebts, ...(allPaid ? { blocked: false } : {}) });
    setTalleres((p) => p.map((t) => (t.id === tallerId ? { ...t, debts: updDebts, ...(allPaid ? { blocked: false } : {}) } : t)));
    ctx.showToast("Deuda pagada" + (allPaid ? " — taller desbloqueado." : "."));
  };

  const totalCommission = talleres.flatMap((t) => t.debts || []).reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <Nav ctx={ctx} title="Admin" />
      <div className="page-wide">
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <div className="section-title">Panel de Administración</div>
                <div className="section-sub">LumajiraHub — gestión completa de la plataforma</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost btn-sm" onClick={loadAll}>↻ Actualizar</button>
                <button className="btn-ghost btn-sm" onClick={ctx.logout}>Salir</button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
              {[
                { label: "Usuarios",        value: users.length,                       icon: "👤", color: "#60A5FA" },
                { label: "Talleres",        value: talleres.length,                    icon: "🏭", color: "#F97316" },
                { label: "Pedidos totales", value: orders.length,                      icon: "📦", color: "#34D399" },
                { label: "Comisiones",      value: `S/ ${totalCommission.toFixed(2)}`, icon: "💰", color: "#A78BFA" },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: 20, borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Syne,sans-serif", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#71717A", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { key: "users",       label: `Usuarios (${users.length})` },
                { key: "talleres",    label: `Talleres (${talleres.length})` },
                { key: "orders",      label: `Pedidos (${orders.length})` },
                { key: "commissions", label: `Comisiones (${closedQuotes.length})` },
              ].map((t) => (
                <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── USUARIOS ── */}
            {tab === "users" && (
              <div className="card scroll-x">
                <table>
                  <thead><tr><th>Nombre</th><th>Correo</th><th>WhatsApp</th><th>Registrado</th></tr></thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: "#52525B", padding: 28 }}>Sin usuarios</td></tr>
                    ) : users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 700 }}>{u.name}</td>
                        <td style={{ color: "#71717A" }}>{u.email}</td>
                        <td>{u.whatsapp}</td>
                        <td style={{ color: "#52525B" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-PE") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── TALLERES ── */}
            {tab === "talleres" && (
              <div className="card scroll-x">
                <table>
                  <thead><tr><th>Taller</th><th>Propietario</th><th>Correo</th><th>WhatsApp</th><th>Estado</th><th>Deuda pend.</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {talleres.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", color: "#52525B", padding: 28 }}>Sin talleres</td></tr>
                    ) : talleres.map((t) => {
                      const pendDebt = (t.debts || []).filter((d) => !d.paid).reduce((s, d) => s + d.amount, 0);
                      return (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 700 }}>{t.tallerName}</td>
                          <td>{t.name}</td>
                          <td style={{ color: "#71717A" }}>{t.email}</td>
                          <td>{t.whatsapp}</td>
                          <td><span className={`badge ${t.blocked ? "badge-pending" : "badge-open"}`}>{t.blocked ? "⚠ Bloqueado" : "● Activo"}</span></td>
                          <td style={{ color: pendDebt > 0 ? "#F97316" : "#4ade80", fontWeight: 700 }}>S/ {pendDebt.toFixed(2)}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button className={t.blocked ? "btn-success" : "btn-danger"} onClick={() => toggleBlock(t)}>
                                {t.blocked ? "Habilitar" : "Bloquear"}
                              </button>
                              {(t.debts || []).filter((d) => !d.paid).map((d) => (
                                <button key={d.id} className="btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => markDebtPaid(t.id, d.id)}>
                                  ✓ S/{d.amount.toFixed(2)} pagado
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── PEDIDOS ── */}
            {tab === "orders" && (
              <div className="card scroll-x">
                <table>
                  <thead><tr><th>Cliente</th><th>Servicio</th><th>Brief</th><th>Adjuntos</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "#52525B", padding: 28 }}>Sin pedidos</td></tr>
                    ) : orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.userName}</td>
                        <td><span className="tag">{o.serviceName}</span></td>
                        <td style={{ maxWidth: 200, color: "#A1A1AA", fontSize: 12 }}>{o.brief?.titulo}</td>
                        <td style={{ fontSize: 12 }}>
                          {o.images?.length > 0 && <span style={{ marginRight: 6 }}>🖼️{o.images.length}</span>}
                          {o.audio && <span style={{ marginRight: 6 }}>🎙️</span>}
                          {o.cadFile && <span style={{ color: "#60A5FA" }}>📐</span>}
                        </td>
                        <td><span className={`badge ${o.status === "open" ? "badge-open" : "badge-closed"}`}>{o.status === "open" ? "Abierto" : "Cerrado"}</span></td>
                        <td style={{ color: "#71717A" }}>{o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("es-PE") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── COMISIONES ── */}
            {tab === "commissions" && (
              <div className="card scroll-x">
                <table>
                  <thead><tr><th>Taller</th><th>Pedido</th><th>Monto trato</th><th>Comisión 5%</th><th>Estado</th></tr></thead>
                  <tbody>
                    {closedQuotes.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", color: "#52525B", padding: 28 }}>Sin tratos cerrados</td></tr>
                    ) : closedQuotes.map((q) => {
                      const taller = talleres.find((t) => t.id === q.tallerId);
                      const debt   = (taller?.debts || []).find((d) => d.orderId === q.orderId);
                      return (
                        <tr key={q.id}>
                          <td style={{ fontWeight: 700 }}>{q.tallerName}</td>
                          <td style={{ color: "#A1A1AA", fontSize: 12 }}>{q.orderTitle || "—"}</td>
                          <td style={{ fontWeight: 700, color: "#4ade80" }}>S/ {q.dealAmount}</td>
                          <td style={{ fontWeight: 700, color: "#F97316" }}>S/ {(q.dealAmount * 0.05).toFixed(2)}</td>
                          <td><span className={`badge ${debt?.paid ? "badge-open" : "badge-pending"}`}>{debt?.paid ? "✓ Pagado" : "Pendiente"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
