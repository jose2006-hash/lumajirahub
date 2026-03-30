import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// ── Service Worker registration ─────────────────────────────────
// El SW habilita la instalación PWA y el comportamiento offline básico.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("[PWA] SW registrado:", reg.scope))
      .catch((err) => console.warn("[PWA] Error SW:", err));
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
