import { useEffect, useState } from 'react'
import { getHotspots } from '../../api/api'
import { MapContainer, TileLayer, Circle, Popup, Marker, useMap } from 'react-leaflet'
import { FlameIcon, SparklesIcon, TruckIcon } from '../../components/Icons'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Custom marker icon for hotspot centroids
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function FitHotspotBounds({ hotspots }) {
  const map = useMap()
  useEffect(() => {
    const valid = hotspots
      .filter(h => (h.center_lat || h.center_latitude) && (h.center_lon || h.center_longitude))
      .map(h => [h.center_lat || h.center_latitude, h.center_lon || h.center_longitude])

    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
    }
  }, [hotspots, map])
  return null
}

export default function Hotspots() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHotspots()
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  const hotspots = data?.hotspots || []
  const totalHotspots = data?.total_hotspots || hotspots.length
  const clusteredCount = data?.clustered_reports_count || 0
  const algorithm = data?.algorithm || 'DBSCAN Spatial Clustering'

  return (
    <div>
      <div className="page-header">
        <h1>
          <FlameIcon size={24} color="var(--rose)" /> Incident Hotspots &amp; Spatial Clusters
        </h1>
        <p>Spatial density clustering identifying recurring waste accumulation zones across Karachi</p>
      </div>

      {/* SUMMARY HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '12px 18px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--gray-150)',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <SparklesIcon size={16} color="var(--indigo)" />
          <span style={{fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)'}}>
            {algorithm}
          </span>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <span className="badge badge-rejected">
            {totalHotspots} Active Clusters
          </span>
          <span className="badge badge-verified">
            {clusteredCount} Incidents Clustered
          </span>
        </div>
      </div>

      <div className="map-container" style={{marginBottom: 24, minHeight: 440}}>
        <MapContainer center={[24.8607, 67.0104]} zoom={11} style={{height: '100%', width: '100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          
          <FitHotspotBounds hotspots={hotspots} />

          {hotspots.map((h, i) => {
            const lat = h.center_lat || h.center_latitude
            const lon = h.center_lon || h.center_longitude
            const radius = h.radius_meters || 400

            if (!lat || !lon) return null

            return (
              <div key={i}>
                <Circle 
                  center={[lat, lon]} 
                  radius={radius}
                  pathOptions={{ 
                    color: h.risk_level === 'Critical' ? '#dc2626' : h.risk_level === 'High' ? '#ea580c' : '#f59e0b', 
                    fillColor: h.risk_level === 'Critical' ? '#ef4444' : '#f97316', 
                    fillOpacity: 0.22,
                    weight: 2
                  }}
                />
                <Marker position={[lat, lon]} icon={redIcon}>
                  <Popup>
                    <div style={{minWidth: 190}}>
                      <div style={{fontWeight: 700, fontSize: '0.88rem', color: '#dc2626', marginBottom: 2}}>
                        Hotspot Cluster #{i + 1}
                      </div>
                      <div style={{fontWeight: 600, fontSize: '0.85rem'}}>{h.district}</div>
                      <div style={{fontSize: '0.78rem', color: 'var(--gray-600)', margin: '4px 0'}}>
                        <strong>{h.report_count}</strong> reports in ~{radius}m radius
                      </div>
                      <div style={{marginTop: 6}}>
                        <span className={`badge ${h.risk_level === 'Critical' ? 'badge-rejected' : h.risk_level === 'High' ? 'badge-pending' : 'badge-inprogress'}`}>
                          {h.risk_level} Risk
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            )
          })}
        </MapContainer>
      </div>

      {/* HOTSPOTS DETAIL CARDS */}
      <div className="grid-3">
        {hotspots.map((h, i) => {
          const lat = h.center_lat || h.center_latitude
          const lon = h.center_lon || h.center_longitude
          const isCritical = h.risk_level === 'Critical'
          const isHigh = h.risk_level === 'High'
          const borderColor = isCritical ? 'var(--rose)' : isHigh ? 'var(--amber)' : 'var(--indigo)'

          return (
            <div key={i} className="card" style={{borderTop: `3px solid ${borderColor}`}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                <div style={{fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 6}}>
                  <FlameIcon size={16} color={borderColor} /> Hotspot #{i + 1}
                </div>
                <span className={`badge ${isCritical ? 'badge-rejected' : isHigh ? 'badge-pending' : 'badge-inprogress'}`}>
                  {h.risk_level}
                </span>
              </div>

              <div style={{fontSize: '0.88rem', color: 'var(--gray-900)', fontWeight: 600, marginBottom: 6}}>
                {h.district}
              </div>

              <div style={{fontSize: '0.8rem', color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: 12}}>
                <div>Cluster Density: <strong>{h.report_count} incidents</strong></div>
                <div>Coverage Radius: ~{h.radius_meters || 350} meters</div>
                <div style={{color: 'var(--gray-400)', fontSize: '0.75rem', marginTop: 2}}>
                  Centroid: {lat?.toFixed(4)}, {lon?.toFixed(4)}
                </div>
              </div>

              {h.recommended_fleet_focus && (
                <div style={{
                  padding: '8px 10px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--gray-200)',
                  fontSize: '0.75rem',
                  color: 'var(--gray-700)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <TruckIcon size={13} color="var(--indigo)" />
                  <span>{h.recommended_fleet_focus}</span>
                </div>
              )}
            </div>
          )
        })}

        {hotspots.length === 0 && (
          <div className="card" style={{gridColumn: '1/-1'}}>
            <div className="empty-state">
              <FlameIcon size={40} color="var(--gray-300)" />
              <p style={{fontWeight: 600, color: 'var(--gray-600)'}}>No active hotspots detected</p>
              <p style={{fontSize: '0.82rem', marginTop: 4}}>All municipal sectors are currently below the cluster threshold.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
