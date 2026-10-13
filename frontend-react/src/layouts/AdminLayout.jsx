import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  ShieldIcon, 
  DashboardIcon, 
  ScannerIcon, 
  ReportIcon, 
  MapIcon, 
  AnalyticsIcon, 
  FlameIcon, 
  CheckCircleIcon, 
  UsersIcon, 
  LogoutIcon 
} from '../components/Icons'
import './layout.css'

const nav = [
  { to: 'dashboard', icon: <DashboardIcon size={18} />, label: 'Dashboard' },
  { to: 'scanner',   icon: <ScannerIcon size={18} />, label: 'AI Waste Scanner' },
  { to: 'reports',   icon: <ReportIcon size={18} />, label: 'Reports' },
  { to: 'map',       icon: <MapIcon size={18} />, label: 'Waste Map' },
  { to: 'analytics', icon: <AnalyticsIcon size={18} />, label: 'Analytics' },
  { to: 'hotspots',  icon: <FlameIcon size={18} />, label: 'Hotspots' },
  { to: 'cleanup',   icon: <CheckCircleIcon size={18} />, label: 'Cleanup Verification' },
  { to: 'users',     icon: <UsersIcon size={18} />, label: 'User Management' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }
  const closeSidebar = () => setMobileOpen(false)

  return (
    <div className="layout">
      {/* Top Mobile Bar */}
      <header className="mobile-header mobile-header-admin">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
        <div className="mobile-header-brand">
          <ShieldIcon size={20} color="#818cf8" />
          <span className="logo-title">WasteWatch Admin</span>
        </div>
        <div className="id-pill" style={{fontSize: '0.7rem'}}>{user?.admin_id || 'ADMIN'}</div>
      </header>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeSidebar} />
      )}

      <aside className={`sidebar sidebar-admin ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon-box" style={{background: 'rgba(99,102,241,0.25)', padding: 8, borderRadius: 8}}>
            <ShieldIcon size={24} color="#a5b4fc" />
          </div>
          <div>
            <div className="logo-title">WasteWatch</div>
            <div className="logo-sub">Admin Portal</div>
          </div>
        </div>

        <div className="user-chip">
          <div style={{background: 'rgba(255,255,255,0.1)', padding: 6, borderRadius: '50%', display: 'flex'}}>
            <ShieldIcon size={18} color="#fff" />
          </div>
          <div>
            <div className="user-name">{user?.full_name || 'Admin'}</div>
            <div className="id-pill">{user?.admin_id || 'ADMIN'}</div>
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
