import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import { TrashIcon, ReportIcon } from '../components/Icons'
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
      <div className="auth-card auth-card-wide">
        <div className="auth-logo" style={{display: 'flex', justifyContent: 'center', marginBottom: 16}}>
          <div style={{background: 'rgba(13,148,136,0.12)', padding: 14, borderRadius: '50%'}}>
            <TrashIcon size={36} color="var(--teal)" />
          </div>
        </div>
        <h2>Create Citizen Account</h2>
        <p className="auth-sub">You'll receive a unique Citizen ID after registration</p>

        {error && <div className="alert alert-error">{error}</div>}

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
              <input className="form-input" type="password" placeholder="Min 8 characters" {...f('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="0300-1234567" {...f('phone')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">District</label>
            <select className="form-input form-select" {...f('district')}>
              <option value="">Select your district</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-full btn-lg" disabled={loading} style={{display: 'flex', gap: 8, alignItems: 'center'}}>
            <ReportIcon size={18} /> {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <span>Already have an account? <Link to="/login">Sign In</Link></span>
        </div>
      </div>
    </div>
  )
}
