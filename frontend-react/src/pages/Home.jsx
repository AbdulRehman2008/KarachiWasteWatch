import { Link } from 'react-router-dom'
import { 
  TrashIcon, 
  SparklesIcon, 
  CameraIcon, 
  BotIcon, 
  ShieldIcon, 
  CheckCircleIcon,
  ReportIcon,
  KeyIcon
} from '../components/Icons'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="home-nav">
        <div className="nav-brand" style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <TrashIcon size={24} color="var(--teal)" />
          <strong>Karachi WasteWatch AI</strong>
        </div>
        <div className="nav-links">
          <a href="#how">How It Works</a>
          <a href="#about">About</a>
          <Link to="/login" className="btn btn-secondary btn-sm" style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
            <KeyIcon size={14} /> Login
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm" style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
            <ReportIcon size={14} /> Register
          </Link>
          <Link to="/admin-login" className="btn btn-sm" style={{background:'#312e81',color:'#fff', display: 'inline-flex', alignItems: 'center', gap: 6}}>
            <ShieldIcon size={14} /> Admin Login
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge" style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
            <SparklesIcon size={16} /> AI-Powered Civic Platform
          </div>
          <h1>Report Waste.<br />Detect Waste.<br />Clean Karachi.</h1>
          <p>Pakistan's first AI-driven waste management system. Citizens report, AI detects, authorities act.</p>
          <div className="hero-btns">
            <Link to="/register" className="btn btn-primary btn-lg" style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
              <ReportIcon size={18} /> Get Started
            </Link>
            <Link to="/login" className="btn btn-lg" style={{background:'rgba(255,255,255,.15)',color:'#fff',backdropFilter:'blur(8px)', display: 'inline-flex', alignItems: 'center', gap: 8}}>
              <KeyIcon size={18} /> Sign In
            </Link>
          </div>
          <div className="hero-stats">
            <div><strong>2,400+</strong><span>Reports Filed</span></div>
            <div><strong>87%</strong><span>Resolved</span></div>
            <div><strong>18</strong><span>Hotspots Cleared</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <TrashIcon size={140} color="rgba(255,255,255,0.25)" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <h2>How It Works</h2>
        <div className="steps">
          {[
            { icon: <CameraIcon size={32} color="var(--teal)" />, step: '1', title: 'Upload Image', desc: 'Citizen takes a photo of the waste location.' },
            { icon: <BotIcon size={32} color="var(--teal)" />, step: '2', title: 'AI Detects Waste', desc: 'YOLO AI analyses the image and identifies waste types.' },
            { icon: <ShieldIcon size={32} color="var(--teal)" />, step: '3', title: 'Admin Verifies', desc: 'Municipal admin reviews and dispatches cleanup crew.' },
            { icon: <CheckCircleIcon size={32} color="var(--teal)" />, step: '4', title: 'Cleanup Verified', desc: 'After photo submitted, AI confirms cleanup complete.' },
          ].map(s => (
            <div key={s.step} className="step-card">
              <div className="step-num">{s.step}</div>
              <div className="step-icon" style={{display: 'flex', justifyContent: 'center', marginBottom: 12}}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-section" id="about">
        <h2>About the Platform</h2>
        <p>Karachi WasteWatch AI bridges the gap between citizens and municipal authorities using computer vision and real-time data. Built for Karachi's 15+ million residents.</p>
      </section>

      <footer className="home-footer">
        <p>© 2026 Karachi WasteWatch AI — Built for a cleaner Karachi</p>
      </footer>
    </div>
  )
}
