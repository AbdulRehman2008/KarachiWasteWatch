import { useEffect, useState } from 'react'
import { getReports, getAnalytics } from '../../api/api'
import StatusBadge from '../../components/StatusBadge'
import {
  DashboardIcon,
  ReportIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  AnalyticsIcon
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
  for (const s of ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected']) {
    counts[s] = reports.filter(r => r.status === s).length
  }

  const stats = [
    { label: 'Total Reports',  val: reports.length,           icon: <ReportIcon size={20} color="var(--teal)" />,        bg: 'rgba(13,148,136,0.1)',  color: 'var(--teal)' },
    { label: 'Pending Review', val: counts['Pending'] || 0,   icon: <ClockIcon size={20} color="var(--amber)" />,         bg: 'rgba(245,158,11,0.1)',  color: 'var(--amber)' },
    { label: 'In Progress',    val: counts['In Progress']||0, icon: <TruckIcon size={20} color="var(--purple)" />,        bg: 'rgba(139,92,246,0.1)',  color: 'var(--purple)' },
    { label: 'Resolved',       val: counts['Resolved'] || 0,  icon: <CheckCircleIcon size={20} color="var(--emerald)" />, bg: 'rgba(16,185,129,0.1)', color: 'var(--emerald)' },
  ]

  const recent = [...reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)

  // Resolution rate
  const resolved = counts['Resolved'] || 0
  const total = reports.length
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>
          <DashboardIcon size={22} color="var(--indigo)" />
          Admin Dashboard
        </h1>
        <p>Municipal waste management overview — Karachi</p>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{marginBottom: 24}}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{borderTop: `3px solid ${s.color}`}}>
            <div className="stat-card-icon" style={{background: s.bg}}>
              {s.icon}
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Summary Row */}
      <div className="grid-2" style={{marginBottom: 24}}>
        {/* Resolution Rate */}
        <div className="card" style={{display:'flex',alignItems:'center',gap:20}}>
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background:`conic-gradient(var(--emerald) ${rate * 3.6}deg, var(--gray-150) 0deg)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0
          }}>
            <div style={{
              width:54, height:54, borderRadius:'50%',
              background:'#fff', display:'flex',
              alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize:'1rem', color:'var(--emerald)'
            }}>
              {rate}%
            </div>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--gray-900)',marginBottom:4}}>Resolution Rate</div>
            <div style={{fontSize:'0.78rem',color:'var(--gray-500)'}}>
              {resolved} of {total} reports resolved
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="card">
          <div className="card-title" style={{marginBottom:14}}>
            <AnalyticsIcon size={16} color="var(--indigo)" /> Status Breakdown
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              { status: 'Pending',     color:'var(--amber)',   count: counts['Pending']||0 },
              { status: 'In Progress', color:'var(--purple)',  count: counts['In Progress']||0 },
              { status: 'Resolved',    color:'var(--emerald)', count: counts['Resolved']||0 },
              { status: 'Rejected',    color:'var(--rose)',    count: counts['Rejected']||0 },
            ].map(item => (
              <div key={item.status} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:60,fontSize:'0.72rem',color:'var(--gray-500)',fontWeight:500,flexShrink:0}}>
                  {item.status}
                </div>
                <div style={{flex:1,height:6,borderRadius:4,background:'var(--gray-100)',overflow:'hidden'}}>
                  <div style={{
                    height:'100%',
                    width: total > 0 ? `${(item.count/total)*100}%` : '0%',
                    background: item.color,
                    borderRadius:4,
                    transition:'width 0.4s ease'
                  }}/>
                </div>
                <div style={{width:24,textAlign:'right',fontSize:'0.75rem',fontWeight:700,color:'var(--gray-700)',flexShrink:0}}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="card">
        <div className="card-title" style={{marginBottom:16}}>
          <ClockIcon size={16} color="var(--indigo)" /> Recent Reports
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>District</th>
                <th>Citizen</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td><span className="report-id-pill">{r.report_id}</span></td>
                  <td style={{color:'var(--gray-700)',fontWeight:500}}>{r.district}</td>
                  <td><span className="id-pill">{r.citizen?.citizen_id || '—'}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{color:'var(--gray-500)',fontSize:'0.8rem'}}>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
