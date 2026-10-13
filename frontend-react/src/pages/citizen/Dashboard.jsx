import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getReports, getNotifications, markRead } from '../../api/api'
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
  BotIcon
} from '../../components/Icons'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getReports(), getNotifications()])
      .then(([rRes, nRes]) => { setReports(rRes.data || []); setNotifs(nRes.data || []) })
      .finally(() => setLoading(false))
  }, [])

  const unread = notifs.filter(n => !n.is_read)
  const myReports = reports.filter(r => r.citizen_id === user?.id).slice(0, 5)

  const counts = { total: myReports.length }
  for (const s of ['Pending','Verified','In Progress','Resolved']) counts[s] = myReports.filter(r => r.status === s).length

  const handleMarkRead = async (id) => {
    await markRead(id)
    setNotifs(notifs.map(n => n.id === id ? {...n, is_read: true} : n))
  }

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.full_name}</h1>
        <p>Citizen ID: <span className="id-pill">{user?.citizen_id}</span> &nbsp;|&nbsp; Complaints: <strong>{user?.complaint_count ?? 0}</strong></p>
      </div>

      {/* STAT CARDS */}
      <div className="grid-4" style={{marginBottom:28}}>
        {[
          {label:'Total Reports', val: user?.complaint_count ?? 0, icon: <ReportIcon size={24} color="var(--teal)" />, color:'var(--teal)'},
          {label:'Pending',       val: counts['Pending']||0, icon: <ClockIcon size={24} color="var(--amber)" />, color:'var(--amber)'},
          {label:'In Progress',   val: counts['In Progress']||0, icon: <TruckIcon size={24} color="var(--purple)" />, color:'var(--purple)'},
          {label:'Resolved',      val: counts['Resolved']||0, icon: <CheckCircleIcon size={24} color="var(--emerald)" />, color:'var(--emerald)'},
        ].map(c => (
          <div key={c.label} className="stat-card" style={{borderLeftColor: c.color}}>
            <div className="stat-icon" style={{display: 'flex'}}>{c.icon}</div>
            <div className="stat-val">{c.val}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* RECENT REPORTS */}
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div className="card-title" style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <ReportIcon size={18} color="var(--teal)" /> Recent Reports
            </div>
            <Link to="/citizen/my-reports" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {myReports.length === 0 ? (
            <div style={{textAlign:'center',padding:'32px 0',color:'var(--gray-400)'}}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: 8}}>
                <ReportIcon size={36} color="var(--gray-400)" />
              </div>
              <p>No reports yet. <Link to="/citizen/report" style={{color:'var(--teal)'}}>Submit your first report →</Link></p>
            </div>
          ) : myReports.map(r => (
            <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--gray-100)'}}>
              <div>
                <div style={{fontWeight:600,fontSize:'0.88rem'}}>{r.district}</div>
                <div><span className="report-id-pill">{r.report_id}</span></div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>

        {/* NOTIFICATIONS */}
        <div className="card">
          <div className="card-title" style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom:16}}>
            <BellIcon size={18} color="var(--teal)" /> Notifications {unread.length > 0 && <span className="badge badge-pending">{unread.length} new</span>}
          </div>
          {notifs.length === 0 ? (
            <div style={{textAlign:'center',padding:'32px 0',color:'var(--gray-400)'}}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: 8}}>
                <BellIcon size={36} color="var(--gray-400)" />
              </div>
              <p>No notifications yet</p>
            </div>
          ) : notifs.slice(0,5).map(n => (
            <div key={n.id} className={`notif-box ${!n.is_read ? 'notif-unread' : ''}`}
              style={{cursor: !n.is_read ? 'pointer' : 'default'}}
              onClick={() => !n.is_read && handleMarkRead(n.id)}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-msg">{n.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="card" style={{marginTop:24}}>
        <div className="card-title" style={{marginBottom:16}}>Quick Actions</div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <Link to="/citizen/assistant" className="btn btn-amber" style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
            <BotIcon size={16} /> AI Guide (Chatbot)
          </Link>
          <Link to="/citizen/report" className="btn btn-primary" style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
            <ReportIcon size={16} /> Report Waste
          </Link>
          <Link to="/citizen/scanner" className="btn btn-indigo" style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
            <ScannerIcon size={16} /> AI Scanner
          </Link>
          <Link to="/citizen/map" className="btn btn-secondary" style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
            <MapIcon size={16} /> View Map
          </Link>
          <Link to="/citizen/my-reports" className="btn btn-secondary" style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
            <ReportIcon size={16} /> My Reports
          </Link>
        </div>
      </div>
    </div>
  )
}
