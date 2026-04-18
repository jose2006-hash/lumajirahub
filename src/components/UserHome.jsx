import Nav from "./Nav";
import { SERVICES } from "../config";

export default function UserHome({ ctx }) {
  const svc = SERVICES[0]; // Solo impresión 3D

  return (
    <div style={{ minHeight:"100vh", background:"#09090B" }}>
      <Nav ctx={ctx} title="Inicio" />
      <div style={{ maxWidth:560, margin:"0 auto", padding:"48px 24px" }}>

        {/* Saludo */}
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"#FF6B35", textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>
            Hola, {ctx.user?.name} 👋
          </div>
          <h1 style={{ fontFamily:"DM Serif Display,serif", fontSize:"clamp(28px,5vw,42px)", lineHeight:1.1, letterSpacing:"-.02em", color:"#FAFAFA", marginBottom:10 }}>
            ¿Qué necesitas<br/>imprimir hoy?
          </h1>
          <p style={{ fontSize:14, color:"#636366", lineHeight:1.6 }}>
            Describe tu idea y te conectamos con talleres de impresión 3D en Lima.
          </p>
        </div>

        {/* Card principal — única acción */}
        <div
          onClick={() => { ctx.setSelectedService(svc); ctx.setView("serviceChat"); }}
          style={{
            background:"#18181B", border:`1px solid ${svc.accent}30`,
            borderRadius:20, padding:28, cursor:"pointer",
            transition:"all .22s cubic-bezier(.34,1.56,.64,1)",
            boxShadow:`0 0 0 1px ${svc.accent}10`,
            marginBottom:14,
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 16px 40px rgba(255,107,53,.15)`;e.currentTarget.style.borderColor=`${svc.accent}60`;}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 0 0 1px ${svc.accent}10`;e.currentTarget.style.borderColor=`${svc.accent}30`;}}
        >
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${svc.accent}18`, border:`1px solid ${svc.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:svc.accent }}>
              ▲
            </div>
            <span style={{ fontSize:12, fontWeight:600, color:svc.accent, background:`${svc.accent}15`, padding:"5px 12px", borderRadius:20 }}>
              Disponible ahora
            </span>
          </div>
          <div style={{ fontFamily:"DM Serif Display,serif", fontSize:22, color:"#FAFAFA", marginBottom:8 }}>
            Impresión 3D
          </div>
          <div style={{ fontSize:14, color:"#636366", lineHeight:1.6, marginBottom:20 }}>
            Figuras, prototipos, piezas funcionales, llaveros, maquetas y más. FDM, SLA y SLS.
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
            {["Figuras","Prototipos","Piezas funcionales","Llaveros","Maquetas"].map(tag=>(
              <span key={tag} style={{ fontSize:11, background:"#27272A", color:"#AEAEB2", padding:"4px 10px", borderRadius:6 }}>{tag}</span>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", gap:20 }}>
              {[["⚡","Respuesta en 24h"],["📍","Talleres en Lima"],["💰","Gratis cotizar"]].map(([icon,label])=>(
                <div key={label} style={{ fontSize:12, color:"#636366", display:"flex", alignItems:"center", gap:5 }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:svc.accent }}>Publicar pedido →</div>
          </div>
        </div>

        {/* Mis pedidos */}
        <button
          onClick={() => ctx.setView("myOrders")}
          style={{ width:"100%", background:"transparent", border:"1px solid #27272A", borderRadius:14, padding:"14px 18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .18s", fontFamily:"inherit" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#48484A";e.currentTarget.style.background="rgba(255,255,255,.02)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#27272A";e.currentTarget.style.background="transparent";}}
        >
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:20 }}>📦</span>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#FAFAFA" }}>Mis pedidos</div>
              <div style={{ fontSize:12, color:"#636366" }}>Ver cotizaciones recibidas</div>
            </div>
          </div>
          <span style={{ color:"#48484A", fontSize:16 }}>→</span>
        </button>

      </div>
    </div>
  );
}