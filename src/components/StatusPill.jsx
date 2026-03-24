const classMap = {
  pending: 'pending',
  'under review': 'under-review',
  accepted: 'accepted',
  rejected: 'rejected',
}

export default function StatusPill({ status }) {
  return <span className={`status-pill ${classMap[status]}`}>{status}</span>
}
