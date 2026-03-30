import { usePWAInstall } from "../hooks/usePWAInstall";

export default function Nav({ ctx, title, showBack }) {
  const { isInstallable, install } = usePWAInstall();
  const back = () => ctx.setView(ctx.user?.type === "taller" ? "tallerHome" : "userHome");

  return (
    <nav className="nav">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {showBack && (
          <button className="btn-ghost btn-sm" onClick={back}>
            ← Volver
          </button>
        )}
        <span className="nav-logo">
          LUMAJIRA<span>HUB</span>
        </span>
        {title && (
          <span style={{ fontSize: 12, color: "#3F3F46" }}>/ {title}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* ── Botón instalar PWA ── */}
        {isInstallable && (
          <button className="btn-install btn-sm" onClick={install} title="Instalar aplicación">
            ⬇ Instalar app
          </button>
        )}

        {ctx.user && (
          <>
            <span style={{ fontSize: 12, color: "#71717A" }}>{ctx.user.name}</span>
            <span
              className={`badge ${
                ctx.user.type === "usuario"
                  ? "badge-blue"
                  : ctx.user.type === "admin"
                  ? "badge-open"
                  : "badge-pending"
              }`}
            >
              {ctx.user.type}
            </span>
            {ctx.user.type === "usuario" && (
              <button
                className="btn-ghost btn-sm"
                onClick={() => ctx.setView("myOrders")}
              >
                Mis Pedidos
              </button>
            )}
            <button
              className="btn-ghost btn-sm"
              title="API Key OpenAI"
              onClick={() => ctx.setShowApiModal(true)}
            >
              🔑
            </button>
            <button className="btn-ghost btn-sm" onClick={ctx.logout}>
              Salir
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
