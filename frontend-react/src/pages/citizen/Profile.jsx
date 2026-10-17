import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { UserIcon, LogoutIcon, ReportIcon, ClockIcon } from '../../components/Icons'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserIcon size={28} color="var(--teal)" /> Profile
        </h1>
        <p>Your citizen account details</p>
      </div>

      <div className="grid-2">
        {/* Identity card */}
        <div className="card">
          {/* Avatar */}
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              background: 'rgba(13,148,136,0.12)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <UserIcon size={44} color="var(--teal)" />
            </div>
            <h2 style={{ marginBottom: 8 }}>{user?.full_name}</h2>
            <div className="id-pill" style={{ fontSize: '1rem', padding: '6px 16px' }}>
              {user?.citizen_id}
            </div>
          </div>

          {/* Details list */}
          <div style={{ marginTop: 24 }}>
            {[
              { label: 'Email',            val: user?.email },
              { label: 'Phone',            val: user?.phone || 'Not provided' },
              { label: 'Role',             val: 'Citizen' },
              { label: 'Complaints Filed', val: user?.complaint_count ?? 0 },
              { label: 'Member Since',     val: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A' },
            ].map(f => (
              <div
                key={f.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--gray-100)',
                }}
              >
                <span style={{ color: 'var(--gray-400)', fontSize: '.88rem' }}>{f.label}</span>
                <strong style={{ fontSize: '.88rem' }}>{f.val}</strong>
              </div>
            ))}
          </div>

          <button
            className="btn btn-danger btn-full"
            style={{ marginTop: 24, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            <LogoutIcon size={16} /> Logout
          </button>
        </div>

        {/* Summary card */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ReportIcon size={18} color="var(--teal)" /> Account Summary
          </div>
          <div className="stat-card" style={{ marginBottom: 14, borderLeftColor: 'var(--teal)' }}>
            <div className="stat-val">{user?.complaint_count ?? 0}</div>
            <div className="stat-label">Total Complaints Filed</div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="card-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClockIcon size={18} color="var(--teal)" /> Account Info
            </div>
            <div className="alert alert-info">
              Your unique <strong>Citizen ID ({user?.citizen_id})</strong> is used to log in and track
              all your reports. Keep it safe.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
