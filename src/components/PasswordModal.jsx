import { useState } from "react";

export default function PasswordModal({ password, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 36, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔐</div>
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
          ¡Cuenta creada con éxito!
        </div>
        <p style={{ fontSize: 13, color: "#71717A", lineHeight: 1.65, marginBottom: 24 }}>
          Esta es tu contraseña. Guárdala ahora — no se mostrará de nuevo.
        </p>
        <div className="pw-box" onClick={copy} title="Haz clic para copiar">
          {password}
        </div>
        <p
          style={{
            fontSize: 12,
            color: copied ? "#4ade80" : "#52525B",
            marginTop: 10,
            marginBottom: 24,
            transition: "color .2s",
          }}
        >
          {copied ? "✓ ¡Copiada al portapapeles!" : "Haz clic en la contraseña para copiarla"}
        </p>
        <button
          className="btn-primary"
          style={{ width: "100%", padding: "13px 20px", fontSize: 14 }}
          onClick={onClose}
        >
          Ya la guardé, continuar →
        </button>
      </div>
    </div>
  );
}
