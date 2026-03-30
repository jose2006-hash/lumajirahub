import { useState } from "react";
import { getApiKey, setRuntimeApiKey } from "../openai";

export default function ApiKeyModal({ onClose, showToast }) {
  const [key, setKey] = useState(getApiKey());

  const save = () => {
    setRuntimeApiKey(key.trim());
    showToast("API key guardada ✓");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: "100%", maxWidth: 460, padding: 32 }}>
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
          🔑 API Key de OpenAI
        </div>
        <p style={{ fontSize: 13, color: "#71717A", lineHeight: 1.65, marginBottom: 20 }}>
          El chatbot usa <b style={{ color: "#FAFAFA" }}>GPT-4o</b>. También puedes configurarla en{" "}
          <code style={{ background: "#27272A", padding: "2px 6px", borderRadius: 4 }}>.env</code> como{" "}
          <code style={{ background: "#27272A", padding: "2px 6px", borderRadius: 4 }}>
            VITE_OPENAI_API_KEY
          </code>
          .
        </p>
        <label className="label">API Key</label>
        <input
          className="input"
          type="password"
          placeholder="sk-proj-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <p style={{ fontSize: 11, color: "#3F3F46", marginBottom: 20 }}>
          Solo persiste en memoria esta sesión.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={save}>
            Guardar
          </button>
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
        </div>
        <hr />
        <p style={{ fontSize: 12, color: "#52525B" }}>
          Obtén tu key en{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#F97316" }}
          >
            platform.openai.com/api-keys
          </a>
        </p>
      </div>
    </div>
  );
}
