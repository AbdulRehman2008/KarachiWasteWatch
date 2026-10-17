import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { getReports } from '../../api/api'
import StatusBadge from '../../components/StatusBadge'
import { MapIcon } from '../../components/Icons'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ 
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png', 
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', 
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' 
})

const STATUSES = ['All', 'Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected']

export default function AdminWasteMap() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    getReports().then(r => setReports((r.data || []).filter(r => r.latitude && r.longitude)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterStatus === 'All'
    ? reports
    : reports.filter(r => r.status === filterStatus)

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header">
        <h1>
          <MapIcon size={24} color="var(--indigo)" /> City-Wide Waste Map
        </h1>
        <p>Geospatial overview of all {reports.length} geo-tagged waste incidents across Karachi</p>
      </div>

      {/* Filters */}
      <div style={{marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <span style={{fontWeight: 600, fontSize: '.82rem', color: 'var(--gray-600)'}}>Status Filter:</span>
          <select 
            className="form-input form-select" 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            style={{maxWidth: 160, padding: '7px 12px', fontSize: '0.82rem'}}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
        </div>
        <span style={{fontSize: '.82rem', color: 'var(--gray-400)'}}>
          Showing <strong>{filtered.length}</strong> of {reports.length} reports
        </span>
      </div>

      <div className="map-container" style={{marginBottom: 20}}>
        <MapContainer center={[24.8607, 67.0104]} zoom={11} style={{height:'100%',width:'100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          {filtered.map(r => (
            <Marker key={r.id} position={[r.latitude, r.longitude]}>
              <Popup>
                <div style={{minWidth: 190}}>
                  <div style={{fontWeight: 700, fontSize: '0.9rem', marginBottom: 4}}>{r.district}</div>
                  <div style={{marginBottom: 6}}><StatusBadge status={r.status} /></div>
                  <div style={{fontSize: '.8rem', color: 'var(--gray-500)', marginBottom: 4}}>
                    ID: <span className="report-id-pill">{r.report_id}</span>
                  </div>
                  {r.citizen && (
                    <div style={{fontSize: '.78rem', color: 'var(--gray-600)', marginTop: 4}}>
                      Citizen: {r.citizen.full_name} ({r.citizen.citizen_id})
                    </div>
                  )}
                  {r.description && (
                    <div style={{fontSize: '.78rem', color: 'var(--gray-700)', marginTop: 6, lineHeight: 1.4}}>
                      {r.description}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="card" style={{padding: '14px 20px'}}>
        <div style={{fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em'}}>
          Status Distribution
        </div>
        <div style={{display:'flex', gap: 16, flexWrap:'wrap', alignItems: 'center'}}>
          {['Pending','Verified','In Progress','Resolved','Rejected'].map(s => (
            <div key={s} style={{display:'flex', alignItems:'center', gap: 8, fontSize:'.82rem'}}>
              <StatusBadge status={s} /> 
              <span style={{fontWeight: 600, color: 'var(--gray-700)'}}>{reports.filter(r => r.status === s).length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
