import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminLogin } from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import { ShieldIcon, KeyIcon } from '../components/Icons'
import './auth.css'

export default function AdminLogin() {
  const [form, setForm] = useState({ email_or_id: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await adminLogin(form)
      loginUser(res.data.access_token, res.data.user)
      navigate('/admin/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'object' && detail !== null) {
        setError(detail.msg || JSON.stringify(detail))
      } else {
        setError(detail || 'Invalid Admin credentials.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page auth-page-admin">
      <div className="auth-card">
        <div className="auth-logo" style={{display: 'flex', justifyContent: 'center', marginBottom: 16}}>
          <div style={{background: 'rgba(99,102,241,0.15)', padding: 14, borderRadius: '50%'}}>
            <ShieldIcon size={36} color="var(--indigo)" />
          </div>
        </div>
        <h2>Admin Portal</h2>
        <p className="auth-sub">Municipal Administration Access</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="alert alert-info" style={{marginBottom:16}}>
          <strong>Demo:</strong> ADMIN-001 / Admin@Karachi2026
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin ID or Email</label>
            <input className="form-input" placeholder="e.g. ADMIN-001"
              value={form.email_or_id} onChange={e => setForm({...form, email_or_id: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn btn-full btn-lg" style={{background:'#4f46e5',color:'#fff', display: 'flex', gap: 8, alignItems: 'center'}} disabled={loading}>
            <ShieldIcon size={18} /> {loading ? 'Authenticating...' : 'Authenticate as Admin'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">← Citizen Login</Link>
          <Link to="/">Home</Link>
        </div>
      </div>
    </div>
  )
}
