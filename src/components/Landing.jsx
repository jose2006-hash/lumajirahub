import { useState, useEffect } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import InstallBanner from "./InstallBanner";

// ── SVG Illustrations animadas ───────────────────────────────────
const Illustration3D = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
    <rect width="160" height="120" rx="12" fill="#0F0F11"/>
    <ellipse cx="80" cy="95" rx="45" ry="10" fill="#1a1a1f" stroke="#F97316" strokeWidth="1"/>
    <path d="M80 30 L110 47 L110 80 L80 97 L50 80 L50 47 Z" fill="#18181B" stroke="#F97316" strokeWidth="1.5"/>
    <path d="M80 30 L110 47 L80 64 L50 47 Z" fill="#F97316" fillOpacity="0.15" stroke="#F97316" strokeWidth="1.5"/>
    <path d="M80 64 L110 47 L110 80 L80 97 Z" fill="#F97316" fillOpacity="0.08"/>
    <path d="M80 64 L50 47 L50 80 L80 97 Z" fill="#F97316" fillOpacity="0.05"/>
    <line x1="50" y1="55" x2="110" y2="55" stroke="#F97316" strokeWidth="1" strokeDasharray="4 4" opacity="0.6">
      <animate attributeName="y1" values="40;80;40" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="40;80;40" dur="2.5s" repeatCount="indefinite"/>
    </line>
    <rect x="70" y="18" width="20" height="6" rx="2" fill="#F97316" opacity="0.9">
      <animate attributeName="y" values="18;58;18" dur="2.5s" repeatCount="indefinite"/>
    </rect>
    <line x1="80" y1="24" x2="80" y2="32" stroke="#F97316" strokeWidth="1.5" opacity="0.8">
      <animate attributeName="y1" values="24;64;24" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="32;72;32" dur="2.5s" repeatCount="indefinite"/>
    </line>
    <circle cx="95" cy="50" r="1.5" fill="#F97316" opacity="0.6"><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite"/></circle>
    <circle cx="65" cy="60" r="1" fill="#F97316" opacity="0.4"><animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite"/></circle>
  </svg>
);

const IllustrationCNC = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
    <rect width="160" height="120" rx="12" fill="#0F0F11"/>
    <rect x="20" y="75" width="120" height="8" rx="2" fill="#1a1a2e" stroke="#60A5FA" strokeWidth="1"/>
    <rect x="35" y="55" width="90" height="20" rx="3" fill="#18181B" stroke="#60A5FA" strokeWidth="1"/>
    <rect x="35" y="55" width="40" height="20" rx="3" fill="#60A5FA" fillOpacity="0.1"/>
    <line x1="45" y1="60" x2="45" y2="70" stroke="#60A5FA" strokeWidth="1" opacity="0.5"/>
    <line x1="55" y1="60" x2="55" y2="70" stroke="#60A5FA" strokeWidth="1" opacity="0.5"/>
    <line x1="65" y1="60" x2="65" y2="70" stroke="#60A5FA" strokeWidth="1" opacity="0.5"/>
    <rect x="70" y="25" width="6" height="35" rx="2" fill="#60A5FA" opacity="0.8">
      <animate attributeName="x" values="70;35;70" dur="3s" repeatCount="indefinite"/>
    </rect>
    <path d="M71 60 L77 60 L75 68 L73 68 Z" fill="#60A5FA">
      <animate attributeName="x" values="0;-35;0" dur="3s" repeatCount="indefinite" additive="sum"/>
    </path>
    <circle cx="74" cy="68" r="1.5" fill="#60A5FA"><animate attributeName="cx" values="74;39;74" dur="3s" repeatCount="indefinite"/><animate attributeName="cy" values="68;78;68" dur="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="0.5s" repeatCount="indefinite"/></circle>
    <circle cx="78" cy="65" r="1" fill="#fff" opacity="0.7"><animate attributeName="cx" values="78;43;78" dur="3s" repeatCount="indefinite"/><animate attributeName="cy" values="65;78;65" dur="0.4s" begin="0.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="0.4s" begin="0.2s" repeatCount="indefinite"/></circle>
    <line x1="20" y1="35" x2="140" y2="35" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round"/>
    <line x1="20" y1="30" x2="140" y2="30" stroke="#60A5FA" strokeWidth="1" opacity="0.3"/>
  </svg>
);

const IllustrationLaser = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
    <rect width="160" height="120" rx="12" fill="#0F0F11"/>
    <rect x="20" y="72" width="120" height="28" rx="4" fill="#0d2010" stroke="#34D399" strokeWidth="1"/>
    <path d="M35 82 L55 82 L55 90 L35 90 Z" fill="#34D399" fillOpacity="0.2" stroke="#34D399" strokeWidth="0.5"/>
    <path d="M60 84 L80 84" stroke="#34D399" strokeWidth="1.5" opacity="0.6"/>
    <path d="M60 88 L75 88" stroke="#34D399" strokeWidth="1" opacity="0.4"/>
    <rect x="62" y="18" width="36" height="16" rx="4" fill="#18181B" stroke="#34D399" strokeWidth="1.5"/>
    <circle cx="80" cy="26" r="4" fill="#34D399" fillOpacity="0.3" stroke="#34D399" strokeWidth="1"/>
    <line x1="80" y1="34" x2="80" y2="72" stroke="#34D399" strokeWidth="2" opacity="0.9" strokeDasharray="3 2">
      <animate attributeName="x1" values="80;45;80" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="80;45;80" dur="2.5s" repeatCount="indefinite"/>
    </line>
    <circle cx="80" cy="72" r="3" fill="#34D399" opacity="0.9">
      <animate attributeName="cx" values="80;45;80" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="r" values="3;6;3" dur="0.5s" repeatCount="indefinite"/>
    </circle>
    <path d="M78 70 Q76 62 80 55" stroke="#34D399" strokeWidth="0.8" fill="none" opacity="0.3">
      <animate attributeName="opacity" values="0;0.5;0" dur="1s" repeatCount="indefinite"/>
    </path>
  </svg>
);

const IllustrationPlastic = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
    <rect width="160" height="120" rx="12" fill="#0F0F11"/>
    <path d="M25 20 L135 20 L135 52 Q105 68 80 63 Q55 68 25 52 Z" fill="#1a1020" stroke="#A78BFA" strokeWidth="1.5"/>
    <path d="M40 30 L120 30 L120 48 Q100 58 80 55 Q60 58 40 48 Z" fill="#0d0a1a" stroke="#A78BFA" strokeWidth="0.5"/>
    <path d="M25 70 L135 70 L135 100 L25 100 Z" fill="#1a1020" stroke="#A78BFA" strokeWidth="1.5"/>
    <path d="M40 70 L120 70 L120 87 Q100 94 80 91 Q60 94 40 87 Z" fill="#A78BFA" fillOpacity="0.2" stroke="#A78BFA" strokeWidth="0.5">
      <animate attributeName="fillOpacity" values="0;0.25;0.25" dur="2s" repeatCount="indefinite"/>
    </path>
    <rect x="73" y="5" width="14" height="18" rx="4" fill="#18181B" stroke="#A78BFA" strokeWidth="1.5"/>
    <line x1="80" y1="20" x2="80" y2="30" stroke="#A78BFA" strokeWidth="2" opacity="0.8">
      <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite"/>
    </line>
    <path d="M30 61 L25 56 M30 61 L25 66" stroke="#A78BFA" strokeWidth="1" opacity="0.5"/>
    <path d="M130 61 L135 56 M130 61 L135 66" stroke="#A78BFA" strokeWidth="1" opacity="0.5"/>
  </svg>
);

const SERVICES_VISUAL = [
  { id:"3d",      label:"Impresión 3D",      sub:"FDM · SLA · SLS",               accent:"#F97316", Img:Illustration3D,      stat:"72h",    statLabel:"entrega express" },
  { id:"cnc",     label:"Mecanizado CNC",    sub:"Fresado · Torneado · Metal",     accent:"#60A5FA", Img:IllustrationCNC,     stat:"±0.1mm", statLabel:"tolerancia" },
  { id:"laser",   label:"Corte Láser",       sub:"CO₂ · Fibra · Alta precisión",  accent:"#34D399", Img:IllustrationLaser,   stat:"10x",    statLabel:"más rápido" },
  { id:"plastic", label:"Inyección Plástica",sub:"Moldes · Serie · Prototipo",     accent:"#A78BFA", Img:IllustrationPlastic, stat:"100+",   statLabel:"materiales" },
];

const STEPS = [
  { n:"01", title:"Describes tu idea",     desc:"Nuestro asistente IA te ayuda a crear un brief técnico preciso en minutos. Sin tecnicismos.", icon:"💬" },
  { n:"02", title:"Talleres cotizan",      desc:"Recibe ofertas reales de talleres verificados en Lima en menos de 24 horas.", icon:"🏭" },
  { n:"03", title:"Tú eliges y fabricas",  desc:"Compara, elige al mejor taller y recibe tu producto terminado.", icon:"✅" },
];

export default function Landing({ ctx }) {
  const { isInstallable, install, dismiss } = usePWAInstall();
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);
    await ctx.loginAsGuest(guestName);
    setLoading(false);
  };

  const goTaller = (register=false) => {
    ctx.setAuthType("taller");
    ctx.setIsRegister(register);
    ctx.setView("auth");
  };

  return (
    <div style={{ background:"#09090B", minHeight:"100vh", overflowX:"hidden", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#FAFAFA" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&display=swap');
        .lnd-primary{background:#F97316;color:#fff;border:none;border-radius:10px;padding:13px 28px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s}
        .lnd-primary:hover{background:#EA6906;transform:translateY(-1px);box-shadow:0 8px 24px rgba(249,115,22,.35)}
        .lnd-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .lnd-ghost{background:transparent;color:#A1A1AA;border:1px solid #27272A;border-radius:10px;padding:13px 28px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s}
        .lnd-ghost:hover{border-color:#F97316;color:#FAFAFA}
        .lnd-input{background:#0F0F11;border:1px solid #27272A;border-radius:10px;padding:13px 16px;color:#FAFAFA;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .2s;box-sizing:border-box}
        .lnd-input:focus{border-color:#F97316}
        .lnd-input::placeholder{color:#3F3F46}
        .svc-card{background:#18181B;border:1px solid #27272A;border-radius:16px;overflow:hidden;cursor:pointer;transition:all .25s}
        .svc-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,.5)}
        .dot-bg{background-image:radial-gradient(#27272A 1px,transparent 1px);background-size:26px 26px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .7s ease both}
        .fu2{animation:fadeUp .7s .15s ease both}
        .fu3{animation:fadeUp .7s .3s ease both}
        @media(max-width:768px){.about-grid{grid-template-columns:1fr!important}.svc-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:480px){.svc-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav style={{
        position:"sticky",top:0,zIndex:100,
        background: scrolled?"rgba(9,9,11,0.92)":"transparent",
        backdropFilter: scrolled?"blur(16px)":"none",
        borderBottom: scrolled?"1px solid #18181B":"none",
        transition:"all .3s",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 32px",height:60,
      }}>
        <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:"#F97316",letterSpacing:"-.02em"}}>
          LUMAJIRA<span style={{color:"#52525B",fontWeight:400}}>HUB</span>
        </span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {isInstallable && <button className="lnd-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={install}>⬇ Instalar</button>}
          <button className="lnd-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={()=>goTaller(false)}>Soy Taller</button>
          <button className="lnd-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={()=>{ctx.setAuthType("admin");ctx.setIsRegister(false);ctx.setView("auth");}}>🔐</button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="dot-bg" style={{minHeight:"92vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 24px 60px",textAlign:"center"}}>
        <div className="fu" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#18181B",border:"1px solid #27272A",borderRadius:20,padding:"5px 14px",marginBottom:20}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>
          <span style={{fontSize:11,fontWeight:700,color:"#71717A",textTransform:"uppercase",letterSpacing:".1em"}}>Lima · Manufactura a medida</span>
        </div>
        <h1 className="fu2" style={{fontFamily:"Syne,sans-serif",fontSize:"clamp(42px,7vw,84px)",fontWeight:800,lineHeight:1.0,letterSpacing:"-.04em",color:"#FAFAFA",maxWidth:780,marginBottom:22}}>
          Fabrica cualquier cosa.<br/><span style={{color:"#F97316"}}>Sin complicaciones.</span>
        </h1>
        <p className="fu3" style={{fontSize:17,color:"#71717A",lineHeight:1.65,maxWidth:440,marginBottom:48}}>
          Conectamos tu proyecto con los mejores talleres de manufactura en Lima. Rápido, preciso y sin intermediarios.
        </p>

        {/* Card de entrada */}
        <div className="fu3" style={{width:"100%",maxWidth:400,background:"#18181B",border:"1px solid #27272A",borderRadius:16,padding:26}}>
          <div style={{fontSize:12,fontWeight:700,color:"#71717A",marginBottom:12,textTransform:"uppercase",letterSpacing:".08em"}}>👤 Clientes — entrada libre</div>
          <form onSubmit={handleGuest} style={{display:"flex",flexDirection:"column",gap:10}}>
            <input className="lnd-input" placeholder="¿Cómo te llamas?" value={guestName} onChange={e=>setGuestName(e.target.value)}/>
            <button type="submit" className="lnd-primary" style={{width:"100%",padding:"14px"}} disabled={loading||!guestName.trim()}>
              {loading?"Ingresando...":"Publicar mi pedido →"}
            </button>
          </form>
          <div style={{marginTop:14,display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,height:1,background:"#27272A"}}/><span style={{fontSize:11,color:"#3F3F46"}}>¿Tienes un taller?</span><div style={{flex:1,height:1,background:"#27272A"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button className="lnd-ghost" style={{flex:1,padding:"9px",fontSize:12}} onClick={()=>goTaller(false)}>Ingresar</button>
            <button className="lnd-ghost" style={{flex:1,padding:"9px",fontSize:12}} onClick={()=>goTaller(true)}>Registrarse</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"flex",gap:40,marginTop:48,flexWrap:"wrap",justifyContent:"center"}}>
          {[["4","Servicios"],["Lima","Cobertura"],["5%","Comisión"],["24h","Respuesta"]].map(([v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800}}>{v}</div>
              <div style={{fontSize:11,color:"#52525B",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICIOS ────────────────────────────────────────────── */}
      <section style={{padding:"80px 32px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:700,color:"#F97316",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Lo que fabricamos</div>
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"clamp(26px,4vw,46px)",fontWeight:800,letterSpacing:"-.03em"}}>
            Tecnología de manufactura real
          </h2>
        </div>
        <div className="svc-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          {SERVICES_VISUAL.map(({id,label,sub,accent,Img,stat,statLabel})=>(
            <div key={id} className="svc-card" style={{borderTop:`3px solid ${accent}`}}
              onClick={()=>{ctx.setSelectedService({id,label,accent,icon:"▲",desc:sub});ctx.setView("serviceChat");}}>
              <div style={{height:140,padding:12}}><Img/></div>
              <div style={{padding:"0 16px 18px"}}>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,marginBottom:3}}>{label}</div>
                <div style={{fontSize:11,color:"#52525B",marginBottom:12}}>{sub}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:800,color:accent}}>{stat}</div>
                    <div style={{fontSize:10,color:"#52525B"}}>{statLabel}</div>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:accent}}>Pedir →</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ─────────────────────────────────────────── */}
      <section style={{padding:"80px 32px",background:"#0D0D0F",borderTop:"1px solid #18181B",borderBottom:"1px solid #18181B"}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:11,fontWeight:700,color:"#F97316",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Sin complicaciones</div>
            <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"clamp(24px,4vw,42px)",fontWeight:800,letterSpacing:"-.03em"}}>Tan simple como tres pasos</h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:44}}>
            {STEPS.map(({n,title,desc,icon})=>(
              <div key={n} style={{display:"flex",gap:20,alignItems:"flex-start"}}>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:44,fontWeight:800,color:"#1a1a1f",minWidth:66,lineHeight:1}}>{n}</div>
                <div style={{flex:1,paddingTop:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:20}}>{icon}</span>
                    <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18}}>{title}</div>
                  </div>
                  <div style={{fontSize:15,color:"#71717A",lineHeight:1.65}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ─────────────────────────────────────────── */}
      <section style={{padding:"80px 32px",maxWidth:1100,margin:"0 auto"}}>
        <div className="about-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}}>
          {/* Mapa animado */}
          <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",borderRadius:20,background:"#0F0F11",border:"1px solid #27272A"}}>
            <path d="M80 280 Q130 240 180 210 Q230 185 270 165 Q320 148 380 155" stroke="#1a1a1f" strokeWidth="50" fill="none" strokeLinecap="round"/>
            {[[180,210],[240,175],[305,152],[375,158],[205,242],[288,198]].map(([x,y],i)=>(
              <g key={i}>
                <circle cx={x} cy={y} r="14" fill="#F97316" fillOpacity="0.1"/>
                <circle cx={x} cy={y} r="5" fill="#F97316"/>
                <circle cx={x} cy={y} r="5" fill="#F97316" opacity="0.35">
                  <animate attributeName="r" values={`5;${16+i*2};5`} dur={`${2+i*0.35}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.35;0;0.35" dur={`${2+i*0.35}s`} repeatCount="indefinite"/>
                </circle>
              </g>
            ))}
            <line x1="180" y1="210" x2="240" y2="175" stroke="#F97316" strokeWidth="1" strokeDasharray="4 4" opacity="0.35"/>
            <line x1="240" y1="175" x2="305" y2="152" stroke="#F97316" strokeWidth="1" strokeDasharray="4 4" opacity="0.35"/>
            <line x1="240" y1="175" x2="205" y2="242" stroke="#F97316" strokeWidth="1" strokeDasharray="4 4" opacity="0.25"/>
            <text x="240" y="310" fill="#3F3F46" fontSize="13" fontFamily="sans-serif" textAnchor="middle">Lima Metropolitana · Red activa</text>
            <rect x="154" y="36" width="172" height="54" rx="12" fill="#18181B" stroke="#27272A"/>
            <text x="240" y="59" fill="#F97316" fontSize="12" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">LUMAJIRAHUB</text>
            <text x="240" y="76" fill="#52525B" fontSize="11" fontFamily="sans-serif" textAnchor="middle">Red de talleres · Lima</text>
          </svg>

          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#F97316",textTransform:"uppercase",letterSpacing:".1em",marginBottom:14}}>Quiénes somos</div>
            <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"clamp(22px,3vw,36px)",fontWeight:800,letterSpacing:"-.03em",marginBottom:18,lineHeight:1.1}}>
              La red de manufactura<br/>más conectada de Lima
            </h2>
            <p style={{fontSize:15,color:"#71717A",lineHeight:1.75,marginBottom:20}}>
              LumajiraHub nació para resolver un problema real: los clientes no saben dónde fabricar sus ideas y los talleres no encuentran clientes. Somos el puente.
            </p>
            <p style={{fontSize:15,color:"#71717A",lineHeight:1.75,marginBottom:28}}>
              Usamos inteligencia artificial para convertir tu idea en un brief técnico que los talleres cotizan con precisión. Sin reuniones, sin idas y vueltas.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                { bg:"#052e16", border:"#14532d", icon:"📞", label:"WhatsApp directo",
                  content: <a href="https://wa.me/51935211605" target="_blank" rel="noreferrer" style={{fontSize:18,fontWeight:800,color:"#4ade80",textDecoration:"none",fontFamily:"Syne,sans-serif"}}>935 211 605</a> },
                { bg:"#0c1a3a", border:"#1e3a6e", icon:"🌐", label:"Web",
                  content: <span style={{fontSize:14,fontWeight:700,color:"#93c5fd"}}>www.lumajirahub.com</span> },
                { bg:"#1c0a00", border:"#7c2d12", icon:"📍", label:"Cobertura",
                  content: <span style={{fontSize:14,fontWeight:700,color:"#fb923c"}}>Lima Metropolitana</span> },
              ].map(({bg,border,icon,label,content})=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:38,height:38,borderRadius:10,background:bg,border:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{icon}</div>
                  <div>
                    <div style={{fontSize:11,color:"#52525B",marginBottom:2}}>{label}</div>
                    {content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────── */}
      <section style={{padding:"80px 32px",textAlign:"center",background:"linear-gradient(180deg,#09090B 0%,#150900 100%)"}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"clamp(26px,4vw,50px)",fontWeight:800,letterSpacing:"-.03em",marginBottom:14}}>
            Tu idea merece<br/><span style={{color:"#F97316"}}>hacerse realidad.</span>
          </h2>
          <p style={{fontSize:16,color:"#71717A",lineHeight:1.65,marginBottom:32}}>
            Únete a los clientes que ya fabrican con LumajiraHub. Gratis para clientes.
          </p>
          <form onSubmit={handleGuest} style={{display:"flex",gap:10,maxWidth:360,margin:"0 auto",flexWrap:"wrap"}}>
            <input className="lnd-input" placeholder="Tu nombre..." value={guestName} onChange={e=>setGuestName(e.target.value)} style={{flex:1,minWidth:160}}/>
            <button type="submit" className="lnd-primary" disabled={loading||!guestName.trim()}>{loading?"...":"Empezar →"}</button>
          </form>
          <div style={{marginTop:18,fontSize:12,color:"#3F3F46"}}>
            ¿Tienes un taller?{" "}
            <button style={{background:"none",border:"none",color:"#F97316",cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:12}} onClick={()=>goTaller(true)}>
              Regístrate aquí
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{padding:"28px 32px",borderTop:"1px solid #18181B",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:15,color:"#F97316"}}>LUMAJIRA<span style={{color:"#3F3F46",fontWeight:400}}>HUB</span></span>
        <span style={{fontSize:12,color:"#3F3F46"}}>© 2026 LumajiraHub · Lima, Perú</span>
        <a href="https://wa.me/51935211605" target="_blank" rel="noreferrer" style={{fontSize:12,color:"#4ade80",textDecoration:"none",fontWeight:600}}>📞 935 211 605</a>
      </footer>

      {isInstallable && <InstallBanner onInstall={install} onDismiss={dismiss}/>}
    </div>
  );
}