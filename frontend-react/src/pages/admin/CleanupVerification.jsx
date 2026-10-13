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
    const f = accepted[0]; setFile(f); setPreview(URL.createObjectURL(f)); setResult(null)
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
    } catch (err) { toast.error(err.response?.data?.detail || 'Verification failed') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <CheckCircleIcon size={28} color="var(--indigo)" /> Cleanup Verification
        </h1>
        <p>Upload after-cleanup photos for AI comparison verification</p>
      </div>

      <div className="grid-2">
        {/* Select active report */}
        <div className="card">
          <div className="card-title" style={{marginBottom:16, display: 'flex', alignItems: 'center', gap: 8}}>
            <ReportIcon size={18} color="var(--indigo)" /> Active Reports (In Progress)
          </div>
          {reports.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:'var(--gray-400)'}}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: 8}}>
                <CheckCircleIcon size={36} color="var(--gray-400)" />
              </div>
              <p>No reports currently In Progress</p>
            </div>
          ) : reports.map(r => (
            <div key={r.id} className="card" style={{marginBottom:10,cursor:'pointer',border: selected?.id===r.id ? '2px solid var(--teal)' : '2px solid transparent'}}
              onClick={() => { setSelected(r); setFile(null); setPreview(null); setResult(null) }}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>
                  <span className="report-id-pill">{r.report_id}</span>
                  <div style={{fontWeight:700,marginTop:4,fontSize:'.88rem'}}>{r.district}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Upload and verify */}
        <div className="card">
          {!selected ? (
            <div style={{textAlign:'center',padding:60,color:'var(--gray-400)'}}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: 12}}>
                <ReportIcon size={44} color="var(--gray-400)" />
              </div>
              <p>Select a report to verify its cleanup</p>
            </div>
          ) : (
            <>
              <div className="card-title" style={{marginBottom:16}}>
                Upload After-Cleanup Photo for <span className="report-id-pill">{selected.report_id}</span>
              </div>

              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="dropzone-icon" style={{display: 'flex', justifyContent: 'center'}}>
                  <CameraIcon size={40} color="var(--indigo)" />
                </div>
                <div className="dropzone-text">Drop after-cleanup photo here</div>
              </div>

              {preview && (
                <div className="img-preview" style={{marginTop:12}}>
                  <img src={preview} alt="After cleanup" />
                </div>
              )}

              <div className="form-group" style={{marginTop:14}}>
                <label className="form-label">Supervisor Notes</label>
                <textarea className="form-input form-textarea" placeholder="Describe verification observations..."
                  value={notes} onChange={e => setNotes(e.target.value)} style={{minHeight:60}} />
              </div>

              <button className="btn btn-primary btn-full" onClick={handleVerify} disabled={!file || loading} style={{display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center'}}>
                <BotIcon size={18} /> {loading ? 'AI Verifying...' : 'Verify Cleanup with AI'}
              </button>

              {result && (
                <div style={{marginTop:16,padding:16,background:'var(--gray-50)',borderRadius:10}}>
                  <div style={{fontWeight:800,fontSize:'1.1rem',marginBottom:12}}>
                    AI Verdict: <span style={{color: result.verdict==='Verified Clean' ? 'var(--emerald)' : result.verdict==='Partially Clean' ? 'var(--amber)' : 'var(--rose)'}}>
                      {result.verdict}
                    </span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                    <div className="stat-card" style={{padding:12,borderLeftColor:'var(--teal)'}}>
                      <div className="stat-val" style={{fontSize:'1.4rem'}}>{result.waste_reduction_pct}%</div>
                      <div className="stat-label">Waste Reduced</div>
                    </div>
                    <div className="stat-card" style={{padding:12,borderLeftColor:'var(--indigo)'}}>
                      <div className="stat-val" style={{fontSize:'1.4rem'}}>{result.after_detections}</div>
                      <div className="stat-label">Items Remaining</div>
                    </div>
                  </div>
                  <div style={{fontSize:'.85rem',color:'var(--gray-600)'}}>{result.explanation}</div>
                  <div style={{marginTop:10}}>
                    New Status: <StatusBadge status={result.status} />
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
