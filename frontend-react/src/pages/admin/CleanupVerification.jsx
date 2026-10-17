import { useEffect, useState, useCallback } from 'react'
import { getReports, verifyCleanup } from '../../api/api'
import { useDropzone } from 'react-dropzone'
import StatusBadge from '../../components/StatusBadge'
import { toast } from 'react-toastify'
import { 
  CheckCircleIcon, 
  CameraIcon, 
  ReportIcon, 
  BotIcon 
} from '../../components/Icons'

export default function CleanupVerification() {
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getReports({ status: 'In Progress' }).then(r => setReports(r.data?.filter(r => r.status === 'In Progress') || []))
  }, [])

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*':[]}, maxFiles:1 })

  const handleVerify = async () => {
    if (!selected || !file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('after_image', file)
      fd.append('notes', notes)
      const res = await verifyCleanup(selected.id, fd)
      setResult(res.data)
      toast.success(`Verification complete: ${res.data.verdict}`)
      if (res.data.status === 'Resolved') {
        setReports(reports.filter(r => r.id !== selected.id))
        setSelected(null)
      }
    } catch (err) { 
      toast.error(err.response?.data?.detail || 'Verification request failed') 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          <CheckCircleIcon size={24} color="var(--indigo)" /> Cleanup Verification
        </h1>
        <p>Inspect post-cleanup photos with automated before/after comparison to confirm resolution</p>
      </div>

      <div className="grid-2">
        {/* SELECT ACTIVE REPORT */}
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>
            <ReportIcon size={18} color="var(--indigo)" /> Active Reports (In Progress)
          </div>
          {reports.length === 0 ? (
            <div className="empty-state">
              <CheckCircleIcon size={36} color="var(--gray-300)" />
              <p style={{fontWeight: 600, color: 'var(--gray-600)'}}>No reports currently In Progress</p>
              <p style={{fontSize: '0.8rem', marginTop: 4}}>Assign sanitation teams to pending reports to verify cleanups.</p>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '65vh', overflowY: 'auto'}}>
              {reports.map(r => (
                <div 
                  key={r.id} 
                  className="card" 
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    border: selected?.id === r.id ? '1.5px solid var(--teal)' : '1px solid var(--gray-150)',
                    background: selected?.id === r.id ? 'var(--teal-light)' : '#fff',
                    transition: 'border-color var(--duration), background var(--duration)'
                  }}
                  onClick={() => { setSelected(r); setFile(null); setPreview(null); setResult(null) }}
                >
                  <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                    <div>
                      <span className="report-id-pill">{r.report_id}</span>
                      <div style={{fontWeight: 600, marginTop: 4, fontSize: '0.88rem', color: 'var(--gray-900)'}}>
                        {r.district} {r.area ? `• ${r.area}` : ''}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UPLOAD & VERIFY */}
        <div className="card">
          {!selected ? (
            <div className="empty-state" style={{padding: '60px 20px'}}>
              <ReportIcon size={40} color="var(--gray-300)" />
              <p style={{fontWeight: 600, color: 'var(--gray-600)'}}>Select a report from the left</p>
              <p style={{fontSize: '0.8rem', marginTop: 4}}>Upload an after-cleanup photo to verify site clearing.</p>
            </div>
          ) : (
            <>
              <div className="card-title" style={{marginBottom:16}}>
                Upload After-Cleanup Photo for <span className="report-id-pill">{selected.report_id}</span>
              </div>

              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="dropzone-icon" style={{display: 'flex', justifyContent: 'center'}}>
                  <CameraIcon size={36} color="var(--indigo)" />
                </div>
                <div className="dropzone-text">Drop after-cleanup photo here, or click to browse</div>
                <div className="dropzone-sub">Single photo of cleared location</div>
              </div>

              {preview && (
                <div className="img-preview" style={{marginTop: 14}}>
                  <img src={preview} alt="After cleanup" />
                </div>
              )}

              <div className="form-group" style={{marginTop: 14}}>
                <label className="form-label">Supervisor Notes</label>
                <textarea 
                  className="form-input form-textarea" 
                  placeholder="Record observations, crew details, or inspection remarks..."
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  style={{minHeight: 70}} 
                />
              </div>

              <button 
                className="btn btn-primary btn-full btn-lg" 
                onClick={handleVerify} 
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{width: 16, height: 16, borderWidth: 2, margin: 0}} />
                    Comparing Before &amp; After Images...
                  </>
                ) : (
                  <>
                    <BotIcon size={18} /> Verify Site Cleanup
                  </>
                )}
              </button>

              {result && (
                <div style={{
                  marginTop: 16,
                  padding: 16,
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                    <span style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-600)'}}>Verification Verdict:</span>
                    <span className={`badge ${result.verdict === 'Verified Clean' ? 'badge-resolved' : result.verdict === 'Partially Clean' ? 'badge-pending' : 'badge-rejected'}`} style={{fontSize: '0.8rem', padding: '4px 12px'}}>
                      {result.verdict}
                    </span>
                  </div>

                  <div className="grid-2" style={{marginBottom: 12}}>
                    <div className="stat-card" style={{padding: '10px 12px', borderTop: '2px solid var(--emerald)'}}>
                      <div className="stat-val" style={{fontSize: '1.4rem'}}>{result.waste_reduction_pct}%</div>
                      <div className="stat-label">Waste Reduced</div>
                    </div>
                    <div className="stat-card" style={{padding: '10px 12px', borderTop: '2px solid var(--indigo)'}}>
                      <div className="stat-val" style={{fontSize: '1.4rem'}}>{result.after_detections}</div>
                      <div className="stat-label">Items Remaining</div>
                    </div>
                  </div>

                  <div style={{fontSize: '0.82rem', color: 'var(--gray-600)', lineHeight: 1.5}}>
                    {result.explanation}
                  </div>

                  <div style={{marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem'}}>
                    <span style={{color: 'var(--gray-500)'}}>Updated Complaint Status:</span>
                    <StatusBadge status={result.status} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
