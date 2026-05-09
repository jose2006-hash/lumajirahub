import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dashboard  from './Dashboard'
import MachineForm from './MachineForm'
import Catalog    from './Catalog'
import BuyerCRM   from './BuyerCRM'
import LeadsPanel from './LeadsPanel'

const TABS = [
  { id:'dashboard',  label:'Dashboard',    icon:'📊' },
  { id:'nueva',      label:'+ Registrar',  icon:'➕' },
  { id:'catalogo',   label:'Catálogo',     icon:'🏭' },
  { id:'compradores',label:'Compradores',  icon:'👥' },
  { id:'leads',      label:'Leads',        icon:'🔥' },
]

export default function AppShell() {
  const [tab, setTab] = useState('dashboard')
  const nav = useNavigate()
  return (
    <div className="app-shell">
      <nav className="topnav">
        <div className="nav-logo" onClick={() => nav('/')}>
          <div className="nav-logo-icon">L</div>
          <span className="nav-logo-name">Lumajira<span className="dot">Hub</span></span>
        </div>
        <div className="nav-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`nav-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <div className="live-pill"><span className="live-dot" /> En vivo</div>
        </div>
      </nav>
      <main className="app-main">
        {tab === 'dashboard'   && <Dashboard  setTab={setTab} />}
        {tab === 'nueva'       && <MachineForm setTab={setTab} />}
        {tab === 'catalogo'    && <Catalog />}
        {tab === 'compradores' && <BuyerCRM />}
        {tab === 'leads'       && <LeadsPanel />}
      </main>
    </div>
  )
}
