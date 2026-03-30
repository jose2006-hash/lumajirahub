import { useState } from "react";
import Nav from "./Nav";

export default function Auth({ ctx }) {
  const [f, setF] = useState({ name: "", tallerName: "", whatsapp: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (ctx.isRegister) {
      if (!f.name || !f.email || !f.password || !f.whatsapp) {
        ctx.showToast("Completa todos los campos", "err");
        setLoading(false);
        return;
      }
      if (ctx.authType === "taller" && !f.tallerName) {
        ctx.showToast("Ingresa el nombre del taller", "err");
        setLoading(false);
        return;
      }
      if (f.password.length < 6) {
        ctx.showToast("La contraseña debe tener al menos 6 caracteres", "err");
        setLoading(false);
        return;
      }
      await ctx.register(f, ctx.authType, f.password);
    } else {
      if (!f.email || !f.password) {
        ctx.showToast("Ingresa correo y contraseña", "err");
        setLoading(false);
        return;
      }
      await ctx.login(f.email, f.password, ctx.authType);
    }
    setLoading(false);
  };

  const typeEmoji = ctx.authType === "usuario" ? "👤" : ctx.authType === "taller" ? "🏭" : "🔐";
  const typeLabel = ctx.authType === "usuario" ? "Cliente" : ctx.authType === "taller" ? "Taller" : "Admin";

  return (
    <div className="dot-bg" style={{ minHeight: "100vh" }}>
      <Nav ctx={ctx} />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
        <div className="card" style={{ width: "100%", maxWidth: 420, padding: "36px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>{typeEmoji}</div>
            <div className="section-title" style={{ fontSize: 19 }}>
              {ctx.isRegister ? `Crear cuenta — ${typeLabel}` : `Iniciar sesión — ${typeLabel}`}
            </div>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {ctx.isRegister && (
              <>
                <div>
                  <label className="label">Nombre completo</label>
                  <input className="input" placeholder="Tu nombre" value={f.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                {ctx.authType === "taller" && (
                  <div>
                    <label className="label">Nombre del taller</label>
                    <input className="input" placeholder="Nombre comercial" value={f.tallerName} onChange={(e) => set("tallerName", e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="label">WhatsApp</label>
                  <input className="input" placeholder="+51 999 000 000" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label className="label">Correo electrónico</label>
              <input className="input" type="email" placeholder="correo@ejemplo.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="label">
                Contraseña{" "}
                {ctx.isRegister && (
                  <span style={{ color: "#52525B", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                    (mín. 6 caracteres)
                  </span>
                )}
              </label>
              <input
                className="input"
                type="password"
                placeholder={ctx.isRegister ? "Crea tu contraseña" : "••••••••"}
                value={f.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>
            {ctx.isRegister && (
              <div className="alert-ok" style={{ fontSize: 12 }}>
                💡 Después de registrarte verás tu contraseña en pantalla para que la puedas guardar.
              </div>
            )}
            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: 4, padding: "12px 20px", fontSize: 14 }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : ctx.isRegister ? "Crear cuenta →" : "Entrar →"}
            </button>
          </form>

          {ctx.authType !== "admin" && (
            <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#71717A" }}>
              {ctx.isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <button
                style={{ background: "none", border: "none", color: "#F97316", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 13 }}
                onClick={() => ctx.setIsRegister(!ctx.isRegister)}
              >
                {ctx.isRegister ? "Iniciar sesión" : "Regístrate gratis"}
              </button>
            </p>
          )}

          <button className="btn-ghost" style={{ width: "100%", marginTop: 12, fontSize: 13 }} onClick={() => ctx.setView("landing")}>
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}
