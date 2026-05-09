import { useNavigate } from 'react-router-dom'

const TICKERS = ['Excavadoras','Retroexcavadoras','Grúas industriales','Compactadoras','Bulldozers','Cargadores frontales','Montacargas','Motoniveladoras','Perforadoras','Camiones mineros']
const ALL = [...TICKERS, ...TICKERS]

export default function Landing() {
  const nav = useNavigate()
  return (
    <div className="landing">
      <div className="landing-bg" />
      <div className="landing-gradient" />
      <div className="landing-content">
        <div className="landing-eyebrow"><span className="dot" /> Consignación inteligente de maquinaria</div>
        <h1 className="landing-title">Lumajira<span className="accent">Hub</span></h1>
        <p className="landing-subtitle">
          Conectamos vendedores de maquinaria industrial usada con compradores calificados.
          Motor de pricing automático, IA para descripciones y notificaciones en tiempo real.
        </p>
        <div className="landing-actions">
          <button className="btn-cta" onClick={() => nav('/app')}>
            Ingresar a la plataforma →
          </button>
          <button className="btn-outline" onClick={() => nav('/app')}>
            Ver catálogo
          </button>
        </div>
        <div className="landing-feats">
          <div className="feat-item"><span className="feat-icon">⚡</span> Pricing automático</div>
          <div className="feat-item"><span className="feat-icon">🤖</span> Descripciones con IA</div>
          <div className="feat-item"><span className="feat-icon">📲</span> Notificación a compradores</div>
          <div className="feat-item"><span className="feat-icon">🔥</span> CRM integrado</div>
        </div>
      </div>
      <div className="landing-ticker">
        <div className="ticker-track">
          {ALL.map((t, i) => <span key={i} className="ticker-item">{t}</span>)}
        </div>
      </div>
    </div>
  )
}
