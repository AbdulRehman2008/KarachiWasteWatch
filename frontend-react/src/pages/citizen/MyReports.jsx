import { useEffect, useState } from 'react'
import { getReports, getReport } from '../../api/api'
import StatusBadge from '../../components/StatusBadge'
import { ReportIcon, BotIcon, ClockIcon } from '../../components/Icons'

export default function MyReports() {
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReports().then(r => setReports(r.data || [])).finally(() => setLoading(false))
  }, [])

  const openReport = async (rep) => {
    setSelected(rep)
    const res = await getReport(rep.id)
    setDetail(res.data)
  }

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <ReportIcon size={28} color="var(--teal)" /> My Reports
        </h1>
        <p>{reports.length} complaint(s) submitted</p>
      </div>

      <div className="grid-2">
        {/* LIST */}
        <div>
          {reports.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:40}}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: 12}}>
                <ReportIcon size={44} color="var(--gray-400)" />
              </div>
              <p style={{color:'var(--gray-400)'}}>No reports yet</p>
            </div>
          ) : reports.map(r => (
            <div key={r.id} className="card" style={{marginBottom:14,cursor:'pointer',border: selected?.id===r.id ? '2px solid var(--teal)' : '2px solid transparent'}}
              onClick={() => openReport(r)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div><span className="report-id-pill">{r.report_id}</span></div>
                  <div style={{fontWeight:700,marginTop:6}}>{r.district}</div>
                  <div style={{fontSize:'.82rem',color:'var(--gray-400)',marginTop:4}}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.description && <div style={{marginTop:10,fontSize:'.85rem',color:'var(--gray-600)',borderTop:'1px solid var(--gray-100)',paddingTop:10}}>{r.description}</div>}
            </div>
          ))}
        </div>

        {/* DETAIL */}
        <div>
          {!selected ? (
            <div className="card" style={{textAlign:'center',padding:60}}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: 12}}>
                <ReportIcon size={44} color="var(--gray-400)" />
              </div>
              <p style={{color:'var(--gray-400)'}}>Select a report to view details</p>
            </div>
          ) : (
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
                <div>
                  <div className="card-title">{selected.district}</div>
                  <div><span className="report-id-pill">{selected.report_id}</span></div>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {detail?.ai_detection && (
                <div style={{background:'var(--gray-50)',borderRadius:10,padding:14,marginBottom:20}}>
                  <div style={{fontWeight:700,marginBottom:10, display: 'flex', alignItems: 'center', gap: 6}}>
                    <BotIcon size={16} color="var(--teal)" /> AI Detection
                  </div>
                  <div className="grid-2">
                    <div><span style={{color:'var(--gray-400)',fontSize:'.8rem'}}>Items</span><br/><strong>{detail.ai_detection.total_detections}</strong></div>
                    <div><span style={{color:'var(--gray-400)',fontSize:'.8rem'}}>Coverage</span><br/><strong>{detail.ai_detection.waste_coverage_pct}%</strong></div>
                    <div><span style={{color:'var(--gray-400)',fontSize:'.8rem'}}>Type</span><br/><strong>{detail.ai_detection.waste_type}</strong></div>
                    <div><span style={{color:'var(--gray-400)',fontSize:'.8rem'}}>Severity</span><br/><strong>{detail.ai_detection.severity_level}</strong></div>
                  </div>
                </div>
              )}

              {detail?.history?.length > 0 && (
                <div>
                  <div style={{fontWeight:700,marginBottom:14, display: 'flex', alignItems: 'center', gap: 6}}>
                    <ClockIcon size={16} color="var(--teal)" /> Status History
                  </div>
                  <ul className="timeline">
                    {[...detail.history].reverse().map((h, i) => (
                      <li key={i} className="timeline-item">
                        <div className="timeline-dot">✓</div>
                        <div className="timeline-body">
                          <div className="timeline-title">{h.from_status} → <strong>{h.to_status}</strong></div>
                          <div className="timeline-date">{new Date(h.changed_at).toLocaleString()} by {h.changed_by}</div>
                          {h.notes && <div className="timeline-note">{h.notes}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
