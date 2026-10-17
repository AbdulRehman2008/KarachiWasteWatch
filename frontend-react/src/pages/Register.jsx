import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import { AppLogo, TrashIcon, ReportIcon, CheckCircleIcon, MapIcon } from '../components/Icons'
import './auth.css'

const DISTRICTS = [
  'District South (Saddar, Clifton, DHA)',
  'District East (Gulshan, Johar, PECHS)',
  'District Central (Nazimabad, North Nazimabad)',
  'District Korangi',
  'District Keamari',
  'District Malir',
]

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', district: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await register(form)
      loginUser(res.data.access_token, res.data.user)
      navigate('/citizen/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'object' && detail !== null) {
        setError(detail.msg || JSON.stringify(detail))
      } else {
        setError(detail || 'Registration failed.')
      }
    } finally { setLoading(false) }
  }

  const f = (field) => ({ value: form[field], onChange: e => setForm({...form, [field]: e.target.value}) })

  return (
    <div className="auth-page">
      {/* Left Brand Panel */}
      <div className="auth-left">
        <div className="auth-brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AppLogo size={34} variant="teal" />
          <div>
            <div className="auth-brand-name">WasteWatch AI</div>
            <span className="auth-brand-tag">Karachi Municipal Platform</span>
          </div>
        </div>
        <h2 className="auth-left-title">
          Start making<br /><span>Karachi cleaner.</span>
        </h2>
        <p className="auth-left-sub">
          Create your free citizen account and get a unique Citizen ID.
          Start reporting waste and tracking municipal response.
        </p>
        <div className="auth-left-features">
          {[
            { icon: <ReportIcon size={15} color="#2dd4bf" />, bg: 'rgba(13,148,136,0.15)', text: 'Submit AI-verified waste reports' },
            { icon: <MapIcon size={15} color="#818cf8" />, bg: 'rgba(99,102,241,0.15)', text: 'View live waste map for your area' },
            { icon: <CheckCircleIcon size={15} color="#10b981" />, bg: 'rgba(16,185,129,0.15)', text: 'Get notified when cleanup is done' },
          ].map(f => (
            <div className="auth-left-feat" key={f.text}>
              <div className="auth-left-feat-icon" style={{background: f.bg}}>{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-right">
        <div className="auth-form-box auth-form-box-wide">
          <div className="auth-header">
            <div className="auth-logo-icon" style={{background: 'rgba(13,148,136,0.1)'}}>
              <TrashIcon size={24} color="var(--teal)" />
            </div>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">You'll receive a unique Citizen ID after registration</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Ali Hassan" {...f('full_name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="ali@example.com" {...f('email')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Min 8 characters" {...f('password')} required autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span style={{color:'var(--gray-400)',fontWeight:400}}>(optional)</span></label>
                <input className="form-input" placeholder="0300-1234567" {...f('phone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Your District</label>
              <select className="form-input form-select" {...f('district')}>
                <option value="">Select your district</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-full btn-lg" disabled={loading} style={{marginTop: 4}}>
              <ReportIcon size={17} />
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <div className="auth-form-divider" />

          <div className="auth-footer-links">
            <span>Already have an account? <Link to="/login">Sign In</Link></span>
          </div>
        </div>
      </div>
    </div>
  )
}
