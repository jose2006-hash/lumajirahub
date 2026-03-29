import { useState, useRef, useEffect, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, query, where,
  onSnapshot, orderBy, serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./firebase.js";

// ================================================================
// OPENAI CONFIG
// ================================================================
let _runtimeApiKey = "";
export const setRuntimeApiKey = (k) => { _runtimeApiKey = k; };
const getApiKey = () => _runtimeApiKey || import.meta.env.VITE_OPENAI_API_KEY || "";

async function callOpenAI(systemPrompt, messages) {
  const key = getApiKey();
  if (!key) throw new Error("NO_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Sin respuesta.";
}

// ================================================================
// CONSTANTS
// ================================================================
const SERVICES = [
  { id: "3d",      label: "Impresión 3D",          icon: "▲", desc: "FDM, SLA, SLS y tecnologías de manufactura aditiva",           accent: "#F97316" },
  { id: "cnc",     label: "Mecanizado CNC",         icon: "⚙", desc: "Fresado, torneado y corte de precisión en metal y madera",   accent: "#60A5FA" },
  { id: "laser",   label: "Corte y Grabado Láser",  icon: "◈", desc: "CO₂, fibra y diodo — corte y grabado de alta precisión",    accent: "#34D399" },
  { id: "plastic", label: "Inyección Plástica",     icon: "◎", desc: "Diseño de moldes y producción en serie de piezas plásticas", accent: "#A78BFA" },
];
const ADMIN_CREDS = { email: "admin@lumajirahub.com", password: "lumaadmin2024" };
const DEBT_LIMIT_DAYS = 30;
const CAD_ACCEPT = ".stl,.step,.stp,.iges,.igs,.obj,.3mf,.dxf,.dwg,.f3d,.sldprt,.sldasm";

// ================================================================
// AUTO-BLOCK
// ================================================================
async function checkAndAutoBlock(uid, profileData) {
  const debts = profileData.debts || [];
  const now = Date.now();
  const hasOverdue = debts.some((d) => {
    if (d.paid) return false;
    return (now - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24) > DEBT_LIMIT_DAYS;
  });
  if (hasOverdue && !profileData.blocked) {
    await updateDoc(doc(db, "profiles", uid), { blocked: true });
    return { ...profileData, blocked: true };
  }
  return profileData;
}

// ================================================================
// GLOBAL STYLES
// ================================================================
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #09090B; color: #FAFAFA; font-family: 'Plus Jakarta Sans', sans-serif; }
  .root { min-height: 100vh; background: #09090B; }
  .dot-bg { background-image: radial-gradient(#27272A 1px, transparent 1px); background-size: 26px 26px; }

  .nav { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:56px; background:rgba(9,9,11,0.85); backdrop-filter:blur(12px); border-bottom:1px solid #18181B; position:sticky; top:0; z-index:100; }
  .nav-logo { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; color:#F97316; letter-spacing:-.02em; }
  .nav-logo span { color:#52525B; font-weight:400; }

  .card { background:#18181B; border:1px solid #27272A; border-radius:12px; }
  .card-hover { transition:border-color .2s,transform .2s,box-shadow .2s; cursor:pointer; }
  .card-hover:hover { border-color:#F97316; transform:translateY(-2px); box-shadow:0 8px 32px rgba(249,115,22,.12); }

  .btn-primary { background:#F97316; color:#fff; border:none; border-radius:8px; padding:10px 20px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:13px; cursor:pointer; transition:background .15s,transform .1s; }
  .btn-primary:hover { background:#EA6906; }
  .btn-primary:active { transform:scale(.97); }
  .btn-primary:disabled { opacity:.45; cursor:not-allowed; }
  .btn-ghost { background:transparent; color:#A1A1AA; border:1px solid #27272A; border-radius:8px; padding:10px 20px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; font-size:13px; cursor:pointer; transition:all .15s; }
  .btn-ghost:hover { border-color:#52525B; color:#FAFAFA; }
  .btn-sm { padding:6px 14px; font-size:12px; border-radius:7px; }
  .btn-danger  { background:#7f1d1d; color:#fca5a5; border:1px solid #991b1b; border-radius:8px; padding:7px 14px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:12px; cursor:pointer; }
  .btn-danger:hover { background:#991b1b; }
  .btn-success { background:#052e16; color:#4ade80; border:1px solid #14532d; border-radius:8px; padding:7px 14px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:12px; cursor:pointer; }
  .btn-success:hover { background:#14532d; }

  .input { background:#0F0F11; border:1px solid #27272A; border-radius:8px; padding:10px 14px; color:#FAFAFA; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; width:100%; outline:none; transition:border-color .2s; }
  .input:focus { border-color:#F97316; }
  .input::placeholder { color:#3F3F46; }
  textarea.input { resize:vertical; line-height:1.5; }
  .label { font-size:11px; font-weight:700; color:#71717A; text-transform:uppercase; letter-spacing:.08em; margin-bottom:6px; display:block; }

  .page { max-width:960px; margin:0 auto; padding:32px 24px; }
  .page-wide { max-width:1160px; margin:0 auto; padding:32px 24px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  @media(max-width:700px) { .grid-2,.grid-4 { grid-template-columns:1fr; } }

  .hero-title { font-family:'Syne',sans-serif; font-size:clamp(34px,5vw,60px); font-weight:800; line-height:1.05; letter-spacing:-.03em; }
  .section-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:700; letter-spacing:-.02em; }
  .section-sub { font-size:13px; color:#71717A; margin-top:4px; }

  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .badge-open    { background:#052e16; color:#4ade80; }
  .badge-closed  { background:#1c1917; color:#a8a29e; }
  .badge-pending { background:#1c0a00; color:#fb923c; }
  .badge-blue    { background:#0c1a3a; color:#93c5fd; }
  .tag { font-size:11px; background:#27272A; color:#A1A1AA; padding:3px 8px; border-radius:5px; white-space:nowrap; }

  .bubble-me  { background:#F97316; color:#fff;    border-radius:18px 18px 4px 18px;  padding:10px 14px; max-width:78%; align-self:flex-end;   font-size:14px; line-height:1.45; white-space:pre-wrap; }
  .bubble-bot { background:#27272A; color:#FAFAFA; border-radius:18px 18px 18px 4px;  padding:10px 14px; max-width:78%; align-self:flex-start; font-size:14px; line-height:1.45; white-space:pre-wrap; }

  .tab { padding:7px 16px; font-size:13px; font-weight:600; border-radius:7px; cursor:pointer; transition:all .15s; color:#71717A; background:transparent; border:none; font-family:'Plus Jakarta Sans',sans-serif; }
  .tab.active { background:#27272A; color:#FAFAFA; }

  .scroll-x { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; padding:10px 16px; color:#52525B; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; border-bottom:1px solid #27272A; }
  td { padding:13px 16px; border-bottom:1px solid #18181B; color:#D4D4D8; vertical-align:middle; }
  tr:hover td { background:#18181B; }
  hr { border:none; border-top:1px solid #27272A; margin:20px 0; }

  .spinner { width:18px; height:18px; border:2px solid #3F3F46; border-top-color:#F97316; border-radius:50%; animation:spin .65s linear infinite; display:inline-block; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .toast { position:fixed; top:18px; right:18px; z-index:9999; background:#18181B; border:1px solid #27272A; border-radius:10px; padding:12px 18px; font-size:13px; font-weight:600; max-width:340px; display:flex; align-items:center; gap:10px; box-shadow:0 12px 40px rgba(0,0,0,.6); animation:slideIn .25s ease; pointer-events:none; }
  .toast.ok  { border-color:#14532d; color:#86efac; }
  .toast.err { border-color:#7f1d1d; color:#fca5a5; }
  @keyframes slideIn { from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)} }

  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.82); z-index:500; display:flex; align-items:center; justify-content:center; padding:24px; }
  .alert-warn { background:#1c0a00; border:1px solid #7c2d12; border-radius:10px; padding:14px 18px; color:#fb923c; font-size:13px; }
  .alert-ok   { background:#052e16; border:1px solid #14532d; border-radius:10px; padding:14px 18px; color:#4ade80; font-size:13px; }

  .step { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .step-dot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; }
  .step-dot.done   { background:#F97316; color:#fff; }
  .step-dot.active { background:#27272A; border:2px solid #F97316; color:#F97316; }
  .step-dot.todo   { background:#18181B; border:1px solid #27272A; color:#52525B; }

  .pw-box { background:#0F0F11; border:2px dashed #F97316; border-radius:10px; padding:20px 24px; font-family:monospace; font-size:24px; font-weight:800; color:#F97316; letter-spacing:.14em; text-align:center; cursor:pointer; user-select:all; transition:background .15s; margin:0 auto; }
  .pw-box:hover { background:#150900; }

  .loading-screen { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#09090B; flex-direction:column; gap:16px; }
`;

// ================================================================
// MAIN APP
// ================================================================
export default function LumajiraHub() {
  const [user, setUser]           = useState(null);
  const [authUser, setAuthUser]   = useState(null);
  const [view, setView]           = useState("loading");
  const [authType, setAuthType]   = useState("usuario");
  const [isRegister, setIsRegister] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [activeChat, setActiveChat]           = useState(null);
  const [toast, setToast]                     = useState(null);
  const [showApiModal, setShowApiModal]       = useState(false);
  const [newPassword, setNewPassword]         = useState(null);

  const showToast = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setAuthUser(null); setUser(null); setView("landing"); return; }

      if (fbUser.email === ADMIN_CREDS.email) {
        setAuthUser(fbUser);
        setUser({ id: fbUser.uid, type: "admin", name: "Administrador", email: fbUser.email });
        setView("admin");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "profiles", fbUser.uid));
        if (!snap.exists()) {
          const basicProfile = { type:"usuario", name:fbUser.email.split("@")[0], email:fbUser.email, whatsapp:"", createdAt:new Date().toISOString() };
          await setDoc(doc(db, "profiles", fbUser.uid), basicProfile);
          setAuthUser(fbUser); setUser({ id:fbUser.uid, ...basicProfile }); setView("userHome");
          return;
        }
        let profile = { id: fbUser.uid, ...snap.data() };
        if (profile.type === "taller") profile = await checkAndAutoBlock(fbUser.uid, profile);
        setAuthUser(fbUser); setUser(profile);
        setView(profile.type === "usuario" ? "userHome" : "tallerHome");
      } catch (e) { console.error(e); setView("landing"); }
    });
    return unsub;
  }, []);

  const register = async (data, type, password) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, password);
      const profile = {
        type, name:data.name, email:data.email, whatsapp:data.whatsapp,
        ...(type === "taller" ? { tallerName:data.tallerName, blocked:false, debts:[] } : {}),
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "profiles", cred.user.uid), profile);
      setNewPassword(password); return true;
    } catch (e) {
      const msg = e.code === "auth/email-already-in-use" ? "Este correo ya está registrado."
                : e.code === "auth/weak-password" ? "La contraseña debe tener al menos 6 caracteres." : e.message;
      showToast(msg, "err"); return false;
    }
  };

  const login = async (email, password, type) => {
    if (type === "admin" && (email !== ADMIN_CREDS.email || password !== ADMIN_CREDS.password)) {
      showToast("Credenciales de admin incorrectas.", "err"); return false;
    }
    try { await signInWithEmailAndPassword(auth, email, password); return true; }
    catch (e) {
      const msg = ["auth/invalid-credential","auth/wrong-password","auth/user-not-found"].includes(e.code)
        ? "Correo o contraseña incorrectos." : e.message;
      showToast(msg, "err"); return false;
    }
  };

  const logout = () => signOut(auth);

  const refreshUser = useCallback(async () => {
    if (!authUser) return;
    const snap = await getDoc(doc(db, "profiles", authUser.uid));
    if (snap.exists()) setUser({ id:authUser.uid, ...snap.data() });
  }, [authUser]);

  const ctx = {
    user, authUser, view, setView,
    selectedService, setSelectedService,
    selectedOrder, setSelectedOrder,
    activeChat, setActiveChat,
    login, register, logout, refreshUser,
    showToast, authType, setAuthType,
    isRegister, setIsRegister,
    showApiModal, setShowApiModal,
    newPassword, setNewPassword,
  };

  if (view === "loading") return (
    <>
      <style>{CSS}</style>
      <div className="loading-screen">
        <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:22, color:"#F97316" }}>
          LUMAJIRA<span style={{ color:"#52525B", fontWeight:400 }}>HUB</span>
        </div>
        <div className="spinner" style={{ width:28, height:28 }} />
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.type==="ok"?"✓":"✗"} {toast.msg}</div>}
      {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} showToast={showToast} />}
      {newPassword && <PasswordModal password={newPassword} onClose={() => setNewPassword(null)} />}
      <div className="root">
        {view === "landing"     && <Landing ctx={ctx} />}
        {view === "auth"        && <Auth ctx={ctx} />}
        {view === "userHome"    && <UserHome ctx={ctx} />}
        {view === "serviceChat" && <ServiceChat ctx={ctx} />}
        {view === "myOrders"    && <MyOrders ctx={ctx} />}
        {view === "tallerHome"  && <TallerHome ctx={ctx} />}
        {view === "orderDetail" && <OrderDetail ctx={ctx} />}
        {view === "chat"        && <Chat ctx={ctx} />}
        {view === "admin"       && <Admin ctx={ctx} />}
      </div>
    </>
  );
}

// ================================================================
// PASSWORD MODAL
// ================================================================
function PasswordModal({ password, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(password).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };
  return (
    <div className="modal-overlay">
      <div className="card" style={{ width:"100%", maxWidth:420, padding:36, textAlign:"center" }}>
        <div style={{ fontSize:44, marginBottom:12 }}>🔐</div>
        <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:20, marginBottom:8 }}>¡Cuenta creada con éxito!</div>
        <p style={{ fontSize:13, color:"#71717A", lineHeight:1.65, marginBottom:24 }}>
          Esta es tu contraseña. Guárdala ahora — no se mostrará de nuevo.
        </p>
        <div className="pw-box" onClick={copy} title="Haz clic para copiar">{password}</div>
        <p style={{ fontSize:12, color:copied?"#4ade80":"#52525B", marginTop:10, marginBottom:24, transition:"color .2s" }}>
          {copied ? "✓ ¡Copiada al portapapeles!" : "Haz clic en la contraseña para copiarla"}
        </p>
        <button className="btn-primary" style={{ width:"100%", padding:"13px 20px", fontSize:14 }} onClick={onClose}>
          Ya la guardé, continuar →
        </button>
      </div>
    </div>
  );
}

// ================================================================
// API KEY MODAL
// ================================================================
function ApiKeyModal({ onClose, showToast }) {
  const [key, setKey] = useState(getApiKey());
  const save = () => { setRuntimeApiKey(key.trim()); showToast("API key guardada ✓"); onClose(); };
  return (
    <div className="modal-overlay">
      <div className="card" style={{ width:"100%", maxWidth:460, padding:32 }}>
        <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, marginBottom:8 }}>🔑 API Key de OpenAI</div>
        <p style={{ fontSize:13, color:"#71717A", lineHeight:1.65, marginBottom:20 }}>
          El chatbot usa <b style={{ color:"#FAFAFA" }}>GPT-4o</b>. También puedes configurarla en{" "}
          <code style={{ background:"#27272A", padding:"2px 6px", borderRadius:4 }}>.env</code> como{" "}
          <code style={{ background:"#27272A", padding:"2px 6px", borderRadius:4 }}>VITE_OPENAI_API_KEY</code>.
        </p>
        <label className="label">API Key</label>
        <input className="input" type="password" placeholder="sk-proj-..." value={key} onChange={e=>setKey(e.target.value)} style={{ marginBottom:8 }} />
        <p style={{ fontSize:11, color:"#3F3F46", marginBottom:20 }}>Solo persiste en memoria esta sesión.</p>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-primary" style={{ flex:1 }} onClick={save}>Guardar</button>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
        <hr />
        <p style={{ fontSize:12, color:"#52525B" }}>
          Obtén tu key en{" "}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color:"#F97316" }}>
            platform.openai.com/api-keys
          </a>
        </p>
      </div>
    </div>
  );
}

// ================================================================
// NAV BAR
// ================================================================
function Nav({ ctx, title, showBack }) {
  const back = () => ctx.setView(ctx.user?.type === "taller" ? "tallerHome" : "userHome");
  return (
    <nav className="nav">
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {showBack && <button className="btn-ghost btn-sm" onClick={back}>← Volver</button>}
        <span className="nav-logo">LUMAJIRA<span>HUB</span></span>
        {title && <span style={{ fontSize:12, color:"#3F3F46" }}>/ {title}</span>}
      </div>
      {ctx.user && (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12, color:"#71717A" }}>{ctx.user.name}</span>
          <span className={`badge ${ctx.user.type==="usuario"?"badge-blue":ctx.user.type==="admin"?"badge-open":"badge-pending"}`}>
            {ctx.user.type}
          </span>
          {ctx.user.type === "usuario" && (
            <button className="btn-ghost btn-sm" onClick={() => ctx.setView("myOrders")}>Mis Pedidos</button>
          )}
          <button className="btn-ghost btn-sm" title="API Key OpenAI" onClick={() => ctx.setShowApiModal(true)}>🔑</button>
          <button className="btn-ghost btn-sm" onClick={ctx.logout}>Salir</button>
        </div>
      )}
    </nav>
  );
}

// ================================================================
// LANDING
// ================================================================
function Landing({ ctx }) {
  return (
    <div className="dot-bg" style={{ minHeight:"100vh" }}>
      <Nav ctx={ctx} />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 56px)", padding:"48px 24px", textAlign:"center" }}>
        <div style={{ maxWidth:640 }}>
          <div style={{ marginBottom:14, display:"inline-flex", alignItems:"center", gap:8, background:"#18181B", border:"1px solid #27272A", borderRadius:20, padding:"5px 14px" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"#71717A", textTransform:"uppercase", letterSpacing:".1em" }}>Manufactura a medida · Lima</span>
          </div>
          <h1 className="hero-title" style={{ marginBottom:20 }}>
            Conectamos proyectos<br />con <span style={{ color:"#F97316" }}>talleres reales</span>
          </h1>
          <p style={{ fontSize:15, color:"#71717A", lineHeight:1.65, maxWidth:400, margin:"0 auto 40px" }}>
            Sin intermediarios. Publica tu pedido y recibe cotizaciones de talleres especializados en impresión 3D, CNC, láser e inyección plástica.
          </p>
          <div className="grid-2" style={{ maxWidth:500, margin:"0 auto 24px", gap:14 }}>
            {[
              { type:"usuario", emoji:"👤", title:"Soy Cliente", desc:"Publica tu pedido y recibe ofertas de talleres especializados" },
              { type:"taller",  emoji:"🏭", title:"Soy Taller",  desc:"Accede a pedidos de manufactura y haz crecer tu negocio" },
            ].map((item) => (
              <div key={item.type} className="card" style={{ padding:26, textAlign:"left" }}>
                <div style={{ fontSize:30, marginBottom:10 }}>{item.emoji}</div>
                <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:12, color:"#71717A", lineHeight:1.55, marginBottom:18 }}>{item.desc}</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn-primary btn-sm" style={{ flex:1 }} onClick={() => { ctx.setAuthType(item.type); ctx.setIsRegister(false); ctx.setView("auth"); }}>Ingresar</button>
                  <button className="btn-ghost btn-sm" style={{ flex:1 }} onClick={() => { ctx.setAuthType(item.type); ctx.setIsRegister(true); ctx.setView("auth"); }}>Registrarse</button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-ghost btn-sm" style={{ fontSize:12 }} onClick={() => { ctx.setAuthType("admin"); ctx.setIsRegister(false); ctx.setView("auth"); }}>
            🔐 Acceso Administrador
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// AUTH
// ================================================================
function Auth({ ctx }) {
  const [f, setF] = useState({ name:"", tallerName:"", whatsapp:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]:v }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    if (ctx.isRegister) {
      if (!f.name || !f.email || !f.password || !f.whatsapp) { ctx.showToast("Completa todos los campos","err"); setLoading(false); return; }
      if (ctx.authType === "taller" && !f.tallerName) { ctx.showToast("Ingresa el nombre del taller","err"); setLoading(false); return; }
      if (f.password.length < 6) { ctx.showToast("La contraseña debe tener al menos 6 caracteres","err"); setLoading(false); return; }
      await ctx.register(f, ctx.authType, f.password);
    } else {
      if (!f.email || !f.password) { ctx.showToast("Ingresa correo y contraseña","err"); setLoading(false); return; }
      await ctx.login(f.email, f.password, ctx.authType);
    }
    setLoading(false);
  };

  const typeEmoji = ctx.authType==="usuario" ? "👤" : ctx.authType==="taller" ? "🏭" : "🔐";
  const typeLabel = ctx.authType==="usuario" ? "Cliente" : ctx.authType==="taller" ? "Taller" : "Admin";

  return (
    <div className="dot-bg" style={{ minHeight:"100vh" }}>
      <Nav ctx={ctx} />
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"calc(100vh - 56px)", padding:24 }}>
        <div className="card" style={{ width:"100%", maxWidth:420, padding:"36px 32px" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:38, marginBottom:10 }}>{typeEmoji}</div>
            <div className="section-title" style={{ fontSize:19 }}>
              {ctx.isRegister ? `Crear cuenta — ${typeLabel}` : `Iniciar sesión — ${typeLabel}`}
            </div>
          </div>
          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {ctx.isRegister && (
              <>
                <div>
                  <label className="label">Nombre completo</label>
                  <input className="input" placeholder="Tu nombre" value={f.name} onChange={e=>set("name",e.target.value)} />
                </div>
                {ctx.authType === "taller" && (
                  <div>
                    <label className="label">Nombre del taller</label>
                    <input className="input" placeholder="Nombre comercial" value={f.tallerName} onChange={e=>set("tallerName",e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="label">WhatsApp</label>
                  <input className="input" placeholder="+51 999 000 000" value={f.whatsapp} onChange={e=>set("whatsapp",e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label className="label">Correo electrónico</label>
              <input className="input" type="email" placeholder="correo@ejemplo.com" value={f.email} onChange={e=>set("email",e.target.value)} />
            </div>
            <div>
              <label className="label">
                Contraseña{" "}
                {ctx.isRegister && <span style={{ color:"#52525B", textTransform:"none", letterSpacing:0, fontWeight:400 }}>(mín. 6 caracteres)</span>}
              </label>
              <input className="input" type="password" placeholder={ctx.isRegister ? "Crea tu contraseña" : "••••••••"} value={f.password} onChange={e=>set("password",e.target.value)} />
            </div>
            {ctx.isRegister && (
              <div className="alert-ok" style={{ fontSize:12 }}>
                💡 Después de registrarte verás tu contraseña en pantalla para que la puedas guardar.
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ marginTop:4, padding:"12px 20px", fontSize:14 }} disabled={loading}>
              {loading ? <span className="spinner" /> : ctx.isRegister ? "Crear cuenta →" : "Entrar →"}
            </button>
          </form>
          {ctx.authType !== "admin" && (
            <p style={{ textAlign:"center", marginTop:18, fontSize:13, color:"#71717A" }}>
              {ctx.isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <button style={{ background:"none", border:"none", color:"#F97316", cursor:"pointer", fontWeight:700, fontFamily:"inherit", fontSize:13 }} onClick={() => ctx.setIsRegister(!ctx.isRegister)}>
                {ctx.isRegister ? "Iniciar sesión" : "Regístrate gratis"}
              </button>
            </p>
          )}
          <button className="btn-ghost" style={{ width:"100%", marginTop:12, fontSize:13 }} onClick={() => ctx.setView("landing")}>← Volver</button>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// USER HOME
// ================================================================
function UserHome({ ctx }) {
  return (
    <div>
      <Nav ctx={ctx} title="Inicio" />
      <div className="page">
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#F97316", textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>Hola, {ctx.user?.name} 👋</div>
          <div className="section-title">¿Qué necesitas fabricar?</div>
          <div className="section-sub">Selecciona el servicio y el asistente IA preparará tu brief técnico</div>
        </div>
        <div className="grid-2" style={{ gap:16 }}>
          {SERVICES.map((s) => (
            <div key={s.id} className="card card-hover" style={{ padding:28, borderLeft:`3px solid ${s.accent}` }}
              onClick={() => { ctx.setSelectedService(s); ctx.setView("serviceChat"); }}>
              <div style={{ fontSize:30, marginBottom:12, color:s.accent }}>{s.icon}</div>
              <div style={{ fontWeight:800, fontSize:16, marginBottom:6, color:s.accent }}>{s.label}</div>
              <div style={{ fontSize:13, color:"#71717A", lineHeight:1.55, marginBottom:18 }}>{s.desc}</div>
              <div style={{ fontSize:13, fontWeight:700, color:s.accent }}>Publicar pedido →</div>
            </div>
          ))}
        </div>
        <hr style={{ marginTop:32 }} />
        <button className="btn-ghost" onClick={() => ctx.setView("myOrders")}>📦 Ver mis pedidos →</button>
      </div>
    </div>
  );
}

// ================================================================
// SERVICE CHAT  ← ACTUALIZADO con soporte CAD
// ================================================================
function ServiceChat({ ctx }) {
  const svc = ctx.selectedService;
  const [msgs, setMsgs] = useState([
    { role:"assistant", content:`¡Hola! Soy tu asistente especializado en **${svc?.label}**.\n\nVoy a ayudarte a crear un brief técnico completo para que los talleres puedan cotizarte con exactitud.\n\n¿Qué tipo de pieza o producto necesitas fabricar? Descríbeme brevemente.` }
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [brief, setBrief]         = useState(null);
  const [images, setImages]       = useState([]);
  const [audio, setAudio]         = useState(null);
  const [cadFile, setCadFile]     = useState(null);   // ← NUEVO
  const [step, setStep]           = useState("chat");
  const [progress, setProgress]   = useState(1);
  const [publishing, setPublishing] = useState(false);
  const chatRef = useRef(null);
  const imgRef  = useRef(null);
  const audRef  = useRef(null);
  const cadRef  = useRef(null);                        // ← NUEVO

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...msgs, { role:"user", content:input }];
    setMsgs(next); setInput(""); setLoading(true);
    try {
      const SYSTEM = `Eres un asistente experto en manufactura para el servicio "${svc?.label}". Extrae todos los detalles técnicos necesarios para un brief de fabricación. Haz preguntas específicas sobre: material, dimensiones (largo, ancho, alto), cantidad, tolerancias, acabados, uso final, presupuesto referencial y plazo deseado. Cuando tengas suficiente información (al menos 3 intercambios), genera un brief técnico completo en JSON estrictamente entre etiquetas <BRIEF> y </BRIEF>. El JSON debe tener: titulo, descripcion, especificaciones (objeto clave:valor), cantidad, plazo_estimado, presupuesto_referencial, notas_adicionales. Habla siempre en español. No uses markdown en el JSON.`;
      const text = await callOpenAI(SYSTEM, next);
      const bm = text.match(/<BRIEF>([\s\S]*?)<\/BRIEF>/);
      if (bm) {
        try { setBrief(JSON.parse(bm[1])); }
        catch { setBrief({ titulo:`Pedido de ${svc?.label}`, descripcion:next.filter(m=>m.role==="user").map(m=>m.content).join(". "), especificaciones:{}, cantidad:1, plazo_estimado:"A definir", presupuesto_referencial:"A consultar", notas_adicionales:"" }); }
        setProgress(4); setStep("review");
      } else {
        if (next.length >= 4) setProgress(2);
        if (next.length >= 6) setProgress(3);
      }
      setMsgs(p => [...p, { role:"assistant", content:text.replace(/<BRIEF>[\s\S]*?<\/BRIEF>/g,"").trim() }]);
    } catch (err) {
      setMsgs(p => [...p, { role:"assistant", content: err.message==="NO_KEY" ? "⚠️ No hay API key de OpenAI. Usa el botón 🔑 en la barra superior." : `⚠️ Error OpenAI: ${err.message}` }]);
    }
    setLoading(false);
  };

  const forceReview = () => {
    const desc = msgs.filter(m=>m.role==="user").map(m=>m.content).join(". ");
    setBrief({ titulo:`Pedido de ${svc?.label}`, descripcion:desc, especificaciones:{}, cantidad:1, plazo_estimado:"A definir", presupuesto_referencial:"A consultar", notas_adicionales:"" });
    setProgress(4); setStep("review");
  };

  const handleImg = (e) => {
    Array.from(e.target.files).forEach(file => {
      const r = new FileReader();
      r.onload = ev => setImages(p => [...p, { name:file.name, data:ev.target.result }]);
      r.readAsDataURL(file);
    });
  };

  // Inputs ocultos compartidos entre chat y review
  const hiddenInputs = (
    <>
      <input ref={imgRef} type="file" multiple accept="image/*" style={{ display:"none" }} onChange={handleImg} />
      <input ref={audRef} type="file" accept="audio/*" style={{ display:"none" }}
        onChange={e => { if (e.target.files[0]) setAudio({ name:e.target.files[0].name }); }} />
      <input ref={cadRef} type="file" accept={CAD_ACCEPT} style={{ display:"none" }}
        onChange={e => { if (e.target.files[0]) setCadFile({ name:e.target.files[0].name }); }} />
    </>
  );

  const publish = async () => {
    setPublishing(true);
    try {
      await addDoc(collection(db,"orders"), {
        userId: ctx.user.id, userName: ctx.user.name,
        service: svc?.id, serviceName: svc?.label,
        brief,
        images:   images.map(i => i.name),
        audio:    audio?.name   || null,
        cadFile:  cadFile?.name || null,   // ← NUEVO
        status: "open", createdAt: serverTimestamp(),
      });
      ctx.showToast("¡Pedido publicado! Los talleres ya pueden cotizarlo.");
      ctx.setView("myOrders");
    } catch(e) { ctx.showToast("Error al publicar: "+e.message,"err"); }
    setPublishing(false);
  };

  const STEPS = ["Tipo de servicio","Descripción del proyecto","Especificaciones técnicas","Brief completo"];

  // ── PANTALLA REVIEW ──────────────────────────────────────────────
  if (step === "review" && brief) return (
    <div>
      <Nav ctx={ctx} title={svc?.label} showBack />
      {hiddenInputs}
      <div className="page" style={{ maxWidth:700 }}>
        <div style={{ marginBottom:24 }}>
          <div className="section-title">Revisa tu brief</div>
          <div className="section-sub">El asistente preparó tu solicitud técnica. Revisa y publica.</div>
        </div>

        {/* Brief card */}
        <div className="card" style={{ padding:26, marginBottom:18, borderLeft:`3px solid ${svc?.accent}` }}>
          <div style={{ fontWeight:800, fontSize:17, color:svc?.accent, marginBottom:10 }}>{brief.titulo}</div>
          <div style={{ fontSize:14, color:"#A1A1AA", lineHeight:1.65, marginBottom:14 }}>{brief.descripcion}</div>
          {brief.especificaciones && Object.keys(brief.especificaciones).length>0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
              {Object.entries(brief.especificaciones).map(([k,v]) => <span key={k} className="tag">{k}: {v}</span>)}
            </div>
          )}
          <div style={{ display:"flex", flexWrap:"wrap", gap:16, fontSize:13, color:"#71717A" }}>
            <span>📦 Cantidad: {brief.cantidad}</span>
            <span>📅 Plazo: {brief.plazo_estimado}</span>
            <span>💰 Ref.: {brief.presupuesto_referencial}</span>
          </div>
        </div>

        {/* Adjuntos — ACTUALIZADO con CAD */}
        <div className="card" style={{ padding:22, marginBottom:18 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>📎 Adjuntos opcionales</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
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
            <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
              {images.map((img,i) => (
                <div key={i} style={{ position:"relative" }}>
                  <img src={img.data} alt="" style={{ width:70, height:70, objectFit:"cover", borderRadius:8, border:"1px solid #27272A" }} />
                  <button onClick={() => setImages(p => p.filter((_,j) => j !== i))}
                    style={{ position:"absolute", top:-5, right:-5, background:"#EF4444", border:"none", borderRadius:"50%", width:17, height:17, cursor:"pointer", color:"#fff", fontSize:9 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {cadFile && (
            <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, background:"#0F0F11", borderRadius:8, padding:"8px 12px" }}>
              <span style={{ fontSize:18 }}>📐</span>
              <span style={{ fontSize:12, color:"#A1A1AA" }}>{cadFile.name}</span>
              <button onClick={() => setCadFile(null)}
                style={{ marginLeft:"auto", background:"none", border:"none", color:"#71717A", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-primary" style={{ flex:1, padding:"12px 20px", fontSize:14 }} onClick={publish} disabled={publishing}>
            {publishing ? <span className="spinner" /> : "🚀 Publicar pedido"}
          </button>
          <button className="btn-ghost" onClick={() => setStep("chat")}>← Editar</button>
        </div>
      </div>
    </div>
  );

  // ── PANTALLA CHAT ────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh" }}>
      <Nav ctx={ctx} title={svc?.label} showBack />
      {hiddenInputs}
      <div style={{ flex:1, overflow:"hidden", display:"flex", maxWidth:980, margin:"0 auto", width:"100%", padding:"16px 24px", gap:18 }}>

        {/* Chat panel */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#18181B", borderRadius:12, border:"1px solid #27272A", overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #27272A", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18, color:svc?.accent }}>{svc?.icon}</span>
            <span style={{ fontWeight:800, fontSize:14, color:svc?.accent }}>{svc?.label}</span>
            <span className="badge badge-blue" style={{ marginLeft:"auto", fontSize:10 }}>GPT-4o Asistente</span>
          </div>
          <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            {msgs.map((m,i) => <div key={i} className={m.role==="user"?"bubble-me":"bubble-bot"}>{m.content}</div>)}
            {loading && <div className="bubble-bot"><span className="spinner" /></div>}
          </div>
          <div style={{ padding:"12px", borderTop:"1px solid #27272A", display:"flex", gap:8 }}>
            <input className="input" placeholder="Escribe tu respuesta..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} disabled={loading} style={{ flex:1 }} />
            <button className="btn-primary" style={{ padding:"10px 16px" }} onClick={send} disabled={loading}>→</button>
          </div>
          {msgs.filter(m=>m.role==="user").length>=4 && (
            <div style={{ padding:"8px 12px", background:"#0F0F11", textAlign:"center", borderTop:"1px solid #18181B" }}>
              <button className="btn-ghost btn-sm" onClick={forceReview} style={{ fontSize:12 }}>Generar brief con la información actual →</button>
            </div>
          )}
        </div>

        {/* Sidebar — ACTUALIZADO con CAD */}
        <div style={{ width:210, display:"flex", flexDirection:"column", gap:14 }}>
          {/* Progreso */}
          <div className="card" style={{ padding:18 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#52525B", textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>Progreso del brief</div>
            {STEPS.map((label,i) => {
              const st = i<progress?"done":i===progress-1?"active":"todo";
              return (
                <div key={i} className="step">
                  <div className={`step-dot ${st}`}>{st==="done"?"✓":i+1}</div>
                  <span style={{ fontSize:12, color:st==="todo"?"#3F3F46":st==="done"?"#FAFAFA":"#F97316" }}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Adjuntos — ACTUALIZADO con CAD */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:12, color:"#71717A", lineHeight:1.55, marginBottom:12 }}>
              💡 Puedes adjuntar imágenes, audio o archivos CAD.
            </div>
            <button className="btn-ghost" style={{ width:"100%", fontSize:12, marginBottom:7 }} onClick={() => imgRef.current?.click()}>
              🖼️ Imágenes {images.length > 0 ? `(${images.length})` : ""}
            </button>
            <button className="btn-ghost" style={{ width:"100%", fontSize:12, marginBottom:7 }} onClick={() => audRef.current?.click()}>
              🎙️ {audio ? `✓ ${audio.name}` : "Audio"}
            </button>
            <button className="btn-ghost" style={{ width:"100%", fontSize:12 }} onClick={() => cadRef.current?.click()}>
              📐 {cadFile ? `✓ ${cadFile.name}` : "Archivo CAD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// MY ORDERS
// ================================================================
function MyOrders({ ctx }) {
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ctx.user?.id) return;
    const q = query(collection(db,"orders"), where("userId","==",ctx.user.id), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => { setOrders(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
  }, [ctx.user?.id]);

  useEffect(() => {
    if (orders.length === 0) { setLoading(false); return; }
    const ids = orders.map(o=>o.id);
    const chunks = [];
    for (let i=0;i<ids.length;i+=10) chunks.push(ids.slice(i,i+10));
    let all = []; const unsubs = [];
    chunks.forEach(chunk => {
      const q = query(collection(db,"quotes"), where("orderId","in",chunk));
      unsubs.push(onSnapshot(q, snap => {
        const fresh = snap.docs.map(d=>({id:d.id,...d.data()}));
        all = [...all.filter(q=>!chunk.includes(q.orderId)), ...fresh];
        setQuotes([...all]);
      }));
    });
    return () => unsubs.forEach(u=>u());
  }, [orders.length]);

  const closeDeal = async (quote) => {
    const amount = parseFloat(quote.price);
    const commission = +(amount*0.05).toFixed(2);
    try {
      await updateDoc(doc(db,"quotes",quote.id), { status:"closed", dealAmount:amount });
      await updateDoc(doc(db,"orders",quote.orderId), { status:"closed" });
      const tSnap = await getDoc(doc(db,"profiles",quote.tallerId));
      if (tSnap.exists()) {
        const debts = tSnap.data().debts || [];
        await updateDoc(doc(db,"profiles",quote.tallerId), {
          debts: [...debts, { id:`d${Date.now()}`, amount:commission, date:new Date().toISOString(), paid:false, orderId:quote.orderId }]
        });
      }
      ctx.showToast(`¡Trato cerrado! Comisión 5% (S/ ${commission}) registrada.`);
    } catch(e) { ctx.showToast("Error: "+e.message,"err"); }
  };

  return (
    <div>
      <Nav ctx={ctx} title="Mis Pedidos" />
      <div className="page">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
          <div>
            <div className="section-title">Mis Pedidos</div>
            <div className="section-sub">{orders.length} pedido(s) publicado(s)</div>
          </div>
          <button className="btn-primary" onClick={() => ctx.setView("userHome")}>+ Nuevo pedido</button>
        </div>
        {loading ? (
          <div style={{ textAlign:"center", padding:60 }}><span className="spinner" style={{ width:28, height:28 }} /></div>
        ) : orders.length===0 ? (
          <div className="card" style={{ padding:52, textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:12 }}>📭</div>
            <div style={{ color:"#71717A", marginBottom:16 }}>Aún no tienes pedidos publicados.</div>
            <button className="btn-primary" onClick={() => ctx.setView("userHome")}>Publicar mi primer pedido</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {orders.map(order => {
              const myQ = quotes.filter(q=>q.orderId===order.id);
              const svc = SERVICES.find(s=>s.id===order.service);
              return (
                <div key={order.id} className="card" style={{ padding:24, borderLeft:`3px solid ${svc?.accent||"#F97316"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:17 }}>{order.brief?.titulo||order.serviceName}</div>
                      <div style={{ fontSize:12, color:"#71717A", marginTop:2 }}>
                        <span className="tag" style={{ marginRight:8 }}>{order.serviceName}</span>
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("es-PE") : ""}
                      </div>
                    </div>
                    <span className={`badge ${order.status==="open"?"badge-open":"badge-closed"}`}>
                      {order.status==="open"?"● Abierto":"✓ Cerrado"}
                    </span>
                  </div>
                  <div style={{ fontSize:13, color:"#A1A1AA", lineHeight:1.55, marginBottom:14 }}>
                    {order.brief?.descripcion?.slice(0,200)}{order.brief?.descripcion?.length>200?"...":""}
                  </div>
                  {/* Adjuntos del pedido */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                    {order.images?.length > 0 && <span style={{ fontSize:12, color:"#52525B" }}>🖼️ {order.images.length} imagen(es)</span>}
                    {order.audio && <span style={{ fontSize:12, color:"#52525B" }}>🎙️ {order.audio}</span>}
                    {order.cadFile && <span style={{ fontSize:12, color:"#60A5FA" }}>📐 {order.cadFile}</span>}
                  </div>
                  {myQ.length>0 ? (
                    <div>
                      <div style={{ fontSize:12, fontWeight:800, color:"#F97316", marginBottom:12 }}>💼 {myQ.length} cotización(es) recibida(s)</div>
                      {myQ.map(q => (
                        <div key={q.id} className="card" style={{ padding:18, marginBottom:10, background:"#0F0F11" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <div style={{ fontWeight:700 }}>🏭 {q.tallerName}</div>
                            <span className={`badge ${q.status==="closed"?"badge-closed":"badge-pending"}`}>
                              {q.status==="closed"?"✓ Trato cerrado":"⏳ Pendiente"}
                            </span>
                          </div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:14, fontSize:13, color:"#A1A1AA", marginBottom:12 }}>
                            <span>💰 S/ {q.price}</span>
                            <span>📍 {q.location}</span>
                            <span>📅 {q.deliveryDate}</span>
                          </div>
                          {q.notes && <div style={{ fontSize:12, color:"#71717A", marginBottom:12 }}>{q.notes}</div>}
                          {q.status!=="closed" && order.status==="open" && (
                            <div style={{ display:"flex", gap:8 }}>
                              <button className="btn-ghost btn-sm" onClick={() => { ctx.setActiveChat({ chatId:`${order.id}_${q.tallerId}`, order, quote:q }); ctx.setView("chat"); }}>
                                💬 Chatear con el taller
                              </button>
                              <button className="btn-success" onClick={() => closeDeal(q)}>✓ Cerrar trato — S/ {q.price}</button>
                            </div>
                          )}
                          {q.status==="closed" && <div style={{ fontSize:13, color:"#4ade80", fontWeight:600 }}>✓ Trato cerrado por S/ {q.dealAmount}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize:13, color:"#3F3F46" }}>⏳ Esperando cotizaciones de talleres...</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// TALLER HOME
// ================================================================
function TallerHome({ ctx }) {
  const [tab, setTab]             = useState("orders");
  const [openOrders, setOpenOrders] = useState([]);
  const [myQuotes, setMyQuotes]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const q = query(collection(db,"orders"), where("status","==","open"), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => { setOpenOrders(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!ctx.user?.id) return;
    const q = query(collection(db,"quotes"), where("tallerId","==",ctx.user.id), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => setMyQuotes(snap.docs.map(d=>({id:d.id,...d.data()}))));
  }, [ctx.user?.id]);

  useEffect(() => { ctx.refreshUser(); }, []);

  const tallerData   = ctx.user;
  const pendingDebts = (tallerData?.debts||[]).filter(d=>!d.paid);
  const totalDebt    = pendingDebts.reduce((s,d)=>s+d.amount,0);

  return (
    <div>
      <Nav ctx={ctx} title="Panel Taller" />
      <div className="page-wide">
        {tallerData?.blocked && (
          <div className="alert-warn" style={{ marginBottom:20, display:"flex", gap:12 }}>
            <span style={{ fontSize:22 }}>🚫</span>
            <div>
              <div style={{ fontWeight:700, marginBottom:2 }}>Cuenta bloqueada</div>
              <div style={{ fontSize:12, color:"#a1a1aa" }}>Tu cuenta fue bloqueada automáticamente por tener deudas con más de {DEBT_LIMIT_DAYS} días sin pagar. Contacta al administrador.</div>
            </div>
          </div>
        )}
        {!tallerData?.blocked && pendingDebts.length>0 && (
          <div className="alert-warn" style={{ marginBottom:20 }}>
            ⚠️ Tienes <b>S/ {totalDebt.toFixed(2)}</b> en comisiones pendientes. Si superas {DEBT_LIMIT_DAYS} días sin pagar, tu cuenta será bloqueada automáticamente.
          </div>
        )}
        <div style={{ marginBottom:24 }}>
          <div className="section-title">Bienvenido, {ctx.user?.tallerName||ctx.user?.name}</div>
          <div className="section-sub">Gestiona pedidos y cotizaciones</div>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          {[
            { key:"orders",   label:`Pedidos (${openOrders.length})` },
            { key:"myquotes", label:`Mis cotizaciones (${myQuotes.length})` },
            { key:"debts",    label:`Deudas (${pendingDebts.length})` },
          ].map(t => <button key={t.key} className={`tab ${tab===t.key?"active":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>)}
        </div>

        {tab==="orders" && (
          loading
            ? <div style={{ textAlign:"center", padding:60 }}><span className="spinner" style={{ width:28, height:28 }} /></div>
            : openOrders.length===0
              ? <div className="card" style={{ padding:52, textAlign:"center", color:"#71717A" }}><div style={{ fontSize:40, marginBottom:12 }}>📭</div>No hay pedidos disponibles aún</div>
              : (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {openOrders.map(order => {
                    const alreadySent = myQuotes.find(q=>q.orderId===order.id);
                    const svc = SERVICES.find(s=>s.id===order.service);
                    return (
                      <div key={order.id} className="card" style={{ padding:24, borderLeft:`3px solid ${svc?.accent||"#F97316"}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:16 }}>{order.brief?.titulo||order.serviceName}</div>
                            <div style={{ fontSize:12, color:"#71717A", marginTop:2 }}>Por <b>{order.userName}</b> · {order.createdAt?.toDate?order.createdAt.toDate().toLocaleDateString("es-PE"):""}</div>
                          </div>
                          <span className="tag" style={{ background:"#1a1a2e", color:"#818cf8" }}>{order.serviceName}</span>
                        </div>
                        <div style={{ fontSize:13, color:"#A1A1AA", lineHeight:1.55, marginBottom:12 }}>
                          {order.brief?.descripcion?.slice(0,220)}{order.brief?.descripcion?.length>220?"...":""}
                        </div>
                        {order.brief?.especificaciones && Object.keys(order.brief.especificaciones).length>0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                            {Object.entries(order.brief.especificaciones).map(([k,v])=><span key={k} className="tag">{k}: {v}</span>)}
                          </div>
                        )}
                        <div style={{ display:"flex", flexWrap:"wrap", gap:12, fontSize:12, color:"#71717A", marginBottom:14 }}>
                          {order.brief?.cantidad   && <span>📦 {order.brief.cantidad}</span>}
                          {order.brief?.plazo_estimado && <span>📅 {order.brief.plazo_estimado}</span>}
                          {order.images?.length>0  && <span>🖼️ {order.images.length} imagen(es)</span>}
                          {order.audio             && <span>🎙️ Audio</span>}
                          {order.cadFile           && <span style={{ color:"#60A5FA" }}>📐 {order.cadFile}</span>}
                        </div>
                        {alreadySent ? (
                          <span style={{ fontSize:13, color:"#4ade80", fontWeight:600 }}>✓ Cotización enviada</span>
                        ) : tallerData?.blocked ? (
                          <span style={{ fontSize:13, color:"#fb923c" }}>⚠ Cuenta bloqueada</span>
                        ) : (
                          <button className="btn-primary" onClick={() => { ctx.setSelectedOrder(order); ctx.setView("orderDetail"); }}>Enviar cotización →</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
        )}

        {tab==="myquotes" && (
          myQuotes.length===0
            ? <div className="card" style={{ padding:40, textAlign:"center", color:"#71717A" }}>Aún no has enviado cotizaciones</div>
            : myQuotes.map(q => (
              <div key={q.id} className="card" style={{ padding:20, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontWeight:700 }}>{q.orderTitle||"Pedido"}</div>
                  <span className={`badge ${q.status==="closed"?"badge-closed":"badge-pending"}`}>{q.status==="closed"?"✓ Cerrado":"⏳ Pendiente"}</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:14, fontSize:13, color:"#A1A1AA", marginBottom:10 }}>
                  <span>💰 S/ {q.price}</span><span>📍 {q.location}</span><span>📅 {q.deliveryDate}</span>
                </div>
                {q.status!=="closed" && (
                  <button className="btn-ghost btn-sm" onClick={() => {
                    const order = openOrders.find(o=>o.id===q.orderId);
                    if (order) { ctx.setActiveChat({ chatId:`${q.orderId}_${q.tallerId}`, order, quote:q }); ctx.setView("chat"); }
                    else ctx.showToast("El pedido ya fue cerrado","err");
                  }}>💬 Chat con el cliente</button>
                )}
                {q.status==="closed" && <div style={{ fontSize:13, color:"#4ade80" }}>Cerrado por S/ {q.dealAmount} · Comisión: S/ {(q.dealAmount*0.05).toFixed(2)}</div>}
              </div>
            ))
        )}

        {tab==="debts" && (
          pendingDebts.length===0
            ? <div className="alert-ok">✓ Sin deudas pendientes. ¡Estás al día!</div>
            : <>
              <div className="alert-warn" style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>Total pendiente: S/ {totalDebt.toFixed(2)}</div>
                <div style={{ fontSize:12 }}>Comisión del 5% sobre tratos cerrados. Contacta al administrador para regularizar.</div>
              </div>
              {pendingDebts.map(d => {
                const daysOld = Math.floor((Date.now()-new Date(d.date).getTime())/(1000*60*60*24));
                return (
                  <div key={d.id} className="card" style={{ padding:16, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center", borderLeft:`3px solid ${daysOld>DEBT_LIMIT_DAYS?"#ef4444":"#F97316"}` }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:"#F97316" }}>S/ {d.amount.toFixed(2)}</div>
                      <div style={{ fontSize:12, color:"#71717A" }}>Generado el {new Date(d.date).toLocaleDateString("es-PE")}</div>
                      <div style={{ fontSize:11, color:daysOld>DEBT_LIMIT_DAYS?"#f87171":"#71717A", marginTop:2 }}>
                        {daysOld} días {daysOld>DEBT_LIMIT_DAYS?` ⚠️ Límite de ${DEBT_LIMIT_DAYS} días superado`:""}
                      </div>
                    </div>
                    <span className="badge badge-pending">Pendiente</span>
                  </div>
                );
              })}
            </>
        )}
      </div>
    </div>
  );
}

// ================================================================
// ORDER DETAIL
// ================================================================
function OrderDetail({ ctx }) {
  const order = ctx.selectedOrder;
  const [f, setF]     = useState({ price:"", location:"", deliveryDate:"", notes:"" });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  if (!order) return null;
  const svc = SERVICES.find(s=>s.id===order.service);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.price||!f.location||!f.deliveryDate) { ctx.showToast("Completa precio, ubicación y fecha","err"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db,"quotes"), {
        orderId:order.id, tallerId:ctx.user.id,
        tallerName:ctx.user.tallerName||ctx.user.name,
        orderTitle:order.brief?.titulo||order.serviceName,
        price:f.price, location:f.location, deliveryDate:f.deliveryDate, notes:f.notes,
        status:"pending", createdAt:serverTimestamp(),
      });
      ctx.showToast("¡Cotización enviada al cliente!");
      ctx.setView("tallerHome");
    } catch(e) { ctx.showToast("Error: "+e.message,"err"); }
    setLoading(false);
  };

  return (
    <div>
      <Nav ctx={ctx} title="Cotizar pedido" showBack />
      <div className="page" style={{ maxWidth:700 }}>
        <div className="card" style={{ padding:26, marginBottom:20, borderLeft:`3px solid ${svc?.accent||"#F97316"}` }}>
          <div style={{ fontWeight:800, fontSize:18, marginBottom:6 }}>{order.brief?.titulo||order.serviceName}</div>
          <div style={{ fontSize:13, color:"#71717A", marginBottom:14 }}>Publicado por <b>{order.userName}</b></div>
          <div style={{ fontSize:14, color:"#A1A1AA", lineHeight:1.6, marginBottom:14 }}>{order.brief?.descripcion}</div>
          {order.brief?.especificaciones && Object.keys(order.brief.especificaciones).length>0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
              {Object.entries(order.brief.especificaciones).map(([k,v])=><span key={k} className="tag">{k}: {v}</span>)}
            </div>
          )}
          <div style={{ display:"flex", flexWrap:"wrap", gap:12, fontSize:13, color:"#71717A", marginBottom: order.cadFile ? 12 : 0 }}>
            {order.brief?.cantidad&&<span>📦 {order.brief.cantidad} und.</span>}
            {order.brief?.plazo_estimado&&<span>📅 {order.brief.plazo_estimado}</span>}
            {order.brief?.presupuesto_referencial&&<span>💰 Ref: {order.brief.presupuesto_referencial}</span>}
          </div>
          {/* Mostrar archivo CAD si existe */}
          {order.cadFile && (
            <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:8, background:"#0F0F11", borderRadius:8, padding:"8px 12px" }}>
              <span style={{ fontSize:16 }}>📐</span>
              <span style={{ fontSize:12, color:"#60A5FA", fontWeight:600 }}>Archivo CAD adjunto:</span>
              <span style={{ fontSize:12, color:"#A1A1AA" }}>{order.cadFile}</span>
            </div>
          )}
        </div>
        <div className="card" style={{ padding:26 }}>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:20 }}>Tu cotización</div>
          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label className="label">Precio total (S/)</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="Ej: 450.00" value={f.price} onChange={e=>set("price",e.target.value)} />
            </div>
            <div>
              <label className="label">Ubicación del taller</label>
              <input className="input" placeholder="Ej: San Miguel, Lima" value={f.location} onChange={e=>set("location",e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha de entrega estimada</label>
              <input className="input" type="date" value={f.deliveryDate} onChange={e=>set("deliveryDate",e.target.value)} />
            </div>
            <div>
              <label className="label">Notas adicionales</label>
              <textarea className="input" rows={3} placeholder="Materiales incluidos, condiciones, garantía..." value={f.notes} onChange={e=>set("notes",e.target.value)} />
            </div>
            <div style={{ fontSize:12, color:"#52525B", lineHeight:1.5 }}>
              ⚠️ Al cerrar un trato se registrará una comisión del 5% del monto acordado.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button type="submit" className="btn-primary" style={{ flex:1, padding:"12px 20px" }} disabled={loading}>
                {loading?<span className="spinner" />:"Enviar cotización →"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => ctx.setView("tallerHome")}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// CHAT — real-time Firestore
// ================================================================
function Chat({ ctx }) {
  const chat = ctx.activeChat;
  const [msgs, setMsgs]   = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!chat?.chatId) return;
    const q = query(collection(db, `chats/${chat.chatId}/msgs`), orderBy("createdAt","asc"));
    return onSnapshot(q, snap => setMsgs(snap.docs.map(d=>({id:d.id,...d.data()}))));
  }, [chat?.chatId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior:"smooth", block:"end" });
  }, [msgs]);

  if (!chat) return null;
  const isUser = ctx.user?.type === "usuario";

  const send = async () => {
    if (!input.trim()) return;
    const text = input; setInput("");
    try {
      await addDoc(collection(db, `chats/${chat.chatId}/msgs`), {
        from: ctx.user.id,
        fromName: ctx.user.name || ctx.user.tallerName || "Usuario",
        text, createdAt: serverTimestamp(),
      });
    } catch (e) { console.error("Error enviando mensaje:", e); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh" }}>
      <Nav ctx={ctx} showBack />
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", maxWidth:720, margin:"0 auto", width:"100%", padding:"16px 24px", gap:14 }}>
        <div className="card" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            {msgs.length===0 && (
              <div style={{ textAlign:"center", color:"#3F3F46", fontSize:13, marginTop:40 }}>
                Inicia la conversación con {isUser ? "el taller" : "el cliente"}.
              </div>
            )}
            {msgs.map(m => {
              const isMe = m.from === ctx.user?.id;
              return (
                <div key={m.id} style={{ display:"flex", flexDirection:"column" }}>
                  {!isMe && <span style={{ fontSize:11, color:"#F97316", fontWeight:700, marginBottom:3, paddingLeft:4 }}>{m.fromName}</span>}
                  <div className={isMe?"bubble-me":"bubble-bot"}>{m.text}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding:"12px", borderTop:"1px solid #27272A", display:"flex", gap:8 }}>
            <input className="input" placeholder="Escribe un mensaje..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} style={{ flex:1 }} />
            <button className="btn-primary" style={{ padding:"10px 16px" }} onClick={send}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ADMIN PANEL
// ================================================================
function Admin({ ctx }) {
  const [tab, setTab]               = useState("users");
  const [users, setUsers]           = useState([]);
  const [talleres, setTalleres]     = useState([]);
  const [orders, setOrders]         = useState([]);
  const [closedQuotes, setClosedQuotes] = useState([]);
  const [loading, setLoading]       = useState(true);

  const loadAll = async () => {
    const [uSnap,tSnap,oSnap,qSnap] = await Promise.all([
      getDocs(query(collection(db,"profiles"),where("type","==","usuario"))),
      getDocs(query(collection(db,"profiles"),where("type","==","taller"))),
      getDocs(collection(db,"orders")),
      getDocs(query(collection(db,"quotes"),where("status","==","closed"))),
    ]);
    setUsers(uSnap.docs.map(d=>({id:d.id,...d.data()})));
    setTalleres(tSnap.docs.map(d=>({id:d.id,...d.data()})));
    setOrders(oSnap.docs.map(d=>({id:d.id,...d.data()})));
    setClosedQuotes(qSnap.docs.map(d=>({id:d.id,...d.data()})));
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const toggleBlock = async (t) => {
    const newVal = !t.blocked;
    await updateDoc(doc(db,"profiles",t.id), { blocked:newVal });
    setTalleres(p=>p.map(x=>x.id===t.id?{...x,blocked:newVal}:x));
    ctx.showToast(newVal?"Taller bloqueado.":"Taller habilitado.");
  };

  const markDebtPaid = async (tallerId, debtId) => {
    const taller = talleres.find(t=>t.id===tallerId);
    if (!taller) return;
    const updDebts = (taller.debts||[]).map(d=>d.id===debtId?{...d,paid:true}:d);
    const allPaid  = updDebts.filter(d=>!d.paid).length===0;
    await updateDoc(doc(db,"profiles",tallerId), { debts:updDebts,...(allPaid?{blocked:false}:{}) });
    setTalleres(p=>p.map(t=>t.id===tallerId?{...t,debts:updDebts,...(allPaid?{blocked:false}:{})}:t));
    ctx.showToast("Deuda pagada"+(allPaid?" — taller desbloqueado.":"."));
  };

  const totalCommission = talleres.flatMap(t=>t.debts||[]).reduce((s,d)=>s+d.amount,0);

  return (
    <div>
      <Nav ctx={ctx} title="Admin" />
      <div className="page-wide">
        {loading ? (
          <div style={{ textAlign:"center", padding:80 }}><span className="spinner" style={{ width:32, height:32 }} /></div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
              <div>
                <div className="section-title">Panel de Administración</div>
                <div className="section-sub">LumajiraHub — gestión completa de la plataforma</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-ghost btn-sm" onClick={loadAll}>↻ Actualizar</button>
                <button className="btn-ghost btn-sm" onClick={ctx.logout}>Salir</button>
              </div>
            </div>
            <div className="grid-4" style={{ marginBottom:28 }}>
              {[
                { label:"Usuarios",       value:users.length,                          icon:"👤", color:"#60A5FA" },
                { label:"Talleres",       value:talleres.length,                       icon:"🏭", color:"#F97316" },
                { label:"Pedidos totales",value:orders.length,                         icon:"📦", color:"#34D399" },
                { label:"Comisiones",     value:`S/ ${totalCommission.toFixed(2)}`,    icon:"💰", color:"#A78BFA" },
              ].map((s,i) => (
                <div key={i} className="card" style={{ padding:20, borderTop:`3px solid ${s.color}` }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:26, fontWeight:800, fontFamily:"Syne,sans-serif", color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:12, color:"#71717A", marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {[
                { key:"users",       label:`Usuarios (${users.length})` },
                { key:"talleres",    label:`Talleres (${talleres.length})` },
                { key:"orders",      label:`Pedidos (${orders.length})` },
                { key:"commissions", label:`Comisiones (${closedQuotes.length})` },
              ].map(t=><button key={t.key} className={`tab ${tab===t.key?"active":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>)}
            </div>

            {tab==="users" && (
              <div className="card scroll-x">
                <table>
                  <thead><tr><th>Nombre</th><th>Correo</th><th>WhatsApp</th><th>Registrado</th></tr></thead>
                  <tbody>
                    {users.length===0
                      ? <tr><td colSpan={4} style={{ textAlign:"center", color:"#52525B", padding:28 }}>Sin usuarios</td></tr>
                      : users.map(u=>(
                        <tr key={u.id}>
                          <td style={{ fontWeight:700 }}>{u.name}</td>
                          <td style={{ color:"#71717A" }}>{u.email}</td>
                          <td>{u.whatsapp}</td>
                          <td style={{ color:"#52525B" }}>{u.createdAt?new Date(u.createdAt).toLocaleDateString("es-PE"):"—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab==="talleres" && (
              <div className="card scroll-x">
                <table>
                  <thead><tr><th>Taller</th><th>Propietario</th><th>Correo</th><th>WhatsApp</th><th>Estado</th><th>Deuda pend.</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {talleres.length===0
                      ? <tr><td colSpan={7} style={{ textAlign:"center", color:"#52525B", padding:28 }}>Sin talleres</td></tr>
                      : talleres.map(t=>{
                        const pendDebt=(t.debts||[]).filter(d=>!d.paid).reduce((s,d)=>s+d.amount,0);
                        return (
                          <tr key={t.id}>
                            <td style={{ fontWeight:700 }}>{t.tallerName}</td>
                            <td>{t.name}</td>
                            <td style={{ color:"#71717A" }}>{t.email}</td>
                            <td>{t.whatsapp}</td>
                            <td><span className={`badge ${t.blocked?"badge-pending":"badge-open"}`}>{t.blocked?"⚠ Bloqueado":"● Activo"}</span></td>
                            <td style={{ color:pendDebt>0?"#F97316":"#4ade80", fontWeight:700 }}>S/ {pendDebt.toFixed(2)}</td>
                            <td>
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                <button className={t.blocked?"btn-success":"btn-danger"} onClick={()=>toggleBlock(t)}>
                                  {t.blocked?"Habilitar":"Bloquear"}
                                </button>
                                {(t.debts||[]).filter(d=>!d.paid).map(d=>(
                                  <button key={d.id} className="btn-ghost btn-sm" style={{ fontSize:11 }} onClick={()=>markDebtPaid(t.id,d.id)}>
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

            {tab==="orders" && (
              <div className="card scroll-x">
                <table>
                  <thead><tr><th>Cliente</th><th>Servicio</th><th>Brief</th><th>Adjuntos</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {orders.length===0
                      ? <tr><td colSpan={6} style={{ textAlign:"center", color:"#52525B", padding:28 }}>Sin pedidos</td></tr>
                      : orders.map(o=>(
                        <tr key={o.id}>
                          <td>{o.userName}</td>
                          <td><span className="tag">{o.serviceName}</span></td>
                          <td style={{ maxWidth:200, color:"#A1A1AA", fontSize:12 }}>{o.brief?.titulo}</td>
                          <td style={{ fontSize:12 }}>
                            {o.images?.length>0 && <span style={{ marginRight:6 }}>🖼️{o.images.length}</span>}
                            {o.audio && <span style={{ marginRight:6 }}>🎙️</span>}
                            {o.cadFile && <span style={{ color:"#60A5FA" }}>📐</span>}
                          </td>
                          <td><span className={`badge ${o.status==="open"?"badge-open":"badge-closed"}`}>{o.status==="open"?"Abierto":"Cerrado"}</span></td>
                          <td style={{ color:"#71717A" }}>{o.createdAt?.toDate?o.createdAt.toDate().toLocaleDateString("es-PE"):"—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab==="commissions" && (
              <div className="card scroll-x">
                <table>
                  <thead><tr><th>Taller</th><th>Pedido</th><th>Monto trato</th><th>Comisión 5%</th><th>Estado</th></tr></thead>
                  <tbody>
                    {closedQuotes.length===0
                      ? <tr><td colSpan={5} style={{ textAlign:"center", color:"#52525B", padding:28 }}>Sin tratos cerrados</td></tr>
                      : closedQuotes.map(q=>{
                        const taller=talleres.find(t=>t.id===q.tallerId);
                        const debt=(taller?.debts||[]).find(d=>d.orderId===q.orderId);
                        return (
                          <tr key={q.id}>
                            <td style={{ fontWeight:700 }}>{q.tallerName}</td>
                            <td style={{ color:"#A1A1AA", fontSize:12 }}>{q.orderTitle||"—"}</td>
                            <td style={{ fontWeight:700, color:"#4ade80" }}>S/ {q.dealAmount}</td>
                            <td style={{ fontWeight:700, color:"#F97316" }}>S/ {(q.dealAmount*0.05).toFixed(2)}</td>
                            <td><span className={`badge ${debt?.paid?"badge-open":"badge-pending"}`}>{debt?.paid?"✓ Pagado":"Pendiente"}</span></td>
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
import { useEffect, useState } from "react";

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const installApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <div>
      <h1>Mi App</h1>

      {deferredPrompt && (
        <button onClick={installApp}>
          Instalar app
        </button>
      )}
    </div>
  );
}
export default App;
