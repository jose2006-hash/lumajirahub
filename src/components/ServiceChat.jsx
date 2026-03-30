import { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { callOpenAI } from "../openai";
import { CAD_ACCEPT } from "../config";
import Nav from "./Nav";

export default function ServiceChat({ ctx }) {
  const svc = ctx.selectedService;
  const [msgs, setMsgs] = useState([
    {
      role: "assistant",
      content: `¡Hola! Soy tu asistente especializado en **${svc?.label}**.\n\nVoy a ayudarte a crear un brief técnico completo para que los talleres puedan cotizarte con exactitud.\n\n¿Qué tipo de pieza o producto necesitas fabricar? Descríbeme brevemente.`,
    },
  ]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [brief, setBrief]           = useState(null);
  const [images, setImages]         = useState([]);
  const [audio, setAudio]           = useState(null);
  const [cadFile, setCadFile]       = useState(null);
  const [step, setStep]             = useState("chat");
  const [progress, setProgress]     = useState(1);
  const [publishing, setPublishing] = useState(false);
  const chatRef = useRef(null);
  const imgRef  = useRef(null);
  const audRef  = useRef(null);
  const cadRef  = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...msgs, { role: "user", content: input }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const SYSTEM = `Eres un asistente experto en manufactura para el servicio "${svc?.label}". Extrae todos los detalles técnicos necesarios para un brief de fabricación. Haz preguntas específicas sobre: material, dimensiones (largo, ancho, alto), cantidad, tolerancias, acabados, uso final, presupuesto referencial y plazo deseado. Cuando tengas suficiente información (al menos 3 intercambios), genera un brief técnico completo en JSON estrictamente entre etiquetas <BRIEF> y </BRIEF>. El JSON debe tener: titulo, descripcion, especificaciones (objeto clave:valor), cantidad, plazo_estimado, presupuesto_referencial, notas_adicionales. Habla siempre en español. No uses markdown en el JSON.`;
      const text = await callOpenAI(SYSTEM, next);
      const bm = text.match(/<BRIEF>([\s\S]*?)<\/BRIEF>/);
      if (bm) {
        try {
          setBrief(JSON.parse(bm[1]));
        } catch {
          setBrief({
            titulo: `Pedido de ${svc?.label}`,
            descripcion: next.filter((m) => m.role === "user").map((m) => m.content).join(". "),
            especificaciones: {},
            cantidad: 1,
            plazo_estimado: "A definir",
            presupuesto_referencial: "A consultar",
            notas_adicionales: "",
          });
        }
        setProgress(4);
        setStep("review");
      } else {
        if (next.length >= 4) setProgress(2);
        if (next.length >= 6) setProgress(3);
      }
      setMsgs((p) => [
        ...p,
        { role: "assistant", content: text.replace(/<BRIEF>[\s\S]*?<\/BRIEF>/g, "").trim() },
      ]);
    } catch (err) {
      setMsgs((p) => [
        ...p,
        {
          role: "assistant",
          content:
            err.message === "NO_KEY"
              ? "⚠️ No hay API key de OpenAI. Usa el botón 🔑 en la barra superior."
              : `⚠️ Error OpenAI: ${err.message}`,
        },
      ]);
    }
    setLoading(false);
  };

  const forceReview = () => {
    const desc = msgs.filter((m) => m.role === "user").map((m) => m.content).join(". ");
    setBrief({
      titulo: `Pedido de ${svc?.label}`,
      descripcion: desc,
      especificaciones: {},
      cantidad: 1,
      plazo_estimado: "A definir",
      presupuesto_referencial: "A consultar",
      notas_adicionales: "",
    });
    setProgress(4);
    setStep("review");
  };

  const handleImg = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const r = new FileReader();
      r.onload = (ev) => setImages((p) => [...p, { name: file.name, data: ev.target.result }]);
      r.readAsDataURL(file);
    });
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: ctx.user.id,
        userName: ctx.user.name,
        service: svc?.id,
        serviceName: svc?.label,
        brief,
        images: images.map((i) => i.name),
        audio: audio?.name || null,
        cadFile: cadFile?.name || null,
        status: "open",
        createdAt: serverTimestamp(),
      });
      ctx.showToast("¡Pedido publicado! Los talleres ya pueden cotizarlo.");
      ctx.setView("myOrders");
    } catch (e) {
      ctx.showToast("Error al publicar: " + e.message, "err");
    }
    setPublishing(false);
  };

  const STEPS = [
    "Tipo de servicio",
    "Descripción del proyecto",
    "Especificaciones técnicas",
    "Brief completo",
  ];

  // Inputs ocultos reutilizados en ambas pantallas
  const hiddenInputs = (
    <>
      <input ref={imgRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleImg} />
      <input ref={audRef} type="file" accept="audio/*" style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) setAudio({ name: e.target.files[0].name }); }} />
      <input ref={cadRef} type="file" accept={CAD_ACCEPT} style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) setCadFile({ name: e.target.files[0].name }); }} />
    </>
  );

  // ── PANTALLA REVIEW ──────────────────────────────────────────────
  if (step === "review" && brief)
    return (
      <div>
        <Nav ctx={ctx} title={svc?.label} showBack />
        {hiddenInputs}
        <div className="page" style={{ maxWidth: 700 }}>
          <div style={{ marginBottom: 24 }}>
            <div className="section-title">Revisa tu brief</div>
            <div className="section-sub">El asistente preparó tu solicitud técnica. Revisa y publica.</div>
          </div>

          <div className="card" style={{ padding: 26, marginBottom: 18, borderLeft: `3px solid ${svc?.accent}` }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: svc?.accent, marginBottom: 10 }}>{brief.titulo}</div>
            <div style={{ fontSize: 14, color: "#A1A1AA", lineHeight: 1.65, marginBottom: 14 }}>{brief.descripcion}</div>
            {brief.especificaciones && Object.keys(brief.especificaciones).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                {Object.entries(brief.especificaciones).map(([k, v]) => (
                  <span key={k} className="tag">{k}: {v}</span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#71717A" }}>
              <span>📦 Cantidad: {brief.cantidad}</span>
              <span>📅 Plazo: {brief.plazo_estimado}</span>
              <span>💰 Ref.: {brief.presupuesto_referencial}</span>
            </div>
          </div>

          <div className="card" style={{ padding: 22, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📎 Adjuntos opcionales</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn-ghost btn-sm" onClick={() => imgRef.current.click()}>
                🖼️ Imágenes {images.length > 0 ? `(${images.length})` : ""}
              </button>
              <button className="btn-ghost btn-sm" onClick={() => audRef.current.click()}>
                🎙️ {audio ? audio.name : "Subir audio"}
              </button>
              <button className="btn-ghost btn-sm" onClick={() => cadRef.current.click()}>
                📐 {cadFile ? cadFile.name : "Archivo CAD"}
              </button>
            </div>
            {images.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={img.data} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #27272A" }} />
                    <button
                      onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: -5, right: -5, background: "#EF4444", border: "none", borderRadius: "50%", width: 17, height: 17, cursor: "pointer", color: "#fff", fontSize: 9 }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            {cadFile && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, background: "#0F0F11", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 18 }}>📐</span>
                <span style={{ fontSize: 12, color: "#A1A1AA" }}>{cadFile.name}</span>
                <button onClick={() => setCadFile(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#71717A", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" style={{ flex: 1, padding: "12px 20px", fontSize: 14 }} onClick={publish} disabled={publishing}>
              {publishing ? <span className="spinner" /> : "🚀 Publicar pedido"}
            </button>
            <button className="btn-ghost" onClick={() => setStep("chat")}>← Editar</button>
          </div>
        </div>
      </div>
    );

  // ── PANTALLA CHAT ────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Nav ctx={ctx} title={svc?.label} showBack />
      {hiddenInputs}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", maxWidth: 980, margin: "0 auto", width: "100%", padding: "16px 24px", gap: 18 }}>
        {/* Chat panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#18181B", borderRadius: 12, border: "1px solid #27272A", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272A", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, color: svc?.accent }}>{svc?.icon}</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: svc?.accent }}>{svc?.label}</span>
            <span className="badge badge-blue" style={{ marginLeft: "auto", fontSize: 10 }}>GPT-4o Asistente</span>
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "bubble-me" : "bubble-bot"}>{m.content}</div>
            ))}
            {loading && <div className="bubble-bot"><span className="spinner" /></div>}
          </div>
          <div style={{ padding: "12px", borderTop: "1px solid #27272A", display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Escribe tu respuesta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" style={{ padding: "10px 16px" }} onClick={send} disabled={loading}>→</button>
          </div>
          {msgs.filter((m) => m.role === "user").length >= 4 && (
            <div style={{ padding: "8px 12px", background: "#0F0F11", textAlign: "center", borderTop: "1px solid #18181B" }}>
              <button className="btn-ghost btn-sm" onClick={forceReview} style={{ fontSize: 12 }}>
                Generar brief con la información actual →
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: 210, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#52525B", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>
              Progreso del brief
            </div>
            {STEPS.map((label, i) => {
              const st = i < progress ? "done" : i === progress - 1 ? "active" : "todo";
              return (
                <div key={i} className="step">
                  <div className={`step-dot ${st}`}>{st === "done" ? "✓" : i + 1}</div>
                  <span style={{ fontSize: 12, color: st === "todo" ? "#3F3F46" : st === "done" ? "#FAFAFA" : "#F97316" }}>{label}</span>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "#71717A", lineHeight: 1.55, marginBottom: 12 }}>
              💡 Puedes adjuntar imágenes, audio o archivos CAD.
            </div>
            <button className="btn-ghost" style={{ width: "100%", fontSize: 12, marginBottom: 7 }} onClick={() => imgRef.current?.click()}>
              🖼️ Imágenes {images.length > 0 ? `(${images.length})` : ""}
            </button>
            <button className="btn-ghost" style={{ width: "100%", fontSize: 12, marginBottom: 7 }} onClick={() => audRef.current?.click()}>
              🎙️ {audio ? `✓ ${audio.name}` : "Audio"}
            </button>
            <button className="btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={() => cadRef.current?.click()}>
              📐 {cadFile ? `✓ ${cadFile.name}` : "Archivo CAD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
