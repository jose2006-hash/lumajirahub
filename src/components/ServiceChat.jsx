import { useState, useRef, useEffect, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { CAD_ACCEPT } from "../config";
import Nav from "./Nav";

async function callAI(messages) {
  const res = await fetch("/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"gpt-4o", max_tokens:1200, messages }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

const MATS = {
  metalmecanica: [
    { id: "acero", name: "Acero al carbono", emoji: "🔩", color: "#636366", sub: "Versátil · Soldable", best: "Estructuras, ejes, refacciones comunes" },
    { id: "inox", name: "Acero inoxidable", emoji: "✨", color: "#94A3B8", sub: "Corrosión · Higiene", best: "Valvulería, alimentos, exterior" },
    { id: "alum", name: "Aluminio", emoji: "⚡", color: "#98989D", sub: "Ligero · Mecanizable", best: "Soportes, carcasas, piezas livianas" },
    { id: "bronce", name: "Bronce / latón", emoji: "🟤", color: "#B45309", sub: "Desgaste · Buje", best: "Bujes, casquillos, piezas de fricción" },
    { id: "fund", name: "Fundición / hierro", emoji: "🏗", color: "#57534E", sub: "Piezas gruesas", best: "Bases, contrapesos, piezas pesadas" },
  ],
};

const LIC_KW = ["pokemon","disney","marvel","dc ","naruto","anime","figura","figurilla","personaje","cartoon","funko","lego","one piece","dragon ball","spiderman","batman","sonic","mario","pikachu","minion"];
const CMP_KW = ["tolerancia","rosca","engranaje","chavetero","keyway","rectificado","fresa","torno","soldadura","dxf","dwg","plano","step","iges","eje","buje","casquillo"];
const detectLic = t => LIC_KW.some(k=>t.toLowerCase().includes(k));
const detectCmp = t => CMP_KW.some(k=>t.toLowerCase().includes(k));

const ctxChips = (botText) => {
  const t = botText.toLowerCase();
  if (t.includes("material") || t.includes("aleación") || t.includes("aleacion")) return ["Acero al carbono", "Acero inoxidable", "Aluminio", "Bronce / latón"];
  if (t.includes("cantidad")||t.includes("cuántas")||t.includes("unidades")) return ["1 pieza","2-5","6-20","Serie mayor"];
  if (t.includes("dimensi")||t.includes("medida")||t.includes("tamaño")||t.includes("diámetro")||t.includes("diametro")) return ["<10 cm","10-30 cm","30-60 cm",">60 cm"];
  if (t.includes("plazo")||t.includes("urgente")||t.includes("cuándo")) return ["Urgente (1-3 días)","1 semana","2-3 semanas","Sin apuro"];
  if (t.includes("trabajo")||t.includes("repar")||t.includes("fabric")) return ["Solo reparación","Solo fabricación nueva","Réplica por muestra","Por plano"];
  if (t.includes("acabado")||t.includes("tratamiento")||t.includes("pintura")||t.includes("galvan")) return ["Sin tratamiento","Pintura","Zincado / galvanizado","Pulido"];
  return [];
};

const TypingDots = ({accent}) => (
  <div style={{display:"flex",gap:5,padding:"13px 15px",background:"var(--ink-2)",border:"1px solid var(--ink-3)",borderRadius:"20px 20px 20px 5px",width:"fit-content"}}>
    {[0,1,2].map(i=>(
      <span key={i} style={{width:7,height:7,borderRadius:"50%",background:accent||"var(--accent)",display:"inline-block",animation:`typingDot 1.2s ${i*0.2}s infinite`}}/>
    ))}
  </div>
);

const Chip = ({label,onClick}) => (
  <button className="chip" onClick={()=>onClick(label)}>{label}</button>
);

const MatCard = ({mat,onSelect}) => (
  <button onClick={()=>onSelect(mat.name)} style={{
    background:"var(--ink-2)",border:`1px solid var(--ink-3)`,borderLeft:`3px solid ${mat.color}`,
    borderRadius:14,padding:"13px 14px",cursor:"pointer",textAlign:"left",width:"100%",
    transition:"all .2s var(--spring)",fontFamily:"inherit",
  }}
    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="var(--shadow)";}}
    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}
  >
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
      <span style={{fontSize:18}}>{mat.emoji}</span>
      <span style={{fontWeight:700,fontSize:13,color:mat.color}}>{mat.name}</span>
    </div>
    <div style={{fontSize:11,color:"var(--fog)",marginBottom:4}}>{mat.sub}</div>
    <div style={{fontSize:11,color:"var(--mist)"}}>✅ {mat.best}</div>
  </button>
);

const UploadHint = ({onUpload,licensed}) => (
  <div style={{background:"rgba(10,132,255,.07)",border:"1px solid rgba(10,132,255,.2)",borderRadius:14,padding:"15px 17px",animation:"bubbleIn .3s var(--spring) both"}}>
    <div style={{fontWeight:700,fontSize:13,color:"#0A84FF",marginBottom:6}}>
      {licensed?"⚠️ Personaje con derechos de autor":"📐 Pieza compleja — sube tu diseño"}
    </div>
    <div style={{fontSize:12,color:"var(--mist)",lineHeight:1.6,marginBottom:12}}>
      {licensed
        ?"Si el diseño no es tuyo, necesitas autorización o planos con derechos resueltos. Sube plano o documento técnico para cotizar bien."
        :"Plano (PDF/DXF), STEP o fotos claras con medidas ayudan a cotizar reparaciones y piezas nuevas con precisión."
      }
    </div>
    <button onClick={onUpload} style={{background:"rgba(10,132,255,.15)",border:"1px solid rgba(10,132,255,.3)",borderRadius:9,padding:"8px 16px",fontSize:12,fontWeight:600,color:"#0A84FF",cursor:"pointer",fontFamily:"inherit"}}>
      📁 Subir archivo →
    </button>
  </div>
);

const Bubble = ({msg,svc,onChip,onMatSelect,onUpload}) => {
  const isBot = msg.role==="assistant";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:isBot?"flex-start":"flex-end",gap:10}}>
      <div className={isBot?"bubble-bot":"bubble-me"}>{msg.content}</div>
      {isBot&&msg.showMats&&MATS[svc?.id]&&(
        <div style={{width:"100%",maxWidth:460,animation:"bubbleIn .3s var(--spring) both"}}>
          <div style={{fontSize:11,fontWeight:600,color:"var(--mist)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Elige el material →</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {MATS[svc.id].map(m=><MatCard key={m.id} mat={m} onSelect={onMatSelect}/>)}
          </div>
        </div>
      )}
      {isBot&&msg.showUpload&&(
        <div style={{width:"100%",maxWidth:460}}>
          <UploadHint onUpload={onUpload} licensed={msg.licensed}/>
        </div>
      )}
      {isBot&&msg.chips?.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:7,maxWidth:480,animation:"bubbleIn .35s .1s var(--spring) both"}}>
          {msg.chips.map(c=><Chip key={c} label={c} onClick={onChip}/>)}
        </div>
      )}
    </div>
  );
};

export default function ServiceChat({ctx}) {
  const svc = ctx.selectedService;

  const buildSystem = () => `Eres un asistente de taller metalmecánico para "${svc?.label}" (reparación y fabricación de piezas). Filosofía: UNA pregunta a la vez, cálido, claro, experto.

Responde SIEMPRE en JSON (sin markdown):
{"message":"...","showMaterials":bool,"showUpload":bool,"chips":["..."],"brief":null|{...}}

El brief solo cuando tengas: material o tipo de metal + tipo de trabajo (reparar vs fabricar) + dimensiones o medidas aproximadas + cantidad. Estructura del brief:
{"titulo":"...","descripcion":"...","especificaciones":{"material":"...","dimensiones":"...","proceso":"reparación|fabricación","acabado":"..."},"cantidad":N,"plazo_estimado":"...","presupuesto_referencial":"...","notas_adicionales":"..."}

- showMaterials: true cuando convenga elegir material (acero, inox, aluminio, etc.)
- showUpload: true si faltan planos/medidas y conviene subir PDF, DXF, STEP o fotos
- chips: máximo 4 opciones rápidas relevantes o []
- Recomienda material según uso (exterior/humedad → inox; liviano → aluminio; buje/desgaste → bronce; estructura general → acero al carbono)
- Enfócate solo en metalmecánica: reparación y fabricación de piezas metálicas
- Habla en español casual peruano, emojis con moderación`;

  const [msgs,setMsgs] = useState([{
    role:"assistant",
    content:`¡Hola! 👋 ¿Necesitas reparar una pieza o fabricar una nueva?\n\nCuéntame qué equipo o máquina es, qué falló o qué dibujo tienes — armamos el pedido para los talleres.`,
    chips:["Reparar una pieza rota","Fabricar por plano","Réplica / refacción","Varias piezas iguales"],
    showMats:false,showUpload:false,licensed:false,
  }]);
  const [input,setInput]     = useState("");
  const [loading,setLoading] = useState(false);
  const [brief,setBrief]     = useState(null);
  const [images,setImages]   = useState([]);
  const [audio,setAudio]     = useState(null);
  const [cadFile,setCadFile] = useState(null);
  const [step,setStep]       = useState("chat");
  const [progress,setProgress] = useState(1);
  const [publishing,setPublishing] = useState(false);
  const chatRef = useRef(null);
  const imgRef  = useRef(null);
  const audRef  = useRef(null);
  const cadRef  = useRef(null);

  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTo({top:chatRef.current.scrollHeight,behavior:"smooth"});},[msgs,loading]);

  const send = useCallback(async(text)=>{
    const content=(text??input).trim();
    if(!content||loading)return;
    setInput("");
    const history=[...msgs,{role:"user",content}];
    setMsgs(history);
    setLoading(true);
    try {
      const apiMsgs=[{role:"system",content:buildSystem()},...history.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content}))];
      const raw=await callAI(apiMsgs);
      let parsed;
      try{parsed=JSON.parse(raw);}catch{const m=raw.match(/\{[\s\S]*\}/);parsed=m?JSON.parse(m[0]):{message:raw,showMaterials:false,showUpload:false,chips:[]};}
      const isLic=detectLic(content);
      const isCmp=detectCmp(content);
      const chips=parsed.chips?.length?parsed.chips:ctxChips(parsed.message||"");
      setMsgs(p=>[...p,{role:"assistant",content:parsed.message||"Sin respuesta.",showMats:!!parsed.showMaterials,showUpload:!!(parsed.showUpload||isLic||isCmp),licensed:isLic,chips}]);
      if(parsed.brief){setBrief(parsed.brief);setProgress(4);setTimeout(()=>setStep("review"),600);}
      else{if(history.length>=4)setProgress(2);if(history.length>=7)setProgress(3);}
    }catch(err){
      setMsgs(p=>[...p,{role:"assistant",content:`⚠️ ${err.message}`,chips:[],showMats:false,showUpload:false}]);
    }
    setLoading(false);
  },[input, msgs, loading, svc]);

  const handleImg=e=>Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>setImages(p=>[...p,{name:f.name,data:ev.target.result}]);r.readAsDataURL(f);});

  const publish=async()=>{
    setPublishing(true);
    try{
      await addDoc(collection(db,"orders"),{userId:ctx.user.id,userName:ctx.user.name,service:svc?.id,serviceName:svc?.label,brief,images:images.map(i=>i.name),audio:audio?.name||null,cadFile:cadFile?.name||null,status:"open",createdAt:serverTimestamp()});
      ctx.showToast("¡Pedido publicado!");ctx.setView("myOrders");
    }catch(e){ctx.showToast("Error: "+e.message,"err");}
    setPublishing(false);
  };

  const STEPS=["Servicio","Descripción","Especificaciones","Brief"];
  const hidden=(
    <>
      <input ref={imgRef} type="file" multiple accept="image/*" style={{display:"none"}} onChange={handleImg}/>
      <input ref={audRef} type="file" accept="audio/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])setAudio({name:e.target.files[0].name});}}/>
      <input ref={cadRef} type="file" accept={CAD_ACCEPT} style={{display:"none"}} onChange={e=>{if(e.target.files[0])setCadFile({name:e.target.files[0].name});}}/>
    </>
  );

  // REVIEW
  if(step==="review"&&brief) return(
    <div style={{minHeight:"100vh",background:"var(--ink)"}}>
      <Nav ctx={ctx} title={svc?.label} showBack/>{hidden}
      <div className="page" style={{maxWidth:660}}>
        <div style={{textAlign:"center",paddingTop:8,marginBottom:32}}>
          <div style={{fontSize:44,marginBottom:12}}>✅</div>
          <h1 className="section-title">Tu pedido está listo</h1>
          <p className="section-sub">Revísalo y publícalo para recibir cotizaciones</p>
        </div>
        <div style={{background:"var(--ink-2)",borderRadius:20,padding:26,border:`1px solid ${svc?.accent}25`,boxShadow:`0 0 0 1px ${svc?.accent}10,0 20px 60px rgba(0,0,0,.3)`,marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${svc?.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:svc?.accent}}>{svc?.icon}</div>
            <div>
              <div style={{fontFamily:"var(--font-display)",fontSize:17,color:svc?.accent}}>{brief.titulo}</div>
              <div style={{fontSize:12,color:"var(--mist)"}}>{svc?.label}</div>
            </div>
          </div>
          <p style={{fontSize:14,color:"var(--fog)",lineHeight:1.65,marginBottom:16}}>{brief.descripcion}</p>
          {brief.especificaciones&&Object.keys(brief.especificaciones).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
              {Object.entries(brief.especificaciones).map(([k,v])=><span key={k} className="tag">{k}: {String(v)}</span>)}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["📦","Cantidad",String(brief.cantidad)+" und."],["📅","Plazo",brief.plazo_estimado],["💰","Referencia",brief.presupuesto_referencial]].map(([icon,label,val])=>(
              <div key={label} style={{background:"var(--ink-3)",borderRadius:12,padding:"10px 13px"}}>
                <div style={{fontSize:15,marginBottom:3}}>{icon}</div>
                <div style={{fontSize:10,color:"var(--mist)",marginBottom:1}}>{label}</div>
                <div style={{fontSize:12,fontWeight:600}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:"var(--ink-2)",borderRadius:16,padding:18,marginBottom:18,border:"1px solid var(--ink-3)"}}>
          <div style={{fontWeight:700,marginBottom:12,fontSize:13}}>📎 Adjuntos <span style={{color:"var(--mist)",fontWeight:400}}>(opcionales)</span></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn-ghost btn-sm" onClick={()=>imgRef.current.click()}>🖼️ {images.length>0?`${images.length} imagen(es)`:"Imágenes"}</button>
            <button className="btn-ghost btn-sm" onClick={()=>audRef.current.click()}>🎙️ {audio?audio.name:"Audio"}</button>
            <button className="btn-ghost btn-sm" onClick={()=>cadRef.current.click()}>📐 {cadFile?cadFile.name:"Plano / CAD"}</button>
          </div>
          {images.length>0&&<div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>{images.map((img,i)=>(<div key={i} style={{position:"relative"}}><img src={img.data} alt="" style={{width:60,height:60,objectFit:"cover",borderRadius:9,border:"1px solid var(--ink-3)"}}/><button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:-5,right:-5,background:"#FF453A",border:"none",borderRadius:"50%",width:17,height:17,cursor:"pointer",color:"#fff",fontSize:9}}>✕</button></div>))}</div>}
          {cadFile&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:8,background:"var(--ink-3)",borderRadius:9,padding:"7px 12px"}}><span>📐</span><span style={{fontSize:12,color:"var(--fog)"}}>{cadFile.name}</span><button onClick={()=>setCadFile(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--mist)",cursor:"pointer"}}>✕</button></div>}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn-primary" style={{flex:1,padding:"14px",fontSize:15}} onClick={publish} disabled={publishing}>{publishing?<span className="spinner"/>:"🚀 Publicar pedido"}</button>
          <button className="btn-ghost" style={{padding:"14px 20px"}} onClick={()=>setStep("chat")}>← Editar</button>
        </div>
      </div>
    </div>
  );

  // CHAT
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--ink)"}}>
      <Nav ctx={ctx} title={svc?.label} showBack/>{hidden}
      <div style={{flex:1,overflow:"hidden",display:"flex",maxWidth:980,margin:"0 auto",width:"100%",padding:"14px 20px",gap:14}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--ink-2)",borderRadius:20,border:"1px solid var(--ink-3)",overflow:"hidden",boxShadow:"var(--shadow)"}}>
          <div style={{padding:"13px 17px",borderBottom:"1px solid var(--ink-3)",display:"flex",alignItems:"center",gap:11,background:"rgba(255,255,255,.015)"}}>
            <div style={{width:36,height:36,borderRadius:11,background:`${svc?.accent}18`,border:`1px solid ${svc?.accent}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{svc?.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:svc?.accent}}>{svc?.label}</div>
              <div style={{fontSize:11,color:"var(--mist)",display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:"var(--green)",display:"inline-block"}}/>Asistente IA · GPT-4o
              </div>
            </div>
            <button className="btn-ghost btn-sm" onClick={()=>imgRef.current?.click()}>🖼️{images.length>0?` ${images.length}`:""}</button>
            <button className="btn-ghost btn-sm" onClick={()=>cadRef.current?.click()}>{cadFile?"📐✓":"📐"}</button>
          </div>
          <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"18px",display:"flex",flexDirection:"column",gap:14}}>
            {msgs.map((m,i)=>(<Bubble key={i} msg={m} svc={svc} onChip={t=>send(t)} onMatSelect={mat=>send(`Quiero usar ${mat}`)} onUpload={()=>cadRef.current?.click()}/>))}
            {loading&&<TypingDots accent={svc?.accent}/>}
          </div>
          <div style={{padding:"12px 14px",borderTop:"1px solid var(--ink-3)",background:"rgba(0,0,0,.15)"}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <textarea className="input" placeholder="Escribe aquí..." value={input}
                onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                disabled={loading} rows={1}
                style={{flex:1,resize:"none",background:"var(--ink-3)",border:"1px solid var(--ink-4)",borderRadius:12,padding:"10px 13px",fontSize:14,lineHeight:1.4,maxHeight:120,overflow:"hidden",transition:"height .15s"}}
              />
              <button className="btn-primary" style={{padding:"10px 18px",borderRadius:12,flexShrink:0}} onClick={()=>send()} disabled={loading||!input.trim()}>→</button>
            </div>
            {msgs.filter(m=>m.role==="user").length>=4&&!brief&&(
              <div style={{marginTop:7,textAlign:"center"}}>
                <button onClick={()=>{const desc=msgs.filter(m=>m.role==="user").map(m=>m.content).join(". ");setBrief({titulo:`Pedido de ${svc?.label}`,descripcion:desc,especificaciones:{},cantidad:1,plazo_estimado:"A definir",presupuesto_referencial:"A consultar",notas_adicionales:""});setProgress(4);setStep("review");}} style={{background:"none",border:"none",color:"var(--mist)",fontSize:12,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>
                  Generar brief con la info actual →
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{width:186,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"var(--ink-2)",borderRadius:16,padding:15,border:"1px solid var(--ink-3)"}}>
            <div className="t-label" style={{marginBottom:13}}>Progreso</div>
            {STEPS.map((label,i)=>{const st=i<progress?"done":i===progress-1?"active":"todo";return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
                <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,background:st==="done"?svc?.accent:st==="active"?"transparent":"var(--ink-3)",border:st==="active"?`2px solid ${svc?.accent}`:st==="done"?"none":"1px solid var(--ink-4)",color:st==="done"?"#fff":st==="active"?svc?.accent:"var(--ink-4)",transition:"all .3s var(--spring)"}}>
                  {st==="done"?"✓":i+1}
                </div>
                <span style={{fontSize:12,color:st==="todo"?"var(--ink-4)":st==="done"?"var(--fog)":svc?.accent,transition:"color .3s"}}>{label}</span>
              </div>
            );})}
          </div>
          <div style={{background:"var(--ink-2)",borderRadius:16,padding:13,border:"1px solid var(--ink-3)"}}>
            <div className="t-label" style={{marginBottom:10}}>Adjuntos</div>
            {[{icon:"🖼️",label:`Imágenes${images.length>0?` (${images.length})`:""}}`,action:()=>imgRef.current?.click()},{icon:"🎙️",label:audio?"✓ Audio":"Audio",action:()=>audRef.current?.click()},{icon:"📐",label:cadFile?"✓ Plano":"Plano / CAD",action:()=>cadRef.current?.click()}].map(({icon,label,action})=>(
              <button key={label} onClick={action} className="btn-ghost btn-sm" style={{width:"100%",textAlign:"left",marginBottom:6,fontSize:11,display:"flex",alignItems:"center",gap:6}}><span>{icon}</span><span>{label}</span></button>
            ))}
          </div>
          <div style={{background:"rgba(10,132,255,.06)",border:"1px solid rgba(10,132,255,.15)",borderRadius:14,padding:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#0A84FF",marginBottom:4}}>💡 Tip</div>
            <div style={{fontSize:11,color:"var(--mist)",lineHeight:1.55}}>PDF, DXF, STEP o fotos con medidas mejoran mucho la cotización en reparación y fabricación.</div>
          </div>
        </div>
      </div>
    </div>
  );
}