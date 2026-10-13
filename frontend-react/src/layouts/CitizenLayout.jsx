import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  TrashIcon, 
  DashboardIcon, 
  ScannerIcon, 
  ReportIcon, 
  MapIcon, 
  UserIcon, 
  LogoutIcon,
  BotIcon
} from '../components/Icons'
import './layout.css'

const nav = [
  { to: 'dashboard', icon: <DashboardIcon size={18} />, label: 'Dashboard' },
  { to: 'assistant', icon: <BotIcon size={18} />, label: 'AI Guide (RAG Chat)' },
  { to: 'scanner',   icon: <ScannerIcon size={18} />, label: 'AI Waste Scanner' },
  { to: 'report',    icon: <ReportIcon size={18} />, label: 'Report Waste' },
  { to: 'my-reports',icon: <ReportIcon size={18} />, label: 'My Reports' },
  { to: 'map',       icon: <MapIcon size={18} />, label: 'Waste Map' },
  { to: 'profile',   icon: <UserIcon size={18} />, label: 'Profile' },
]

export default function CitizenLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }
  const closeSidebar = () => setMobileOpen(false)

  return (
    <div className="layout">
      {/* Top Mobile Bar */}
      <header className="mobile-header">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
        <div className="mobile-header-brand">
          <TrashIcon size={20} color="var(--teal)" />
          <span className="logo-title">WasteWatch</span>
        </div>
        <div className="id-pill" style={{fontSize: '0.7rem'}}>{user?.citizen_id || 'Citizen'}</div>
      </header>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeSidebar} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon-box" style={{background: 'rgba(13,148,136,0.2)', padding: 8, borderRadius: 8}}>
            <TrashIcon size={24} color="var(--teal)" />
          </div>
          <div>
            <div className="logo-title">WasteWatch</div>
            <div className="logo-sub">Citizen Portal</div>
          </div>
        </div>

        <div className="user-chip">
          <div style={{background: 'rgba(255,255,255,0.1)', padding: 6, borderRadius: '50%', display: 'flex'}}>
            <UserIcon size={18} color="#fff" />
          </div>
          <div>
            <div className="user-name">{user?.full_name || 'Citizen'}</div>
            <div className="id-pill">{user?.citizen_id || ''}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(n => (
            <NavLink 
              key={n.to} 
              to={n.to} 
              onClick={closeSidebar}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{display: 'flex', alignItems: 'center'}}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout} style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <LogoutIcon size={16} /> Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
