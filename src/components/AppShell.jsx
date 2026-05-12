import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dashboard   from './Dashboard'
import MachineForm from './MachineForm'
import Catalog     from './Catalog'
import BuyerCRM    from './BuyerCRM'
import LeadsPanel  from './LeadsPanel'

// Contraseña definida en .env como VITE_ADMIN_PASSWORD
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'lumajirahub2024'

const PUBLIC_TABS = [
  { id: 'catalogo', label: 'Catálogo', icon: '🏭' },
]

const ADMIN_TABS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
  { id: 'nueva',       label: '+ Registrar', icon: '➕' },
  { id: 'catalogo',    label: 'Catálogo',    icon: '🏭' },
  { id: 'compradores', label: 'Compradores', icon: '👥' },
  { id: 'leads',       label: 'Leads',       icon: '🔥' },
]

export default function AppShell() {
  const [tab,       setTab]       = useState('catalogo')
  const [isAdmin,   setIsAdmin]   = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const nav = useNavigate()

  const tabs    = isAdmin ? ADMIN_TABS : PUBLIC_TABS
  const safeTab = !isAdmin && tab !== 'catalogo' ? 'catalogo' : tab

  const handleLogin = () => {
    if (password === ADMIN_PASS) {
      setIsAdmin(true); setShowLogin(false)
      setPassword('');  setError('')
      setTab('dashboard')
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setTab('catalogo')
  }

  const closeModal = () => {
    setShowLogin(false); setPassword(''); setError('')
  }

  return (
    <div className="app-shell">

      {/* ── TOP NAV ── */}
      <nav className="topnav">
        <div className="nav-logo" onClick={() => nav('/')}>
          <div className="nav-logo-icon">L</div>
          <span className="nav-logo-name">
            Lumajira<span className="dot">Hub</span>
          </span>
        </div>

        <div className="nav-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-tab${safeTab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAdmin ? (
            <>
              <div className="live-pill">
                <span className="live-dot" /> Administrador
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <div className="live-pill">
                <span className="live-dot" /> En vivo
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowLogin(true)}
                style={{ fontSize: 12, opacity: 0.5 }}
                title="Acceso administrador"
              >
                🔐
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── CONTENIDO ── */}
      <main className="app-main">
        {safeTab === 'catalogo'    && <Catalog     isAdmin={isAdmin} />}
        {safeTab === 'dashboard'   && isAdmin && <Dashboard  setTab={setTab} />}
        {safeTab === 'nueva'       && isAdmin && <MachineForm setTab={setTab} />}
        {safeTab === 'compradores' && isAdmin && <BuyerCRM />}
        {safeTab === 'leads'       && isAdmin && <LeadsPanel />}
      </main>

      {/* ── MODAL LOGIN ADMIN ── */}
      {showLogin && (
        <div
          className="modal-backdrop"
          onClick={e => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title">🔐 Acceso administrador</div>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 18, lineHeight: 1.6 }}>
              Ingresa la contraseña para acceder al panel completo de LumajiraHub.
            </p>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Contraseña</label>
              <input
                className="inp"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
              {error && (
                <div style={{ fontSize: 12, color: 'var(--err)', marginTop: 6 }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleLogin}
            >
              Ingresar
            </button>

            <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 14, textAlign: 'center' }}>
              La contraseña se configura en la variable VITE_ADMIN_PASSWORD
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
