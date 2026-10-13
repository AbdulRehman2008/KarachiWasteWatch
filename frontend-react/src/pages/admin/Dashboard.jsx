import { useEffect, useState } from 'react'
import { getReports, getAnalytics } from '../../api/api'
import StatusBadge from '../../components/StatusBadge'
import { 
  DashboardIcon, 
  ReportIcon, 
  ClockIcon, 
  TruckIcon, 
  CheckCircleIcon 
} from '../../components/Icons'

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getReports(), getAnalytics()])
      .then(([rRes, aRes]) => { setReports(rRes.data || []); setAnalytics(aRes.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  const counts = {}
  for (const s of ['Pending','Verified','In Progress','Resolved','Rejected']) counts[s] = reports.filter(r => r.status === s).length

  const stats = [
    { label:'Total Reports', val: reports.length, icon: <ReportIcon size={24} color="var(--teal)" />, color:'var(--teal)' },
    { label:'Pending Review', val: counts['Pending']||0, icon: <ClockIcon size={24} color="var(--amber)" />, color:'var(--amber)' },
    { label:'In Progress',   val: counts['In Progress']||0, icon: <TruckIcon size={24} color="var(--purple)" />, color:'var(--purple)' },
    { label:'Resolved',      val: counts['Resolved']||0, icon: <CheckCircleIcon size={24} color="var(--emerald)" />, color:'var(--emerald)' },
  ]

  const recent = [...reports].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,8)

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <DashboardIcon size={28} color="var(--indigo)" /> Admin Dashboard
        </h1>
        <p>Municipal waste management overview for Karachi</p>
      </div>

      <div className="grid-4" style={{marginBottom:28}}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{borderLeftColor:s.color}}>
            <div className="stat-icon" style={{display: 'flex'}}>{s.icon}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title" style={{marginBottom:16, display: 'flex', alignItems: 'center', gap: 8}}>
          <ClockIcon size={18} color="var(--indigo)" /> Recent Reports
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Report ID</th><th>District</th><th>Citizen</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td><span className="report-id-pill">{r.report_id}</span></td>
                  <td>{r.district}</td>
                  <td><span className="id-pill">{r.citizen?.citizen_id || '—'}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
