import { useEffect, useState } from 'react'
import { getUsers, deleteUser } from '../../api/api'
import { toast } from 'react-toastify'
import { UsersIcon, SearchIcon, TrashIcon } from '../../components/Icons'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    getUsers().then(r => setUsers(r.data || [])).finally(() => setLoading(false))
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete citizen "${name}"? This cannot be undone.`)) return
    try {
      await deleteUser(id)
      toast.success(`Citizen ${name} deleted`)
      setUsers(users.filter(u => u.id !== id))
    } catch { toast.error('Delete failed') }
  }

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.citizen_id?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <UsersIcon size={28} color="var(--indigo)" /> User Management
        </h1>
        <p>{users.length} registered citizen(s)</p>
      </div>

      <div className="search-row">
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', width: '100%', maxWidth: 360}}>
          <input className="form-input" placeholder="Search by name, Citizen ID, or email..."
            value={search} onChange={e => setSearch(e.target.value)} style={{paddingLeft: 36}} />
          <div style={{position: 'absolute', left: 12, display: 'flex', pointerEvents: 'none'}}>
            <SearchIcon size={16} color="var(--gray-400)" />
          </div>
        </div>
        <span style={{alignSelf:'center',fontSize:'.85rem',color:'var(--gray-400)'}}>{filtered.length} results</span>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Citizen ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Complaints</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td><span className="id-pill">{u.citizen_id}</span></td>
                  <td><strong>{u.full_name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><span className="badge badge-pending">{u.complaint_count}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.full_name)} style={{display: 'inline-flex', gap: 6, alignItems: 'center'}}>
                      <TrashIcon size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
