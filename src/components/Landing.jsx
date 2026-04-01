import { useState } from "react";
import Nav from "./Nav";
import { usePWAInstall } from "../hooks/usePWAInstall";
import InstallBanner from "./InstallBanner";

export default function Landing({ ctx }) {
  const { isInstallable, install, dismiss } = usePWAInstall();
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);
    await ctx.loginAsGuest(guestName);
    setLoading(false);
  };

  return (
    <div className="dot-bg" style={{ minHeight: "100vh" }}>
      <Nav ctx={ctx} />

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "calc(100vh - 56px)",
        padding: "48px 24px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 640 }}>

          {/* Pill */}
          <div style={{
            marginBottom: 14, display: "inline-flex", alignItems: "center", gap: 8,
            background: "#18181B", border: "1px solid #27272A", borderRadius: 20, padding: "5px 14px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: ".1em" }}>
              Manufactura a medida · Lima
            </span>
          </div>

          {/* Título */}
          <h1 className="hero-title" style={{ marginBottom: 20 }}>
            Conectamos proyectos<br />
            con <span style={{ color: "#F97316" }}>talleres reales</span>
          </h1>

          <p style={{ fontSize: 15, color: "#71717A", lineHeight: 1.65, maxWidth: 400, margin: "0 auto 40px" }}>
            Sin intermediarios. Publica tu pedido y recibe cotizaciones de talleres
            especializados en impresión 3D, CNC, láser e inyección plástica.
          </p>

          {/* Cards */}
          <div className="grid-2" style={{ maxWidth: 520, margin: "0 auto 24px", gap: 14 }}>

            {/* ── CLIENTE: solo nombre ── */}
            <div className="card" style={{ padding: 26, textAlign: "left" }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>👤</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Soy Cliente</div>
              <div style={{ fontSize: 12, color: "#71717A", lineHeight: 1.55, marginBottom: 16 }}>
                Solo ingresa tu nombre para publicar tu pedido.
              </div>
              <form onSubmit={handleGuest} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  className="input"
                  placeholder="Tu nombre..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  style={{ fontSize: 13 }}
                />
                <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading || !guestName.trim()}>
                  {loading ? <span className="spinner" /> : "Entrar →"}
                </button>
              </form>
            </div>

            {/* ── TALLER: registro completo ── */}
            <div className="card" style={{ padding: 26, textAlign: "left" }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🏭</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Soy Taller</div>
              <div style={{ fontSize: 12, color: "#71717A", lineHeight: 1.55, marginBottom: 18 }}>
                Accede a pedidos de manufactura y haz crecer tu negocio.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => { ctx.setAuthType("taller"); ctx.setIsRegister(false); ctx.setView("auth"); }}
                >
                  Ingresar
                </button>
                <button
                  className="btn-ghost btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => { ctx.setAuthType("taller"); ctx.setIsRegister(true); ctx.setView("auth"); }}
                >
                  Registrarse
                </button>
              </div>
            </div>
          </div>

          {/* Admin */}
          <button
            className="btn-ghost btn-sm"
            style={{ fontSize: 12 }}
            onClick={() => { ctx.setAuthType("admin"); ctx.setIsRegister(false); ctx.setView("auth"); }}
          >
            🔐 Acceso Administrador
          </button>
        </div>
      </div>

      {isInstallable && <InstallBanner onInstall={install} onDismiss={dismiss} />}
    </div>
  );
}