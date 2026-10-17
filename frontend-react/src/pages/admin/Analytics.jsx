import { useEffect, useState } from 'react'
import { getAnalytics } from '../../api/api'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid 
} from 'recharts'
import { 
  AnalyticsIcon, 
  ReportIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  MapIcon,
  TruckIcon,
  SparklesIcon,
  FlameIcon
} from '../../components/Icons'

const COLORS = ['#0d9488', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e']

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />
  if (!data) return <div className="card"><p>No analytics data available.</p></div>

  const statusData = Object.entries(data.by_status || {}).map(([name, value]) => ({ name, value }))
  const districtData = Object.entries(data.by_district || {}).map(([name, value]) => ({ name: name.split('(')[0].trim(), value }))
  const severityData = Object.entries(data.by_severity || {}).map(([name, value]) => ({ name, value }))
  const forecastData = data.ml_forecast?.forecast_7_days || []
  const fleetData = data.fleet_allocation || []
  const trend = data.ml_forecast?.trend_status || 'Stable (~)'
  const projectedWeekly = data.ml_forecast?.projected_weekly_total || 0

  return (
    <div>
      <div className="page-header">
        <h1>
          <AnalyticsIcon size={24} color="var(--indigo)" /> Municipal Operations &amp; Forecasting Analytics
        </h1>
        <p>City-wide complaint tracking, 7-day incident forecasting, and fleet resource distribution</p>
      </div>

      {/* PRIMARY METRIC CARDS */}
      <div className="grid-4" style={{marginBottom: 24}}>
        {[
          { label:'Total Reports', val: data.total_reports ?? 0, icon: <ReportIcon size={20} color="var(--teal)" />, bg: 'rgba(13,148,136,0.1)', color:'var(--teal)' },
          { label:'Resolved', val: data.resolved_count ?? 0, icon: <CheckCircleIcon size={20} color="var(--emerald)" />, bg: 'rgba(16,185,129,0.1)', color:'var(--emerald)' },
          { label:'Resolution Rate', val: `${data.resolution_rate ?? 0}%`, icon: <AnalyticsIcon size={20} color="var(--indigo)" />, bg: 'rgba(79,70,229,0.1)', color:'var(--indigo)' },
          { label:'Avg Resolve Time', val: data.avg_resolution_days ? `${data.avg_resolution_days}d` : 'N/A', icon: <ClockIcon size={20} color="var(--amber)" />, bg: 'rgba(245,158,11,0.1)', color:'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{borderTop: `3px solid ${s.color}`}}>
            <div className="stat-card-icon" style={{background: s.bg}}>
              {s.icon}
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 7-DAY FORECAST SECTION */}
      <div className="card" style={{marginBottom: 24}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16}}>
          <div>
            <div className="card-title">
              <SparklesIcon size={18} color="var(--indigo)" /> 7-Day Incident Volume Projection
            </div>
            <div className="card-sub" style={{marginTop: 2}}>
              Predictive trend analysis based on historic civic reporting cycles
            </div>
          </div>
          <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
            <span className={`badge ${trend.includes('+') ? 'badge-rejected' : trend.includes('-') ? 'badge-resolved' : 'badge-verified'}`}>
              Trend: {trend}
            </span>
            <span style={{
              background: 'var(--gray-100)',
              color: 'var(--gray-700)',
              padding: '3px 10px',
              borderRadius: 14,
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              Projected: <strong>{projectedWeekly} reports</strong>
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={forecastData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--indigo)" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{fontSize: 11, fill: '#64748b'}} />
            <YAxis tick={{fontSize: 11, fill: '#64748b'}} />
            <Tooltip 
              formatter={(value, name) => [value, name === 'predicted_reports' ? 'Predicted Reports' : name]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}
            />
            <Area 
              type="monotone" 
              dataKey="predicted_reports" 
              stroke="var(--indigo)" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#forecastGrad)" 
            />
            <Area 
              type="monotone" 
              dataKey="confidence_upper" 
              stroke="#cbd5e1" 
              strokeDasharray="4 4" 
              fill="transparent" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* CORE CHARTS: DISTRICT & STATUS */}
      <div className="grid-2" style={{marginBottom: 24}}>
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>
            <MapIcon size={18} color="var(--teal)" /> Reports by District
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={districtData} layout="vertical" margin={{left:10, right: 20}}>
              <XAxis type="number" tick={{fontSize: 11, fill: '#64748b'}} />
              <YAxis dataKey="name" type="category" width={120} tick={{fontSize:11, fill: '#64748b'}} />
              <Tooltip contentStyle={{borderRadius: 8, border: '1px solid #e2e8f0'}} />
              <Bar dataKey="value" fill="var(--teal)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>
            <AnalyticsIcon size={18} color="var(--indigo)" /> Reports by Status
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({name,value})=>`${name}: ${value}`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{fontSize: '0.8rem', paddingTop: 10}} />
              <Tooltip contentStyle={{borderRadius: 8, border: '1px solid #e2e8f0'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SEVERITY & FLEET ALLOCATION */}
      <div className="grid-2">
        {severityData.length > 0 && (
          <div className="card">
            <div className="card-title" style={{marginBottom:16}}>
              <FlameIcon size={18} color="var(--amber)" /> Reports by Severity Level
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} />
                <YAxis tick={{fontSize: 11, fill: '#64748b'}} />
                <Tooltip contentStyle={{borderRadius: 8, border: '1px solid #e2e8f0'}} />
                <Bar dataKey="value" fill="var(--amber)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RESOURCE DISPATCH MATRIX */}
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>
            <TruckIcon size={18} color="var(--teal)" /> Fleet Allocation Matrix
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>District</th>
                  <th>Active Complaints</th>
                  <th>Compactor Fleet</th>
                  <th>Sanitation Crew</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {fleetData.map((f, i) => (
                  <tr key={i}>
                    <td><strong>{f.district}</strong></td>
                    <td>{f.active_reports}</td>
                    <td><span className="badge badge-verified">{f.allocated_trucks} Trucks</span></td>
                    <td>{f.sanitation_workers} Workers</td>
                    <td>
                      <span className={`badge ${f.priority_level === 'High' ? 'badge-rejected' : f.priority_level === 'Medium' ? 'badge-inprogress' : 'badge-pending'}`}>
                        {f.priority_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
