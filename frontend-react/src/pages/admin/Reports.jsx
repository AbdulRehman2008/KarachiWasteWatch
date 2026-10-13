import { useEffect, useState } from 'react'
import { getReports, getReport, updateStatus, assignReport } from '../../api/api'
import StatusBadge from '../../components/StatusBadge'
import { toast } from 'react-toastify'
import { 
  ReportIcon, 
  SearchIcon, 
  UserIcon, 
  TruckIcon, 
  ClockIcon, 
  CheckCircleIcon 
} from '../../components/Icons'

const STATUSES = ['Pending','Verified','In Progress','Resolved','Rejected']
const DISTRICTS = ['All','District South (Saddar, Clifton, DHA)','District East (Gulshan, Johar, PECHS)','District Central (Nazimabad, North Nazimabad)','District Korangi','District Keamari','District Malir']

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterDistrict, setFilterDistrict] = useState('All')
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [assignTeam, setAssignTeam] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    setLoading(true)
    const res = await getReports()
    setReports(res.data || [])
    setLoading(false)
  }

  const openReport = async (r) => {
    setSelected(r); setNewStatus(r.status); setStatusNote('')
    const res = await getReport(r.id)
    setDetail(res.data)
  }

  const handleStatusUpdate = async () => {
    if (!selected || !newStatus) return
    setUpdating(true)
    try {
      await updateStatus(selected.id, { status: newStatus, notes: statusNote })
      toast.success(`Status updated to ${newStatus}`)
      await fetchReports()
      if (selected) { const res = await getReport(selected.id); setDetail(res.data); setSelected({...selected, status: newStatus}) }
    } catch (err) { toast.error(err.response?.data?.detail || 'Update failed') }
    finally { setUpdating(false) }
  }

  const handleAssign = async () => {
    if (!assignTeam || !selected) return
    setUpdating(true)
    try {
      await assignReport(selected.id, { assigned_team: assignTeam, worker_notes: statusNote })
      toast.success('Team assigned — status set to In Progress')
      await fetchReports()
    } catch { toast.error('Assignment failed') }
    finally { setUpdating(false) }
  }

  const filtered = reports.filter(r => {
    const matchSearch = !search || r.report_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.district?.toLowerCase().includes(search.toLowerCase()) ||
      r.citizen?.citizen_id?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || r.status === filterStatus
    const matchDist = filterDistrict === 'All' || r.district === filterDistrict
    return matchSearch && matchStatus && matchDist
  })

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <ReportIcon size={28} color="var(--indigo)" /> Reports Management
        </h1>
        <p>Review, verify, and manage all citizen waste reports</p>
      </div>

      {/* FILTERS */}
      <div className="search-row">
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', width: '100%', maxWidth: 340}}>
          <input className="form-input" placeholder="Search by Report ID, District, Citizen ID..."
            value={search} onChange={e => setSearch(e.target.value)} style={{paddingLeft: 36}} />
          <div style={{position: 'absolute', left: 12, display: 'flex', pointerEvents: 'none'}}>
            <SearchIcon size={16} color="var(--gray-400)" />
          </div>
        </div>
        <select className="form-input form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{maxWidth:160}}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="form-input form-select" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} style={{maxWidth:260}}>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <span style={{alignSelf:'center',fontSize:'.85rem',color:'var(--gray-400)'}}>{filtered.length} reports</span>
      </div>

      <div className="reports-split-view" style={{display:'grid',gap:24}}>
        {/* LIST */}
        <div style={{maxHeight:'75vh',overflowY:'auto'}}>
          {loading ? <div className="spinner" /> : filtered.map(r => (
            <div key={r.id} className="card" style={{marginBottom:12,cursor:'pointer',border: selected?.id===r.id ? '2px solid var(--teal)' : '2px solid transparent'}}
              onClick={() => openReport(r)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <span className="report-id-pill">{r.report_id}</span>
                  <div style={{fontWeight:700,marginTop:6,fontSize:'.9rem'}}>{r.district}</div>
                  <div style={{marginTop:4}}><span className="id-pill">{r.citizen?.citizen_id || '—'}</span></div>
                  <div style={{fontSize:'.78rem',color:'var(--gray-400)',marginTop:4}}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
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
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
                <div>
                  <span className="report-id-pill">{selected.report_id}</span>
                  <div style={{fontWeight:700,fontSize:'1rem',marginTop:6}}>{selected.district}</div>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {/* Citizen info */}
              {detail?.citizen && (
                <div style={{background:'#f0f9ff',borderRadius:10,padding:14,marginBottom:16}}>
                  <div style={{fontWeight:700,marginBottom:8, display: 'flex', alignItems: 'center', gap: 6}}>
                    <UserIcon size={16} color="var(--indigo)" /> Submitted By
                  </div>
                  <div style={{fontSize:'.88rem'}}>
                    <strong>{detail.citizen.full_name}</strong> — <span className="id-pill">{detail.citizen.citizen_id}</span><br/>
                    {detail.citizen.email}<br/>
                    <span style={{color:'var(--gray-400)'}}>Total complaints: {detail.citizen.complaint_count}</span>
                  </div>
                </div>
              )}

              {/* Status update */}
              <div style={{background:'var(--gray-50)',borderRadius:10,padding:14,marginBottom:16}}>
                <div style={{fontWeight:700,marginBottom:10, display: 'flex', alignItems: 'center', gap: 6}}>
                  <CheckCircleIcon size={16} color="var(--indigo)" /> Update Status
                </div>
                <div style={{display:'flex',gap:10,marginBottom:10,flexWrap:'wrap'}}>
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setNewStatus(s)}
                      className="btn btn-sm" style={{background: newStatus===s ? 'var(--teal)' : 'var(--gray-100)', color: newStatus===s ? '#fff' : 'inherit'}}>
                      {s}
                    </button>
                  ))}
                </div>
                <textarea className="form-input form-textarea" placeholder="Add note (optional)..." style={{minHeight:60}}
                  value={statusNote} onChange={e => setStatusNote(e.target.value)} />
                <button className="btn btn-primary" style={{marginTop:10}} onClick={handleStatusUpdate} disabled={updating}>
                  {updating ? 'Updating...' : 'Apply Status'}
                </button>
              </div>

              {/* Assign team */}
              <div style={{background:'var(--gray-50)',borderRadius:10,padding:14,marginBottom:16}}>
                <div style={{fontWeight:700,marginBottom:10, display: 'flex', alignItems: 'center', gap: 6}}>
                  <TruckIcon size={16} color="var(--indigo)" /> Assign Sanitation Team
                </div>
                <input className="form-input" placeholder="Team name..." value={assignTeam} onChange={e => setAssignTeam(e.target.value)} style={{marginBottom:8}} />
                <button className="btn btn-amber" onClick={handleAssign} disabled={!assignTeam || updating} style={{display: 'inline-flex', gap: 8, alignItems: 'center'}}>
                  <TruckIcon size={16} /> Dispatch Team
                </button>
              </div>

              {/* History */}
              {detail?.history?.length > 0 && (
                <div>
                  <div style={{fontWeight:700,marginBottom:12, display: 'flex', alignItems: 'center', gap: 6}}>
                    <ClockIcon size={16} color="var(--indigo)" /> Audit History
                  </div>
                  <ul className="timeline">
                    {[...detail.history].reverse().map((h,i) => (
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
