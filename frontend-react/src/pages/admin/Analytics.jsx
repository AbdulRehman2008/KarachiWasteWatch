import { useEffect, useState } from 'react'
import { getAnalytics } from '../../api/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { 
  AnalyticsIcon, 
  ReportIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  MapIcon 
} from '../../components/Icons'

const COLORS = ['#0d9488','#f59e0b','#8b5cf6','#10b981','#f43f5e']

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />
  if (!data) return <div className="card"><p>No analytics data available.</p></div>

  const statusData = Object.entries(data.by_status || {}).map(([name, value]) => ({ name, value }))
  const districtData = Object.entries(data.by_district || {}).map(([name, value]) => ({ name: name.split('(')[0].trim(), value }))
  const severityData = Object.entries(data.by_severity || {}).map(([name, value]) => ({ name, value }))

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <AnalyticsIcon size={28} color="var(--indigo)" /> Analytics
        </h1>
        <p>City-wide waste management statistics</p>
      </div>

      <div className="grid-4" style={{marginBottom:28}}>
        {[
          { label:'Total Reports', val: data.total_reports ?? 0, icon: <ReportIcon size={24} color="var(--teal)" />, color:'var(--teal)' },
          { label:'Resolved', val: data.resolved_count ?? 0, icon: <CheckCircleIcon size={24} color="var(--emerald)" />, color:'var(--emerald)' },
          { label:'Resolution Rate', val: `${data.resolution_rate ?? 0}%`, icon: <AnalyticsIcon size={24} color="var(--indigo)" />, color:'var(--indigo)' },
          { label:'Avg Resolve Time', val: data.avg_resolution_days ? `${data.avg_resolution_days}d` : 'N/A', icon: <ClockIcon size={24} color="var(--amber)" />, color:'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{borderLeftColor: s.color}}>
            <div className="stat-icon" style={{display: 'flex'}}>{s.icon}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{marginBottom:16, display: 'flex', alignItems: 'center', gap: 8}}>
            <MapIcon size={18} color="var(--teal)" /> Reports by District
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={districtData} layout="vertical" margin={{left:20}}>
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={130} tick={{fontSize:11}} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--teal)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title" style={{marginBottom:16, display: 'flex', alignItems: 'center', gap: 8}}>
            <AnalyticsIcon size={18} color="var(--indigo)" /> Reports by Status
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,value})=>`${name}: ${value}`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {severityData.length > 0 && (
          <div className="card">
            <div className="card-title" style={{marginBottom:16}}>Reports by Severity</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={severityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="var(--amber)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
