export default function StatusBadge({ status }) {
  const map = {
    'Pending':     'badge-pending',
    'Verified':    'badge-verified',
    'In Progress': 'badge-inprogress',
    'Resolved':    'badge-resolved',
    'Rejected':    'badge-rejected',
    'Duplicate':   'badge-duplicate',
    'Assigned':    'badge-inprogress',
  }
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>
}
