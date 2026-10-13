import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-toastify'
import { ScannerIcon, CameraIcon, BotIcon } from '../../components/Icons'

const API_BASE = '/api'

export default function AIScanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [annotated, setAnnotated] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null); setAnnotated(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*':[]}, maxFiles:1 })

  const handleScan = async () => {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('image', file)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/reports/scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      setResult(data)
      if (data.annotated_image_b64) setAnnotated(`data:image/jpeg;base64,${data.annotated_image_b64}`)
      toast.success(`Detected ${data.total_detections} waste items`)
    } catch {
      toast.error('AI scan failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <ScannerIcon size={28} color="var(--teal)" /> AI Waste Scanner
        </h1>
        <p>Upload an image to detect waste using YOLO AI</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{marginBottom:16, display: 'flex', alignItems: 'center', gap: 8}}>
            <CameraIcon size={18} color="var(--teal)" /> Upload Image
          </div>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon" style={{display: 'flex', justifyContent: 'center'}}>
              <CameraIcon size={40} color="var(--teal)" />
            </div>
            <div className="dropzone-text">{isDragActive ? 'Drop image here' : 'Drag & drop an image, or click to select'}</div>
          </div>

          {preview && (
            <div className="img-preview" style={{marginTop:16}}>
              <img src={preview} alt="Preview" />
            </div>
          )}

          <button className="btn btn-primary btn-full" style={{marginTop:16, display: 'flex', gap: 8, alignItems: 'center'}} onClick={handleScan} disabled={!file || loading}>
            <BotIcon size={18} /> {loading ? 'Running AI Detection...' : 'Run AI Detection'}
          </button>
        </div>

        <div className="card">
          <div className="card-title" style={{marginBottom:16, display: 'flex', alignItems: 'center', gap: 8}}>
            <BotIcon size={18} color="var(--teal)" /> Detection Results
          </div>

          {!result && !loading && (
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--gray-400)'}}>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: 12}}>
                <BotIcon size={48} color="var(--gray-400)" />
              </div>
              <p>Upload and scan an image to see AI results</p>
            </div>
          )}

          {loading && <div className="spinner" />}

          {result && (
            <div>
              {annotated && <div className="img-preview" style={{marginBottom:16}}><img src={annotated} alt="Annotated" /></div>}

              <div className="grid-2" style={{marginBottom:16}}>
                <div className="stat-card" style={{borderLeftColor:'var(--teal)'}}>
                  <div className="stat-val">{result.total_detections}</div>
                  <div className="stat-label">Items Detected</div>
                </div>
                <div className="stat-card" style={{borderLeftColor:'var(--amber)'}}>
                  <div className="stat-val">{result.waste_coverage_pct}%</div>
                  <div className="stat-label">Area Coverage</div>
                </div>
              </div>

              {result.detections?.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Class</th><th>Confidence</th></tr></thead>
                    <tbody>
                      {result.detections.map((d, i) => (
                        <tr key={i}>
                          <td>{i+1}</td>
                          <td>{d.class_name}</td>
                          <td>{(d.confidence * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
