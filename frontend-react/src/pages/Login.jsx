import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import { TrashIcon, ShieldIcon, KeyIcon } from '../components/Icons'
import './auth.css'

export default function Login() {
  const [form, setForm] = useState({ email_or_id: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await login(form)
      loginUser(res.data.access_token, res.data.user)
      navigate('/citizen/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'object' && detail !== null) {
        setError(detail.msg || JSON.stringify(detail))
      } else {
        setError(detail || 'Login failed. Check your credentials.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{display: 'flex', justifyContent: 'center', marginBottom: 16}}>
          <div style={{background: 'rgba(13,148,136,0.12)', padding: 14, borderRadius: '50%'}}>
            <TrashIcon size={36} color="var(--teal)" />
          </div>
        </div>
        <h2>Citizen Login</h2>
        <p className="auth-sub">Sign in with your email or Citizen ID</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email or Citizen ID</label>
            <input className="form-input" placeholder="e.g. CIT-10001 or email@example.com"
              value={form.email_or_id} onChange={e => setForm({...form, email_or_id: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn btn-primary btn-full btn-lg" disabled={loading} style={{display: 'flex', gap: 8, alignItems: 'center'}}>
            <KeyIcon size={18} /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <span>Don't have an account? <Link to="/register">Register</Link></span>
          <Link to="/admin-login" className="admin-link" style={{display: 'inline-flex', alignItems: 'center', gap: 4}}>
            <ShieldIcon size={14} /> Admin Login
          </Link>
        </div>
      </div>
    </div>
  )
}
