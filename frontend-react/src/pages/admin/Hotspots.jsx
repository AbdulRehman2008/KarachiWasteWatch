import { useEffect, useState } from 'react'
import { getHotspots } from '../../api/api'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import { FlameIcon } from '../../components/Icons'
import 'leaflet/dist/leaflet.css'

export default function Hotspots() {
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHotspots().then(r => setHotspots(r.data?.hotspots || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <FlameIcon size={28} color="var(--rose)" /> Waste Hotspots
        </h1>
        <p>DBSCAN-clustered recurring waste problem zones — {hotspots.length} hotspot(s) identified</p>
      </div>

      <div className="map-container" style={{marginBottom:24}}>
        <MapContainer center={[24.8607, 67.0104]} zoom={11} style={{height:'100%',width:'100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          {hotspots.map((h, i) => (
            <Circle key={i} center={[h.center_lat, h.center_lon]} radius={500}
              pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.3 }}>
              <Popup>
                <strong>Hotspot #{i+1}</strong><br/>
                {h.report_count} reports<br/>
                {h.district || 'Multiple districts'}
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      <div className="grid-3">
        {hotspots.map((h, i) => (
          <div key={i} className="card" style={{borderLeft:'4px solid var(--rose)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontWeight:800,color:'var(--rose)', display: 'flex', alignItems: 'center', gap: 6}}>
                <FlameIcon size={16} color="var(--rose)" /> Hotspot #{i+1}
              </div>
              <span className="badge badge-rejected">{h.report_count} reports</span>
            </div>
            <div style={{fontSize:'.85rem',color:'var(--gray-600)'}}>
              <div>District: {h.district || 'Multiple districts'}</div>
              <div>Coordinates: {h.center_lat?.toFixed(4)}, {h.center_lon?.toFixed(4)}</div>
            </div>
          </div>
        ))}
        {hotspots.length === 0 && (
          <div className="card" style={{gridColumn:'1/-1',textAlign:'center',padding:40}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 12}}>
              <FlameIcon size={44} color="var(--gray-400)" />
            </div>
            <p style={{color:'var(--gray-400)'}}>No hotspots detected — city is in good shape!</p>
          </div>
        )}
      </div>
    </div>
  )
}
