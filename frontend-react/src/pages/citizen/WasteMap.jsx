import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { getReports } from '../../api/api'
import StatusBadge from '../../components/StatusBadge'
import { MapIcon } from '../../components/Icons'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png', iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' })

export default function WasteMap() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReports().then(r => setReports((r.data || []).filter(r => r.latitude && r.longitude)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <MapIcon size={28} color="var(--teal)" /> Waste Map
        </h1>
        <p>Live map showing {reports.length} waste report locations across Karachi</p>
      </div>

      <div className="map-container">
        <MapContainer center={[24.8607, 67.0104]} zoom={11} style={{height:'100%',width:'100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          {reports.map(r => (
            <Marker key={r.id} position={[r.latitude, r.longitude]}>
              <Popup>
                <div style={{minWidth:180}}>
                  <div style={{fontWeight:700,marginBottom:6}}>{r.district}</div>
                  <div style={{marginBottom:6}}><StatusBadge status={r.status} /></div>
                  <div style={{fontSize:'.82rem',color:'#666'}}>{r.report_id}</div>
                  {r.description && <div style={{fontSize:'.8rem',marginTop:6}}>{r.description}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{marginTop:20,display:'flex',gap:16,flexWrap:'wrap'}}>
        {['Pending','Verified','In Progress','Resolved'].map(s => (
          <div key={s} style={{display:'flex',alignItems:'center',gap:8,fontSize:'.85rem'}}>
            <StatusBadge status={s} /> {reports.filter(r => r.status === s).length} reports
          </div>
        ))}
      </div>
    </div>
  )
}
