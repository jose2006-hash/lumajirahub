import Nav from "./Nav";
import { SERVICES } from "../config";

export default function UserHome({ ctx }) {
  return (
    <div>
      <Nav ctx={ctx} title="Inicio" />
      <div className="page">
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#F97316", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
            Hola, {ctx.user?.name} 👋
          </div>
          <div className="section-title">¿Qué necesitas fabricar?</div>
          <div className="section-sub">Selecciona el servicio y el asistente IA preparará tu brief técnico</div>
        </div>

        <div className="grid-2" style={{ gap: 16 }}>
          {SERVICES.map((s) => (
            <div
              key={s.id}
              className="card card-hover"
              style={{ padding: 28, borderLeft: `3px solid ${s.accent}` }}
              onClick={() => {
                ctx.setSelectedService(s);
                ctx.setView("serviceChat");
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 12, color: s.accent }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: s.accent }}>{s.label}</div>
              <div style={{ fontSize: 13, color: "#71717A", lineHeight: 1.55, marginBottom: 18 }}>{s.desc}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.accent }}>Publicar pedido →</div>
            </div>
          ))}
        </div>

        <hr style={{ marginTop: 32 }} />
        <button className="btn-ghost" onClick={() => ctx.setView("myOrders")}>
          📦 Ver mis pedidos →
        </button>
      </div>
    </div>
  );
}
