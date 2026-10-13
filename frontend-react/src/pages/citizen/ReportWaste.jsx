import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createReport } from '../../api/api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { 
  ReportIcon, 
  CameraIcon, 
  BotIcon, 
  MapIcon, 
  CheckCircleIcon 
} from '../../components/Icons'

const DISTRICTS = [
  'District South (Saddar, Clifton, DHA)',
  'District East (Gulshan, Johar, PECHS)',
  'District Central (Nazimabad, North Nazimabad)',
  'District Korangi','District Keamari','District Malir',
]

const STEPS = ['Select Image', 'AI Detection', 'Location & Submit', 'Done']

export default function ReportWaste() {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [annotated, setAnnotated] = useState(null)
  const [form, setForm] = useState({ district: '', latitude: '', longitude: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [createdReport, setCreatedReport] = useState(null)
  const navigate = useNavigate()

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    setFile(f); setPreview(URL.createObjectURL(f)); setStep(0)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*':[]}, maxFiles:1 })

  const handleAIScan = async () => {
    if (!file) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const fd = new FormData(); fd.append('image', file)
      const res = await fetch('/api/reports/scan', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      setAiResult(data)
      if (data.annotated_image_b64) setAnnotated(`data:image/jpeg;base64,${data.annotated_image_b64}`)
      setStep(2)
    } catch { toast.error('AI scan failed') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      Object.entries(form).forEach(([k,v]) => fd.append(k, v))
      const res = await createReport(fd)
      setCreatedReport(res.data)
      setStep(3)
      toast.success(`Report ${res.data.report_id} submitted!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <ReportIcon size={28} color="var(--teal)" /> Report Waste
        </h1>
        <p>Submit a waste complaint — AI will analyse your photo automatically</p>
      </div>

      {/* STEP INDICATOR */}
      <div style={{display:'flex',gap:0,marginBottom:32}}>
        {STEPS.map((s,i) => (
          <div key={s} style={{flex:1,textAlign:'center'}}>
            <div style={{width:32,height:32,borderRadius:'50%',margin:'0 auto 6px',
              background: i <= step ? 'var(--teal)' : 'var(--gray-200)',
              color: i <= step ? '#fff' : 'var(--gray-400)',
              display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.85rem'}}>
              {i < step ? '✓' : i+1}
            </div>
            <div style={{fontSize:'.72rem',color: i === step ? 'var(--teal)' : 'var(--gray-400)',fontWeight: i === step ? 700 : 400}}>{s}</div>
          </div>
        ))}
      </div>

      {step === 3 && createdReport ? (
        <div className="card" style={{textAlign:'center',padding:48}}>
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: 16}}>
            <CheckCircleIcon size={56} color="var(--emerald)" />
          </div>
          <h2>Report Submitted!</h2>
          <p style={{margin:'12px 0'}}>Your Report ID: <span className="report-id-pill">{createdReport.report_id}</span></p>
          <p style={{color:'var(--gray-400)',marginBottom:24}}>Status: <strong>Pending</strong> — Admin will review within 24 hours</p>
          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
            <button className="btn btn-primary" onClick={() => navigate('/citizen/my-reports')} style={{display: 'inline-flex', gap: 8, alignItems: 'center'}}>
              <ReportIcon size={16} /> My Reports
            </button>
            <button className="btn btn-secondary" onClick={() => { setStep(0); setFile(null); setPreview(null); setAiResult(null); }}>
              New Report
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {/* LEFT: image + AI */}
          <div className="card">
            <div className="card-title" style={{marginBottom:16, display: 'flex', alignItems: 'center', gap: 8}}>
              <CameraIcon size={18} color="var(--teal)" /> Step 1 — Upload Photo
            </div>
            {!preview ? (
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="dropzone-icon" style={{display: 'flex', justifyContent: 'center'}}>
                  <CameraIcon size={40} color="var(--teal)" />
                </div>
                <div className="dropzone-text">Drag & drop waste photo or click to select</div>
              </div>
            ) : (
              <>
                <div className="img-preview">
                  <img src={annotated || preview} alt="Preview" />
                </div>
                <div style={{display:'flex',gap:10,marginTop:12}}>
                  <div {...getRootProps()} style={{cursor:'pointer'}}>
                    <input {...getInputProps()} />
                    <button className="btn btn-secondary btn-sm" type="button">Change Photo</button>
                  </div>
                  {step < 2 && (
                    <button className="btn btn-primary" onClick={handleAIScan} disabled={loading} style={{display: 'inline-flex', gap: 8, alignItems: 'center'}}>
                      <BotIcon size={16} /> {loading ? 'Scanning...' : 'Run AI Detection'}
                    </button>
                  )}
                </div>
              </>
            )}

            {aiResult && (
              <div style={{marginTop:16,padding:14,background:'var(--gray-50)',borderRadius:10}}>
                <div style={{fontWeight:700,marginBottom:10, display: 'flex', alignItems: 'center', gap: 8}}>
                  <BotIcon size={16} color="var(--teal)" /> AI Detection Results
                </div>
                <div className="grid-2" style={{marginBottom:12}}>
                  <div className="stat-card" style={{borderLeftColor:'var(--teal)',padding:14}}>
                    <div className="stat-val" style={{fontSize:'1.4rem'}}>{aiResult.total_detections}</div>
                    <div className="stat-label">Items Found</div>
                  </div>
                  <div className="stat-card" style={{borderLeftColor:'var(--amber)',padding:14}}>
                    <div className="stat-val" style={{fontSize:'1.4rem'}}>{aiResult.waste_coverage_pct}%</div>
                    <div className="stat-label">Coverage</div>
                  </div>
                </div>
                {aiResult.detections?.slice(0,3).map((d,i) => (
                  <div key={i} style={{fontSize:'.82rem',color:'var(--gray-600)',marginBottom:4}}>
                    • {d.class_name} — {(d.confidence*100).toFixed(1)}%
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Location form */}
          <div className="card">
            <div className="card-title" style={{marginBottom:16, display: 'flex', alignItems: 'center', gap: 8}}>
              <MapIcon size={18} color="var(--teal)" /> Step 2 — Location & Details
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">District *</label>
                <select className="form-input form-select" required
                  value={form.district} onChange={e => setForm({...form, district: e.target.value})}>
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" placeholder="24.8607" type="number" step="any"
                    value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" placeholder="67.0104" type="number" step="any"
                    value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" placeholder="Describe the waste issue..."
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={!file || loading} style={{display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center'}}>
                <ReportIcon size={18} /> {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
