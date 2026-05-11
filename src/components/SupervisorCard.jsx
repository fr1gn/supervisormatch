import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Users, Send, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

function getInitials(name) {
  return name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'
}

function slotsLeft(supervisor) {
  return Math.max(0, supervisor.capacity - supervisor.currentStudents)
}

export default function SupervisorCard({ supervisor, onRequest, hasActiveRequest }) {
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const freeSlots = slotsLeft(supervisor)
  const percentage = supervisor.capacity > 0 ? Math.round((freeSlots / supervisor.capacity) * 100) : 0
  const isAvailable = freeSlots > 0

  const handleSubmit = async () => {
    if (isSending) return
    setIsSending(true)
    const result = await onRequest({ supervisorId: supervisor.id, message })

    if (!result.ok) {
      setNotice(result.error)
      setIsSending(false)
      return
    }

    setNotice('Request sent successfully!')
    setMessage('')
    setIsSending(false)
  }

  return (
    <motion.article
      className="card card-interactive"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {supervisor.avatar ? (
            <img
              src={supervisor.avatar}
              alt={supervisor.name}
              className="avatar-lg"
              style={{ borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar avatar-lg">{getInitials(supervisor.name)}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              className="heading-subtitle"
              style={{ fontSize: '1rem', marginBottom: 2 }}
            >
              {supervisor.name}
            </h3>
            <p className="text-caption" style={{ marginBottom: 4 }}>
              {supervisor.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <span className="text-caption" style={{ fontSize: '0.75rem' }}>
                {supervisor.department}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {supervisor.bio && (
          <p
            className="text-body"
            style={{
              fontSize: '0.8125rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {supervisor.bio}
          </p>
        )}

        {/* Availability */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-caption">Availability</span>
            </div>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: isAvailable ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {freeSlots}/{supervisor.capacity} slots
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-secondary)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: isAvailable ? 'var(--accent-gradient)' : 'var(--danger)',
              }}
            />
          </div>
        </div>

        {/* Topics */}
        {supervisor.areas?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {supervisor.areas.map((topic) => (
              <span key={topic} className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Expand/Collapse for request form */}
        <div style={{ marginTop: 'auto' }}>
          {!hasActiveRequest && isAvailable && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ width: '100%', justifyContent: 'center', gap: 6, color: 'var(--accent)' }}
            >
              <MessageSquare size={14} />
              {isExpanded ? 'Hide Message' : 'Write a Message'}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {isExpanded && !hasActiveRequest && isAvailable && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ marginTop: 10 }}
            >
              <textarea
                className="input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a short message to the supervisor..."
                rows={3}
                style={{ marginBottom: 10 }}
              />
            </motion.div>
          )}

          <button
            type="button"
            className={`btn ${hasActiveRequest ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            style={{ width: '100%', marginTop: 8 }}
            onClick={handleSubmit}
            disabled={hasActiveRequest || !isAvailable || isSending}
          >
            {hasActiveRequest ? (
              'Request Already Sent'
            ) : !isAvailable ? (
              'No Slots Available'
            ) : (
              <>
                <Send size={14} />
                {isSending ? 'Sending...' : 'Send Request'}
              </>
            )}
          </button>

          {notice && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-caption"
              style={{ marginTop: 8, textAlign: 'center', color: notice.includes('success') ? 'var(--success)' : 'var(--danger)' }}
            >
              {notice}
            </motion.p>
          )}
        </div>
      </div>
    </motion.article>
  )
}
