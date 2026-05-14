import { Inbox, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { useApp } from '../context/AppContext'
import { getInitials } from '../lib/utils'
import { staggerContainer, staggerItem } from '../lib/animations'



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

  const stats = {
    total: studentRequests.length,
    pending: studentRequests.filter(r => r.status === 'pending').length,
    accepted: studentRequests.filter(r => r.status === 'accepted').length,
    rejected: studentRequests.filter(r => r.status === 'rejected').length,
  }

  return (
    <section>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <h1 className="heading-display" style={{ fontSize: '2rem', marginBottom: 6 }}>
          My Requests
        </h1>
        <p className="text-body" style={{ fontSize: '1rem' }}>
          Track your supervisor requests and application statuses.
        </p>
      </motion.div>

      {/* Stats */}
      {studentRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { label: 'Total', value: stats.total, color: 'var(--text-primary)' },
            { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
            { label: 'Accepted', value: stats.accepted, color: 'var(--success)' },
            { label: 'Rejected', value: stats.rejected, color: 'var(--danger)' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="card"
              style={{ padding: '16px 20px' }}
            >
              <p className="text-caption" style={{ marginBottom: 4, fontSize: '0.75rem' }}>{label}</p>
              <p
                className="heading-title"
                style={{ fontSize: '1.5rem', color }}
              >
                {value}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* List */}
      {studentRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests yet"
          description="Start by searching for supervisors and sending your first request."
          action={
            <Link to="/app/search" className="btn btn-primary btn-sm">
              Find Supervisors
              <ArrowRight size={14} />
            </Link>
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{ display: 'grid', gap: 12 }}
        >
          {studentRequests.map((request) => (
            <motion.article
              key={request.id}
              variants={staggerItem}
              className="card"
              style={{ padding: 0 }}
            >
              <div style={{ padding: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div className="avatar avatar-sm">
                      {getInitials(request.supervisor?.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3
                        className="heading-subtitle"
                        style={{ fontSize: '0.9375rem', marginBottom: 2 }}
                      >
                        {request.supervisor?.name || 'Unknown Supervisor'}
                      </h3>
                      <p className="text-caption" style={{ fontSize: '0.75rem' }}>
                        {request.supervisor?.department || 'Unknown Department'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                {request.message && (
                  <p
                    className="text-body"
                    style={{
                      fontSize: '0.8125rem',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      marginBottom: 14,
                      borderLeft: '3px solid var(--accent)',
                      lineHeight: 1.55,
                    }}
                  >
                    {request.message}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} strokeWidth={2} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-caption" style={{ fontSize: '0.75rem' }}>
                    Sent {new Date(request.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {request.status === 'accepted' && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--success-soft)',
                      color: 'var(--success-text)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                    }}
                  >
                    <CheckCircle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 600 }}>Accepted!</span> You can now contact{' '}
                      <strong>{request.supervisor?.name}</strong> at{' '}
                      <strong>{request.supervisor?.email || request.supervisor?.department}</strong>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </section>
  )
}
