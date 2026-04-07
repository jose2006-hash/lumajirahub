import { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { CAD_ACCEPT } from "../config";
import Nav from "./Nav";

// ── Llamada al proxy de Vercel ───────────────────────────────────
async function callAI(systemPrompt, messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      ],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

// ── Materiales con datos visuales ────────────────────────────────
const MATERIALS = {
  "3d": [
    { id:"pla",   name:"PLA",    color:"#34D399", icon:"🌿", desc:"Fácil de imprimir. Ideal para modelos decorativos, prototipos y piezas de baja carga.", pros:"Económico · Muchos colores · Biodegradable", cons:"No resistente al calor", best:"Figurillas, decoración, prototipos" },
    { id:"abs",   name:"ABS",    color:"#F97316", icon:"⚙️", desc:"Resistente y duradero. Bueno para piezas funcionales que soportan impactos.", pros:"Resistente · Mecanizable", cons:"Requiere recinto cerrado", best:"Piezas funcionales, carcasas" },
    { id:"petg",  name:"PETG",   color:"#60A5FA", icon:"💎", desc:"Lo mejor de PLA y ABS. Resistente al agua y químicos.", pros:"Flexible · Resistente agua", cons:"Stringing si mal calibrado", best:"Contenedores, piezas mecánicas" },
    { id:"tpu",   name:"TPU",    color:"#A78BFA", icon:"🤸", desc:"Flexible como goma. Perfecto para piezas que necesitan doblar.", pros:"Muy flexible · Resistente", cons:"Impresión lenta", best:"Fundas, juntas, sillas" },
    { id:"resin", name:"Resina", color:"#F59E0B", icon:"✨", desc:"Alta resolución. Para figuras detalladas y joyería.", pros:"Detalle extremo · Superficie suave", cons:"Frágil · Post-proceso", best:"Figurillas, joyería, miniaturas" },
  ],
  "cnc": [
    { id:"alum", name:"Aluminio", color:"#94A3B8", icon:"🔩", desc:"Ligero y resistente. El más usado en CNC para piezas funcionales.", pros:"Ligero · Mecanizable · Anticorrosivo", cons:"Costo medio", best:"Piezas mecánicas, soportes" },
    { id:"acero",name:"Acero",   color:"#64748B", icon:"⚙️", desc:"Máxima resistencia. Para piezas de alta exigencia.", pros:"Muy resistente · Duradero", cons:"Pesado · Más caro", best:"Ejes, engranajes, estructuras" },
    { id:"mad",  name:"Madera",  color:"#A16207", icon:"🌳", desc:"Ideal para CNC de corte y grabado. MDF, pino, cedro.", pros:"Económico · Fácil · Estético", cons:"No apto exterior sin tratar", best:"Mobiliario, señalética, decoración" },
    { id:"acri", name:"Acrílico",color:"#EC4899", icon:"🔮", desc:"Plástico rígido transparente o de colores. Excelente para displays.", pros:"Estético · Ligero · Colores", cons:"Se raya fácil", best:"Displays, señalética, maquetas" },
  ],
  "laser": [
    { id:"mdf",  name:"MDF",     color:"#A16207", icon:"🪵", desc:"El más popular para corte láser. Suave, fácil y económico.", pros:"Económico · Fácil corte", cons:"No apto humedad", best:"Packaging, decoración, maquetas" },
    { id:"acri2",name:"Acrílico",color:"#EC4899", icon:"💜", desc:"Corte preciso y grabado excelente. Transparente o de color.", pros:"Estético · Preciso", cons:"Bordes calientes al cortar", best:"Señalética, displays, joyas" },
    { id:"cuero",name:"Cuero",   color:"#92400E", icon:"👜", desc:"Grabado láser en cuero genuino o sintético.", pros:"Estético · Personalizable", cons:"Solo grabado (no corte profundo)", best:"Billeteras, fundas, regalos" },
    { id:"tela", name:"Tela",    color:"#7C3AED", icon:"🧵", desc:"Corte de precisión en tela sin deshilachado.", pros:"Corte limpio", cons:"Algunos materiales se queman", best:"Ropa, accesorios, bordados" },
  ],
  "plastic": [
    { id:"pp",   name:"Polipropileno", color:"#10B981", icon:"🥤", desc:"Resistente a químicos y flexión. El más usado en industria.", pros:"Resistente · Ligero · Económico", cons:"Difícil de pintar", best:"Envases, tapas, piezas industriales" },
    { id:"pe",   name:"Polietileno",   color:"#06B6D4", icon:"🧴", desc:"Muy flexible y resistente al impacto. Botellas, bolsas.", pros:"Flexible · Económico", cons:"Baja resistencia térmica", best:"Envases, tapas, juguetes" },
    { id:"abs2", name:"ABS",           color:"#F97316", icon:"⚙️", desc:"Rígido y resistente. El estándar en piezas de consumo.", pros:"Resistente · Fácil procesar", cons:"No resistente UV sin aditivos", best:"Electrodomésticos, carcasas, autos" },
    { id:"nylon",name:"Nylon",         color:"#8B5CF6", icon:"🔧", desc:"Alta resistencia mecánica y térmica. Para piezas de ingeniería.", pros:"Muy resistente · Duradero", cons:"Absorbe humedad", best:"Engranajes, rodamientos, piezas técnicas" },
  ],
};

// ── Quick reply suggestions por contexto ────────────────────────
const getQuickReplies = (text, serviceId) => {
  const t = text.toLowerCase();
  if (t.includes("material") || t.includes("¿qué material")) {
    return serviceId === "3d"
      ? ["PLA (económico)", "ABS (resistente)", "PETG (intermedio)", "Resina (detalle fino)"]
      : serviceId === "cnc"
      ? ["Aluminio", "Acero", "Madera", "Acrílico"]
      : serviceId === "laser"
      ? ["MDF", "Acrílico", "Cuero", "Tela"]
      : ["Polipropileno", "ABS", "Nylon", "Polietileno"];
  }
  if (t.includes("dimensi") || t.includes("medida") || t.includes("tamaño")) {
    return ["Muy pequeño (<5cm)", "Pequeño (5-15cm)", "Mediano (15-30cm)", "Grande (>30cm)"];
  }
  if (t.includes("cantidad") || t.includes("cuántas") || t.includes("unidades")) {
    return ["1-5 unidades", "6-20 unidades", "21-100 unidades", "Más de 100"];
  }
  if (t.includes("plazo") || t.includes("cuándo") || t.includes("urgente")) {
    return ["Urgente (1-3 días)", "Normal (1 semana)", "Sin prisa (2+ semanas)"];
  }
  if (t.includes("uso") || t.includes("para qué")) {
    return ["Uso personal", "Regalo", "Prototipo/prueba", "Producción/venta"];
  }
  if (t.includes("acabado") || t.includes("pintura") || t.includes("color")) {
    return ["Sin acabado", "Pintado de un color", "Varios colores", "Acabado premium"];
  }
  return [];
};

// ── Detecta si la pieza es compleja ─────────────────────────────
const isComplex = (text) => {
  const keywords = ["pokemon","figura","anime","cartoon","personaje","logo","marca","relieve","grabado","detall","escultura","3d scan","cad","stl","step","diseño"];
  return keywords.some(k => text.toLowerCase().includes(k));
};

// ── Detecta IP de personaje ──────────────────────────────────────
const isLicensed = (text) => {
  const chars = ["pokemon","pikachu","mario","disney","marvel","dc comic","naruto","dragon ball","minion","sonic","star wars","batman","spiderman","one piece","looney","peppa"];
  return chars.some(k => text.toLowerCase().includes(k));
};

// ── Chip de sugerencia ───────────────────────────────────────────
const Chip = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    background:"#18181B", border:"1px solid #27272A", borderRadius:20,
    padding:"7px 14px", fontSize:12, fontWeight:600, color:"#A1A1AA",
    cursor:"pointer", transition:"all .15s", fontFamily:"inherit",
    whiteSpace:"nowrap",
  }}
    onMouseEnter={e=>{e.target.style.borderColor="#F97316";e.target.style.color="#FAFAFA";}}
    onMouseLeave={e=>{e.target.style.borderColor="#27272A";e.target.style.color="#A1A1AA";}}
  >
    {label}
  </button>
);

// ── Tarjeta de material ──────────────────────────────────────────
const MaterialCard = ({ mat, accent, onSelect }) => (
  <div onClick={()=>onSelect(mat.name)} style={{
    background:"#18181B", border:`1px solid #27272A`, borderRadius:12,
    padding:"14px 16px", cursor:"pointer", transition:"all .2s",
    borderLeft:`3px solid ${mat.color}`,
  }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=mat.color;e.currentTarget.style.transform="translateY(-2px)";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor="#27272A";e.currentTarget.style.borderLeftColor=mat.color;e.currentTarget.style.transform="none";}}
  >
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span style={{fontSize:20}}>{mat.icon}</span>
      <span style={{fontWeight:800,fontSize:14,color:mat.color}}>{mat.name}</span>
    </div>
    <div style={{fontSize:12,color:"#A1A1AA",lineHeight:1.5,marginBottom:8}}>{mat.desc}</div>
    <div style={{fontSize:11,color:"#52525B"}}>✅ {mat.best}</div>
  </div>
);

// ── Banner de upload ─────────────────────────────────────────────
const UploadHint = ({ onUpload, isLic }) => (
  <div style={{background:"#0c1a3a",border:"1px solid #1e3a6e",borderRadius:12,padding:16,marginTop:8}}>
    <div style={{fontSize:13,fontWeight:700,color:"#93c5fd",marginBottom:6}}>
      {isLic ? "⚠️ Personaje con derechos de autor" : "📐 Pieza compleja detectada"}
    </div>
    <div style={{fontSize:12,color:"#71717A",lineHeight:1.55,marginBottom:12}}>
      {isLic
        ? "Para reproducir personajes con copyright necesitas el archivo 3D original o autorización. Te recomendamos subir tu propio diseño CAD."
        : "Para piezas con alto detalle o geometría compleja, subir un archivo CAD (STL, STEP, OBJ) garantiza que los talleres cotizan exactamente lo que necesitas."
      }
    </div>
    <button onClick={onUpload} style={{
      background:"#1e3a6e",border:"1px solid #2563eb",borderRadius:8,
      padding:"8px 16px",fontSize:12,fontWeight:700,color:"#93c5fd",
      cursor:"pointer",fontFamily:"inherit",
    }}>
      📁 Subir archivo CAD / diseño
    </button>
  </div>
);

// ── Mensaje del chat ─────────────────────────────────────────────
const Bubble = ({ msg, svc, onChip, onMaterial, onUpload, showMats, showUpload, chips, isLic }) => {
  const isBot = msg.role === "assistant";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isBot?"flex-start":"flex-end",gap:6}}>
      <div style={{
        background: isBot ? "#27272A" : "#F97316",
        color:"#FAFAFA",
        borderRadius: isBot ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
        padding:"12px 16px", maxWidth:"80%",
        fontSize:14, lineHeight:1.55, whiteSpace:"pre-wrap",
      }}>
        {msg.content}
      </div>

      {/* Materiales visuales */}
      {isBot && showMats && MATERIALS[svc.id] && (
        <div style={{width:"100%",maxWidth:480}}>
          <div style={{fontSize:11,fontWeight:700,color:"#71717A",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,paddingLeft:4}}>
            Elige el material →
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {MATERIALS[svc.id].map(m=>(
              <MaterialCard key={m.id} mat={m} accent={svc.accent} onSelect={onMaterial}/>
            ))}
          </div>
        </div>
      )}

      {/* Upload hint */}
      {isBot && showUpload && (
        <div style={{width:"100%",maxWidth:480}}>
          <UploadHint onUpload={onUpload} isLic={isLic}/>
        </div>
      )}

      {/* Quick reply chips */}
      {isBot && chips && chips.length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:6,maxWidth:500}}>
          {chips.map(c=><Chip key={c} label={c} onClick={()=>onChip(c)}/>)}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function ServiceChat({ ctx }) {
  const svc = ctx.selectedService;
  const [msgs, setMsgs] = useState([
    {
      role:"assistant",
      content:`¡Hola! Soy tu asistente para ${svc?.label}. 👋\n\n¿Qué necesitas fabricar? Puedes describirlo con tus propias palabras, sin tecnicismos — yo te ayudo a armar el pedido perfecto.`,
      chips:["Quiero una figura/figurilla","Necesito una pieza funcional","Es para un prototipo","Tengo un diseño listo"],
      showMats:false, showUpload:false, isLic:false,
    }
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

  useEffect(()=>{
    if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  },[msgs]);

  const SYSTEM = `Eres un asistente experto y empático en manufactura para el servicio "${svc?.label}". Tu objetivo es obtener todos los datos técnicos para un brief de fabricación de manera conversacional y amigable.

Responde SIEMPRE en JSON con esta estructura exacta (sin markdown):
{
  "message": "Tu respuesta amigable aquí",
  "showMaterials": true/false (true cuando preguntes o hables de materiales),
  "showUpload": true/false (true cuando la pieza sea compleja o detectes personajes/logos),
  "chips": ["opción1","opción2","opción3"] (máximo 4 opciones rápidas relevantes, o [] si no aplica),
  "brief": null o {"titulo":"...","descripcion":"...","especificaciones":{...},"cantidad":N,"plazo_estimado":"...","presupuesto_referencial":"...","notas_adicionales":"..."} (solo cuando tengas SUFICIENTE info: material + dimensiones + cantidad + uso)
}

Reglas:
- Sé muy amigable y usa emojis ocasionalmente
- Haz UNA sola pregunta a la vez
- Si mencionan personajes famosos (Pokemon, Disney, etc), pon showUpload:true y advierte sobre copyright
- Si la pieza suena compleja, pon showUpload:true
- Cuando preguntes por material, pon showMaterials:true
- NO pongas "brief" hasta tener material + dimensiones + cantidad + uso final
- Cuando tengas todo, genera el brief completo
- Habla siempre en español peruano casual`;

  const send = async (text) => {
    const content = text || input;
    if (!content.trim() || loading) return;
    const next = [...msgs, { role:"user", content }];
    setMsgs(next);
    setInput("");
    setLoading(true);

    try {
      const raw = await callAI(SYSTEM, next.map(m=>({role:m.role,content:m.content})));
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : { message: raw, showMaterials:false, showUpload:false, chips:[] };
      }

      const userText = content.toLowerCase();
      const detectedComplex = isComplex(userText);
      const detectedLic     = isLicensed(userText);
      const autoChips       = parsed.chips?.length ? parsed.chips : getQuickReplies(parsed.message, svc?.id);

      const botMsg = {
        role:"assistant",
        content: parsed.message || "Sin respuesta.",
        showMats:   parsed.showMaterials || false,
        showUpload: parsed.showUpload || detectedComplex || detectedLic,
        isLic:      detectedLic,
        chips:      autoChips,
      };

      setMsgs(p=>[...p, botMsg]);

      if (parsed.brief) {
        setBrief(parsed.brief);
        setProgress(4);
        setTimeout(()=>setStep("review"), 800);
      } else {
        if (next.length >= 4) setProgress(2);
        if (next.length >= 6) setProgress(3);
      }

    } catch(err) {
      setMsgs(p=>[...p,{role:"assistant",content:`⚠️ Error: ${err.message}`,chips:[],showMats:false,showUpload:false}]);
    }
    setLoading(false);
  };

  const handleImg = e => {
    Array.from(e.target.files).forEach(file=>{
      const r = new FileReader();
      r.onload = ev => setImages(p=>[...p,{name:file.name,data:ev.target.result}]);
      r.readAsDataURL(file);
    });
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await addDoc(collection(db,"orders"),{
        userId:ctx.user.id, userName:ctx.user.name,
        service:svc?.id, serviceName:svc?.label,
        brief, images:images.map(i=>i.name),
        audio:audio?.name||null, cadFile:cadFile?.name||null,
        status:"open", createdAt:serverTimestamp(),
      });
      ctx.showToast("¡Pedido publicado! Los talleres ya pueden cotizarlo.");
      ctx.setView("myOrders");
    } catch(e){ ctx.showToast("Error: "+e.message,"err"); }
    setPublishing(false);
  };

  const STEPS = ["Tipo de servicio","Descripción","Especificaciones","Brief completo"];

  const hiddenInputs = (
    <>
      <input ref={imgRef} type="file" multiple accept="image/*" style={{display:"none"}} onChange={handleImg}/>
      <input ref={audRef} type="file" accept="audio/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])setAudio({name:e.target.files[0].name});}}/>
      <input ref={cadRef} type="file" accept={CAD_ACCEPT} style={{display:"none"}} onChange={e=>{if(e.target.files[0])setCadFile({name:e.target.files[0].name});}}/>
    </>
  );

  // ── REVIEW ──────────────────────────────────────────────────────
  if (step === "review" && brief) return (
    <div>
      <Nav ctx={ctx} title={svc?.label} showBack/>
      {hiddenInputs}
      <div className="page" style={{maxWidth:700}}>
        <div style={{marginBottom:24}}>
          <div className="section-title">¡Listo! Revisa tu pedido</div>
          <div className="section-sub">El asistente preparó tu solicitud técnica.</div>
        </div>
        <div className="card" style={{padding:26,marginBottom:18,borderLeft:`3px solid ${svc?.accent}`}}>
          <div style={{fontWeight:800,fontSize:17,color:svc?.accent,marginBottom:10}}>{brief.titulo}</div>
          <div style={{fontSize:14,color:"#A1A1AA",lineHeight:1.65,marginBottom:14}}>{brief.descripcion}</div>
          {brief.especificaciones && Object.keys(brief.especificaciones).length>0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {Object.entries(brief.especificaciones).map(([k,v])=><span key={k} className="tag">{k}: {String(v)}</span>)}
            </div>
          )}
          <div style={{display:"flex",flexWrap:"wrap",gap:16,fontSize:13,color:"#71717A"}}>
            <span>📦 {brief.cantidad} und.</span>
            <span>📅 {brief.plazo_estimado}</span>
            <span>💰 {brief.presupuesto_referencial}</span>
          </div>
        </div>
        <div className="card" style={{padding:22,marginBottom:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>📎 Adjuntos</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn-ghost btn-sm" onClick={()=>imgRef.current.click()}>🖼️ Imágenes {images.length>0?`(${images.length})`:""}</button>
            <button className="btn-ghost btn-sm" onClick={()=>audRef.current.click()}>🎙️ {audio?audio.name:"Audio"}</button>
            <button className="btn-ghost btn-sm" onClick={()=>cadRef.current.click()}>📐 {cadFile?cadFile.name:"Archivo CAD"}</button>
          </div>
          {images.length>0&&(
            <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
              {images.map((img,i)=>(
                <div key={i} style={{position:"relative"}}>
                  <img src={img.data} alt="" style={{width:70,height:70,objectFit:"cover",borderRadius:8,border:"1px solid #27272A"}}/>
                  <button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:-5,right:-5,background:"#EF4444",border:"none",borderRadius:"50%",width:17,height:17,cursor:"pointer",color:"#fff",fontSize:9}}>✕</button>
                </div>
              ))}
            </div>
          )}
          {cadFile&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,background:"#0F0F11",borderRadius:8,padding:"8px 12px"}}><span>📐</span><span style={{fontSize:12,color:"#A1A1AA"}}>{cadFile.name}</span><button onClick={()=>setCadFile(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"#71717A",cursor:"pointer"}}>✕</button></div>}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn-primary" style={{flex:1,padding:"12px 20px",fontSize:14}} onClick={publish} disabled={publishing}>
            {publishing?<span className="spinner"/>:"🚀 Publicar pedido"}
          </button>
          <button className="btn-ghost" onClick={()=>setStep("chat")}>← Editar</button>
        </div>
      </div>
    </div>
  );

  // ── CHAT ────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#09090B"}}>
      <Nav ctx={ctx} title={svc?.label} showBack/>
      {hiddenInputs}
      <div style={{flex:1,overflow:"hidden",display:"flex",maxWidth:1020,margin:"0 auto",width:"100%",padding:"16px 24px",gap:18}}>

        {/* ── Panel chat ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",background:"#111113",borderRadius:16,border:"1px solid #27272A",overflow:"hidden"}}>
          {/* Header */}
          <div style={{padding:"14px 18px",borderBottom:"1px solid #27272A",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${svc?.accent}22`,border:`1px solid ${svc?.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:svc?.accent}}>
              {svc?.icon}
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:svc?.accent}}>{svc?.label}</div>
              <div style={{fontSize:11,color:"#52525B"}}>Asistente IA · GPT-4o</div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
              <button className="btn-ghost btn-sm" onClick={()=>imgRef.current?.click()} title="Imágenes">🖼️{images.length>0?` ${images.length}`:""}</button>
              <button className="btn-ghost btn-sm" onClick={()=>cadRef.current?.click()} title="CAD">{cadFile?"📐✓":"📐"}</button>
            </div>
          </div>

          {/* Mensajes */}
          <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"18px 18px",display:"flex",flexDirection:"column",gap:16,scrollbarWidth:"thin"}}>
            {msgs.map((m,i)=>(
              <Bubble key={i} msg={m} svc={svc}
                chips={m.chips||[]}
                showMats={m.showMats}
                showUpload={m.showUpload}
                isLic={m.isLic}
                onChip={text=>{setInput("");send(text);}}
                onMaterial={mat=>{setInput("");send(`Quiero usar ${mat}`);}}
                onUpload={()=>cadRef.current?.click()}
              />
            ))}
            {loading&&(
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{background:"#27272A",borderRadius:"18px 18px 18px 4px",padding:"12px 16px",display:"flex",gap:4}}>
                  {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:svc?.accent,display:"inline-block",animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>)}
                </div>
                <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{padding:"12px 14px",borderTop:"1px solid #27272A",display:"flex",gap:8}}>
            <input
              className="input"
              placeholder="Escribe tu respuesta..."
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
              disabled={loading}
              style={{flex:1,background:"#0F0F11"}}
            />
            <button className="btn-primary" style={{padding:"10px 18px",borderRadius:10}} onClick={()=>send()} disabled={loading||!input.trim()}>→</button>
          </div>

          {msgs.filter(m=>m.role==="user").length>=4&&!brief&&(
            <div style={{padding:"8px 14px",background:"#0a0a0c",textAlign:"center",borderTop:"1px solid #18181B"}}>
              <button className="btn-ghost btn-sm" onClick={()=>{
                const desc = msgs.filter(m=>m.role==="user").map(m=>m.content).join(". ");
                setBrief({titulo:`Pedido de ${svc?.label}`,descripcion:desc,especificaciones:{},cantidad:1,plazo_estimado:"A definir",presupuesto_referencial:"A consultar",notas_adicionales:""});
                setProgress(4); setStep("review");
              }} style={{fontSize:12}}>
                Generar brief con la info actual →
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div style={{width:200,display:"flex",flexDirection:"column",gap:14}}>
          <div className="card" style={{padding:18}}>
            <div style={{fontSize:11,fontWeight:700,color:"#52525B",textTransform:"uppercase",letterSpacing:".08em",marginBottom:14}}>Progreso</div>
            {STEPS.map((label,i)=>{
              const st = i<progress?"done":i===progress-1?"active":"todo";
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{
                    width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,fontWeight:800,flexShrink:0,
                    background: st==="done"?svc?.accent:st==="active"?"#27272A":"#18181B",
                    border: st==="active"?`2px solid ${svc?.accent}`:st==="done"?"none":"1px solid #27272A",
                    color: st==="done"?"#fff":st==="active"?svc?.accent:"#52525B",
                  }}>
                    {st==="done"?"✓":i+1}
                  </div>
                  <span style={{fontSize:12,color:st==="todo"?"#3F3F46":st==="done"?"#FAFAFA":svc?.accent,lineHeight:1.3}}>{label}</span>
                </div>
              );
            })}
          </div>

          <div className="card" style={{padding:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#52525B",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>Adjuntos</div>
            {[
              {label:`🖼️ Imágenes${images.length>0?` (${images.length})`:""}`,action:()=>imgRef.current?.click()},
              {label:`🎙️ ${audio?"✓ Audio":"Audio"}`,action:()=>audRef.current?.click()},
              {label:`📐 ${cadFile?"✓ CAD":"Archivo CAD"}`,action:()=>cadRef.current?.click()},
            ].map(({label,action})=>(
              <button key={label} className="btn-ghost" style={{width:"100%",fontSize:11,marginBottom:6,padding:"7px 10px",textAlign:"left"}} onClick={action}>{label}</button>
            ))}
          </div>

          <div style={{background:"#0c1a3a",border:"1px solid #1e3a6e",borderRadius:12,padding:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#93c5fd",marginBottom:6}}>💡 Tip</div>
            <div style={{fontSize:11,color:"#71717A",lineHeight:1.5}}>Si tienes un archivo STL, STEP o diseño en Canva, súbelo para una cotización más precisa.</div>
          </div>
        </div>
      </div>
    </div>
  );
}