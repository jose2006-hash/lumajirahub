import { useState } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import InstallBanner from "./InstallBanner";

export default function Landing({ ctx }) {
  const { isInstallable, install, dismiss } = usePWAInstall();
  const [mode, setMode]           = useState(null);
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading]     = useState(false);

  const handleGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);
    await ctx.loginAsGuest(guestName);
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#09090B", display:"flex", flexDirection:"column", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes pop  { from{opacity:0;transform:scale(.93)}        to{opacity:1;transform:scale(1)} }
        .u1 { animation: up .4s cubic-bezier(.34,1.56,.64,1) both }
        .u2 { animation: up .4s .07s cubic-bezier(.34,1.56,.64,1) both }
        .u3 { animation: up .4s .14s cubic-bezier(.34,1.56,.64,1) both }
        .u4 { animation: up .4s .21s cubic-bezier(.34,1.56,.64,1) both }
        .pop { animation: pop .35s cubic-bezier(.34,1.56,.64,1) both }
        .rc {
          background:#18181B; border:1px solid #27272A; border-radius:20px;
          padding:28px 20px; cursor:pointer; text-align:center; flex:1;
          transition:all .22s cubic-bezier(.34,1.56,.64,1);
        }
        .rc:hover { border-color:#FF6B35; transform:translateY(-4px); box-shadow:0 14px 36px rgba(255,107,53,.14); }
        .li { background:#111113; border:1px solid #2C2C2E; border-radius:12px; padding:14px 16px; color:#fff; font-family:inherit; font-size:16px; width:100%; outline:none; transition:border-color .2s; box-sizing:border-box; }
        .li:focus { border-color:#FF6B35; box-shadow:0 0 0 3px rgba(255,107,53,.12); }
        .li::placeholder { color:#48484A; }
        .pb { width:100%; background:#FF6B35; color:#fff; border:none; border-radius:12px; padding:15px; font-family:inherit; font-weight:700; font-size:16px; cursor:pointer; transition:all .18s; box-shadow:0 4px 18px rgba(255,107,53,.3); }
        .pb:hover   { background:#FF8247; transform:translateY(-1px); box-shadow:0 8px 28px rgba(255,107,53,.4); }
        .pb:active  { transform:scale(.98); }
        .pb:disabled{ opacity:.4; cursor:not-allowed; transform:none; }
        .gb { width:100%; background:transparent; color:#AEAEB2; border:1px solid #2C2C2E; border-radius:12px; padding:14px; font-family:inherit; font-weight:600; font-size:15px; cursor:pointer; transition:all .18s; }
        .gb:hover { border-color:#48484A; color:#fff; background:rgba(255,255,255,.03); }
        .bk { background:none; border:none; color:#636366; font-family:inherit; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:5px; padding:0; transition:color .15s; }
        .bk:hover { color:#AEAEB2; }
      `}</style>

      {/* NAV */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:52 }}>
        <span style={{ fontFamily:"DM Serif Display,serif", fontSize:19, color:"#FF6B35", letterSpacing:"-.01em" }}>
          Lumajira<span style={{ color:"#48484A", fontFamily:"DM Sans,sans-serif", fontWeight:300, fontSize:17 }}>Hub</span>
        </span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {isInstallable && (
            <button onClick={install} style={{ background:"none", border:"1px solid #2C2C2E", borderRadius:8, padding:"6px 12px", color:"#AEAEB2", fontSize:12, fontFamily:"inherit", cursor:"pointer" }}>
              ⬇ Instalar
            </button>
          )}
          <button onClick={()=>{ctx.setAuthType("admin");ctx.setIsRegister(false);ctx.setView("auth");}}
            style={{ background:"none", border:"none", color:"#48484A", fontSize:18, cursor:"pointer" }}>🔐</button>
        </div>
      </nav>

      {/* CONTENIDO */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
        <div style={{ width:"100%", maxWidth:400 }}>

          {/* ── PASO 0: elegir rol ── */}
          {!mode && (
            <div>
              <div className="u1" style={{ textAlign:"center", marginBottom:36 }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#18181B", border:"1px solid #27272A", borderRadius:20, padding:"5px 14px", marginBottom:20 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#30D158", display:"inline-block" }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:"#636366", textTransform:"uppercase", letterSpacing:".1em" }}>Lima · Manufactura a medida</span>
                </div>
                <h1 style={{ fontFamily:"DM Serif Display,serif", fontSize:"clamp(34px,8vw,52px)", lineHeight:1.05, letterSpacing:"-.03em", color:"#FAFAFA", marginBottom:12 }}>
                  ¿Cómo puedo<br/>ayudarte hoy?
                </h1>
                <p style={{ fontSize:14, color:"#636366", lineHeight:1.6 }}>
                  Conectamos proyectos con talleres reales.
                </p>
              </div>

              <div className="u2" style={{ display:"flex", gap:12, marginBottom:14 }}>
                <div className="rc" onClick={()=>setMode("cliente")}>
                  <div style={{ fontSize:38, marginBottom:10 }}>👤</div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#FAFAFA", marginBottom:5 }}>Soy Cliente</div>
                  <div style={{ fontSize:12, color:"#636366", lineHeight:1.5 }}>Necesito fabricar algo</div>
                </div>
                <div className="rc" onClick={()=>setMode("taller")}>
                  <div style={{ fontSize:38, marginBottom:10 }}>🏭</div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#FAFAFA", marginBottom:5 }}>Soy Taller</div>
                  <div style={{ fontSize:12, color:"#636366", lineHeight:1.5 }}>Tengo equipos y quiero pedidos</div>
                </div>
              </div>

              <div className="u3" style={{ textAlign:"center" }}>
                <span style={{ fontSize:12, color:"#3F3F46" }}>Gratis para clientes · Sin registro previo</span>
              </div>
            </div>
          )}

          {/* ── PASO 1A: Cliente ── */}
          {mode === "cliente" && (
            <div className="pop">
              <button className="bk" onClick={()=>setMode(null)} style={{ marginBottom:28 }}>← Volver</button>
              <div style={{ textAlign:"center", marginBottom:28 }}>
                <div style={{ fontSize:44, marginBottom:12 }}>👤</div>
                <h2 style={{ fontFamily:"DM Serif Display,serif", fontSize:28, color:"#FAFAFA", letterSpacing:"-.02em", marginBottom:8 }}>
                  ¿Cómo te llamas?
                </h2>
                <p style={{ fontSize:13, color:"#636366" }}>Sin registro — solo tu nombre para comenzar.</p>
              </div>
              <form onSubmit={handleGuest} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input className="li" placeholder="Tu nombre..." value={guestName} onChange={e=>setGuestName(e.target.value)} autoFocus/>
                <button type="submit" className="pb" disabled={loading||!guestName.trim()}>
                  {loading ? "Ingresando..." : "Publicar mi pedido →"}
                </button>
              </form>
              <div style={{ marginTop:18, textAlign:"center" }}>
                <span style={{ fontSize:13, color:"#48484A" }}>¿Ya tienes cuenta? </span>
                <button onClick={()=>{ctx.setAuthType("usuario");ctx.setIsRegister(false);ctx.setView("auth");}}
                  style={{ background:"none", border:"none", color:"#FF6B35", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                  Iniciar sesión
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 1B: Taller ── */}
          {mode === "taller" && (
            <div className="pop">
              <button className="bk" onClick={()=>setMode(null)} style={{ marginBottom:28 }}>← Volver</button>
              <div style={{ textAlign:"center", marginBottom:28 }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🏭</div>
                <h2 style={{ fontFamily:"DM Serif Display,serif", fontSize:28, color:"#FAFAFA", letterSpacing:"-.02em", marginBottom:8 }}>
                  Bienvenido, taller
                </h2>
                <p style={{ fontSize:13, color:"#636366" }}>Accede a pedidos reales en Lima.</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                <button className="pb" onClick={()=>{ctx.setAuthType("taller");ctx.setIsRegister(false);ctx.setView("auth");}}>
                  Iniciar sesión →
                </button>
                <button className="gb" onClick={()=>{ctx.setAuthType("taller");ctx.setIsRegister(true);ctx.setView("auth");}}>
                  Crear cuenta gratis
                </button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[["📦","Briefs técnicos listos para cotizar"],["💬","Chat directo con clientes"],["💰","Solo 5% al cerrar trato"]].map(([icon,text])=>(
                  <div key={text} style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 13px", background:"#18181B", borderRadius:11, border:"1px solid #27272A" }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ fontSize:13, color:"#AEAEB2" }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", padding:"14px 24px", borderTop:"1px solid #18181B" }}>
        <span style={{ fontSize:11, color:"#3F3F46" }}>
          LumajiraHub · Lima ·{" "}
          <a href="https://wa.me/51935211605" target="_blank" rel="noreferrer" style={{ color:"#30D158", textDecoration:"none" }}>935 211 605</a>
        </span>
      </div>

      {isInstallable && <InstallBanner onInstall={install} onDismiss={dismiss}/>}
    </div>
  );
}