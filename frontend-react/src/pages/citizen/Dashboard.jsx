import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyReports, getNotifications, markRead } from '../../api/api'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import {
  ReportIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  BellIcon,
  ScannerIcon,
  MapIcon,
  BotIcon,
  UserIcon
} from '../../components/Icons'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyReports(), getNotifications()])
      .then(([rRes, nRes]) => { setReports(rRes.data || []); setNotifs(nRes.data || []) })
      .finally(() => setLoading(false))
  }, [])

  const unread = notifs.filter(n => !n.is_read)
  const recentReports = reports.slice(0, 5)

  const counts = {}
  for (const s of ['Pending', 'Verified', 'In Progress', 'Resolved']) {
    counts[s] = reports.filter(r => r.status === s).length
  }

  const handleMarkRead = async (id) => {
    await markRead(id)
    setNotifs(notifs.map(n => n.id === id ? {...n, is_read: true} : n))
  }

  if (loading) return <div className="spinner" />

  const stats = [
    { label: 'Total Reports', val: reports.length,          icon: <ReportIcon size={20} color="var(--teal)" />,    bg: 'rgba(13,148,136,0.1)',  color: 'var(--teal)' },
    { label: 'Pending',       val: counts['Pending'] || 0,  icon: <ClockIcon size={20} color="var(--amber)" />,    bg: 'rgba(245,158,11,0.1)',  color: 'var(--amber)' },
    { label: 'In Progress',   val: counts['In Progress']||0,icon: <TruckIcon size={20} color="var(--purple)" />,   bg: 'rgba(139,92,246,0.1)',  color: 'var(--purple)' },
    { label: 'Resolved',      val: counts['Resolved'] || 0, icon: <CheckCircleIcon size={20} color="var(--emerald)" />, bg: 'rgba(16,185,129,0.1)', color: 'var(--emerald)' },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:6}}>
          <div style={{width:40,height:40,borderRadius:'50%',background:'var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <UserIcon size={20} color="var(--gray-600)" />
          </div>
          <div>
            <h1 style={{fontSize:'1.2rem',fontWeight:800,color:'var(--gray-900)',letterSpacing:'-0.02em'}}>
              Hello, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{fontSize:'0.78rem',color:'var(--gray-500)',marginTop:1}}>
              <span className="id-pill">{user?.citizen_id}</span>
              &nbsp;&middot;&nbsp;{user?.complaint_count ?? 0} complaint{user?.complaint_count !== 1 ? 's' : ''} filed
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{marginBottom: 24}}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{borderTop: `3px solid ${s.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div className="stat-card-icon" style={{background: s.bg}}>
                {s.icon}
              </div>
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Reports + Notifications */}
      <div className="grid-2" style={{marginBottom: 20}}>
        {/* Recent Reports */}
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div className="card-title">
              <ReportIcon size={16} color="var(--teal)" /> Recent Reports
            </div>
            <Link to="/citizen/my-reports" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          {recentReports.length === 0 ? (
            <div className="empty-state">
              <ReportIcon size={36} color="var(--gray-300)" />
              <p>No reports yet.</p>
              <Link to="/citizen/report" style={{color:'var(--teal)',fontWeight:600,fontSize:'0.83rem'}}>
                Submit your first report →
              </Link>
            </div>
          ) : recentReports.map(r => (
            <div key={r.id} style={{
              display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'10px 0',
              borderBottom:'1px solid var(--gray-100)'
            }}>
              <div>
                <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--gray-800)',marginBottom:3}}>{r.district}</div>
                <span className="report-id-pill">{r.report_id}</span>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>
            <BellIcon size={16} color="var(--teal)" />
            Notifications
            {unread.length > 0 && (
              <span className="badge badge-resolved" style={{marginLeft:6}}>{unread.length} new</span>
            )}
          </div>
          {notifs.length === 0 ? (
            <div className="empty-state">
              <BellIcon size={36} color="var(--gray-300)" />
              <p>No notifications yet</p>
            </div>
          ) : notifs.slice(0, 5).map(n => (
            <div
              key={n.id}
              className={`notif-box ${!n.is_read ? 'notif-unread' : ''}`}
              style={{cursor: !n.is_read ? 'pointer' : 'default'}}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
            >
              <div className="notif-title">{n.title}</div>
              <div className="notif-msg">{n.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-title" style={{marginBottom:16}}>Quick Actions</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.dispatchEvent(new CustomEvent('open-rag-chat'))}
            style={{display:'inline-flex',alignItems:'center',gap:7}}
          >
            <BotIcon size={15} /> AI Guide
          </button>
          <Link to="/citizen/report" className="btn btn-primary" style={{display:'inline-flex',alignItems:'center',gap:7}}>
            <ReportIcon size={15} /> Report Waste
          </Link>
          <Link to="/citizen/scanner" className="btn btn-indigo" style={{display:'inline-flex',alignItems:'center',gap:7}}>
            <ScannerIcon size={15} /> AI Scanner
          </Link>
          <Link to="/citizen/map" className="btn btn-secondary" style={{display:'inline-flex',alignItems:'center',gap:7}}>
            <MapIcon size={15} /> Waste Map
          </Link>
          <Link to="/citizen/my-reports" className="btn btn-secondary" style={{display:'inline-flex',alignItems:'center',gap:7}}>
            <ReportIcon size={15} /> My Reports
          </Link>
        </div>
      </div>
    </div>
  )
}
