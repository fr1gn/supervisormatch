import { Inbox, Info } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import StatusPill from '../components/StatusPill'
import { useApp } from '../context/AppContext'

export default function RequestsPage() {
  const { session, requests, supervisors } = useApp()

  if (session?.role === 'supervisor') {
    return <Navigate to="/app/supervisor" replace />
  }

  const studentRequests = requests
    .filter((request) => request.studentEmail === session?.email)
    .map((request) => ({
      ...request,
      supervisor: supervisors.find((supervisor) => supervisor.id === request.supervisorId),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <section>
      <div className="block-title">
        <h2>My Requests</h2>
        <p>Track your supervisor requests across pending, under review, accepted, and rejected states.</p>
      </div>

      {studentRequests.length === 0 ? (
        <div className="empty-box">
          <Inbox size={48} />
          <h3>No requests yet</h3>
          <p>Search for supervisors and send your first request.</p>
        </div>
      ) : (
        <div className="request-list">
          {studentRequests.map((request) => (
            <article key={request.id} className="request-card">
              <header>
                <div>
                  <h3>{request.supervisor?.name || 'Unknown Supervisor'}</h3>
                  <p>{request.supervisor?.department || 'Unknown Department'}</p>
                </div>
                <StatusPill status={request.status} />
              </header>

              <p className="request-message">{request.message}</p>
              <p className="request-time">Sent on {new Date(request.createdAt).toLocaleString()}</p>

              {request.status === 'accepted' ? (
                <p className="accepted-note">
                  <Info size={14} />
                  Contact available: {request.supervisor?.name} | {request.supervisor?.department}
                </p>
              ) : null}


            </article>
          ))}
        </div>
      )}
    </section>
  )
}
