import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { getMyMapSummary } from '../../api/api'
import StatusBadge from '../../components/StatusBadge'
import { MapIcon, FlameIcon } from '../../components/Icons'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ 
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png', 
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', 
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' 
})

// Custom marker icon for hotspot center
const hotspotIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function FitBounds({ reports, hotspot }) {
  const map = useMap()
  useEffect(() => {
    const points = reports
      .filter(r => r.latitude && r.longitude)
      .map(r => [r.latitude, r.longitude])
    
    if (hotspot?.center) {
      points.push([hotspot.center.lat, hotspot.center.lng])
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [reports, hotspot, map])
  return null
}

export default function CitizenWasteMap() {
  const [mapData, setMapData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyMapSummary()
      .then(res => setMapData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  const reports = (mapData?.reports || []).filter(r => r.latitude && r.longitude)
  const hotspot = mapData?.hotspot
  const statusBreakdown = mapData?.status_breakdown || {}

  return (
    <div>
      <div className="page-header">
        <h1>
          <MapIcon size={24} color="var(--teal)" /> My Incident Map
        </h1>
        <p>
          Viewing {reports.length} of your submitted waste locations
        </p>
      </div>

      {/* Hotspot highlight banner */}
      {hotspot && (
        <div style={{
          background: 'var(--amber-light)',
          border: '1px solid #fed7aa',
          borderRadius: 'var(--radius)',
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius)',
            background: 'rgba(245,158,11,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FlameIcon size={18} color="var(--amber)" />
          </div>
          <div>
            <div style={{fontWeight: 700, fontSize: '0.88rem', color: '#92400e'}}>
              Highest Activity Sector: {hotspot.district}
            </div>
            <div style={{fontSize: '0.8rem', color: '#a16207', marginTop: 1}}>
              You have submitted <strong>{hotspot.report_count}</strong> report{hotspot.report_count > 1 ? 's' : ''} in this area.
              {hotspot.report_count >= 3 && ' A proximity radius is highlighted on your map.'}
            </div>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <MapIcon size={44} color="var(--gray-300)" />
            <p style={{fontWeight: 600, color: 'var(--gray-600)'}}>No location data yet</p>
            <p style={{fontSize: '0.82rem', marginTop: 4}}>
              Reports submitted with GPS or area coordinates will be plotted here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="map-container" style={{marginBottom: 20}}>
            <MapContainer center={[24.8607, 67.0104]} zoom={11} style={{height:'100%',width:'100%'}}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
              
              <FitBounds reports={reports} hotspot={hotspot} />

              {/* Hotspot highlight circle */}
              {hotspot?.center && (
                <>
                  <Circle
                    center={[hotspot.center.lat, hotspot.center.lng]}
                    radius={800}
                    pathOptions={{
                      color: 'var(--rose)',
                      fillColor: 'var(--rose)',
                      fillOpacity: 0.1,
                      weight: 1.5,
                      dashArray: '6, 6',
                    }}
                  />
                  <Marker position={[hotspot.center.lat, hotspot.center.lng]} icon={hotspotIcon}>
                    <Popup>
                      <div style={{minWidth: 180}}>
                        <div style={{fontWeight: 700, fontSize: '0.88rem', color: 'var(--rose)', marginBottom: 2}}>
                          Frequent Reporting Zone
                        </div>
                        <div style={{fontWeight: 600, fontSize: '0.85rem'}}>{hotspot.district}</div>
                        <div style={{fontSize: '.78rem', color: 'var(--gray-600)', marginTop: 4}}>
                          {hotspot.report_count} reports filed here
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {/* Individual report markers */}
              {reports.map(r => (
                <Marker key={r.id} position={[r.latitude, r.longitude]}>
                  <Popup>
                    <div style={{minWidth: 180}}>
                      <div style={{fontWeight: 700, fontSize: '0.88rem', marginBottom: 4}}>{r.district}</div>
                      <div style={{marginBottom: 6}}><StatusBadge status={r.status} /></div>
                      <div style={{fontSize: '.78rem', color: 'var(--gray-500)', marginBottom: 4}}>
                        ID: <span className="report-id-pill">{r.report_id}</span>
                      </div>
                      {r.description && (
                        <div style={{fontSize: '.78rem', color: 'var(--gray-700)', marginTop: 4, lineHeight: 1.4}}>
                          {r.description}
                        </div>
                      )}
                      <div style={{fontSize: '.72rem', color: 'var(--gray-400)', marginTop: 6}}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Status summary */}
          <div className="card" style={{padding: '14px 20px'}}>
            <div style={{fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em'}}>
              Report Status Breakdown
            </div>
            <div style={{display:'flex', gap: 16, flexWrap:'wrap', alignItems: 'center'}}>
              {['Pending','Verified','In Progress','Resolved'].map(s => (
                <div key={s} style={{display:'flex', alignItems:'center', gap: 8, fontSize:'.82rem'}}>
                  <StatusBadge status={s} /> 
                  <span style={{fontWeight: 600, color: 'var(--gray-700)'}}>{statusBreakdown[s] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
