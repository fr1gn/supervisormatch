import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Users, Send, MessageSquare, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { getInitials, slotsLeft } from '../lib/utils'

export default function SupervisorCard({ supervisor, onRequest, hasActiveRequest }) {
  const toast = useToast()
  const [message, setMessage] = useState('')
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
      toast.error(result.error || 'Failed to send request.')
      setIsSending(false)
      return
    }

    toast.success(`Request sent to ${supervisor.name}!`)
    setMessage('')
    setIsExpanded(false)
    setIsSending(false)
  }

  return (
    <article
      className="card card-interactive"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {supervisor.avatar ? (
            <img
              src={supervisor.avatar}
              alt={supervisor.name}
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <div className="avatar" style={{ width: 52, height: 52, fontSize: '1rem' }}>
              {getInitials(supervisor.name)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              className="heading-subtitle"
              style={{ fontSize: '1rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {supervisor.name}
            </h3>
            <p className="text-caption" style={{ marginBottom: 4 }}>
              {supervisor.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} strokeWidth={2} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
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
              lineHeight: 1.55,
            }}
          >
            {supervisor.bio}
          </p>
        )}

        {/* Availability */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} strokeWidth={2} style={{ color: 'var(--text-tertiary)' }} />
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
                background: percentage > 50 ? 'var(--accent-gradient)' : percentage > 0 ? 'var(--warning)' : 'var(--danger)',
              }}
            />
          </div>
        </div>

        {/* Topics */}
        {supervisor.areas?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {supervisor.areas.slice(0, 4).map((topic) => (
              <span key={topic} className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
                {topic}
              </span>
            ))}
            {supervisor.areas.length > 4 && (
              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                +{supervisor.areas.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Action Area */}
        <div style={{ marginTop: 'auto', paddingTop: 4 }}>
          {!hasActiveRequest && isAvailable && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ width: '100%', justifyContent: 'center', gap: 6, color: 'var(--accent)', marginBottom: 8 }}
            >
              <MessageSquare size={14} strokeWidth={2} />
              {isExpanded ? 'Hide Message' : 'Add a Message'}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          <AnimatePresence>
            {isExpanded && !hasActiveRequest && isAvailable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginBottom: 8 }}
              >
                <textarea
                  className="input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself and your research interest..."
                  rows={3}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            className={`btn ${hasActiveRequest ? 'btn-success' : !isAvailable ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            style={{ width: '100%' }}
            onClick={handleSubmit}
            disabled={hasActiveRequest || !isAvailable || isSending}
          >
            {hasActiveRequest ? (
              <>
                <CheckCircle size={14} strokeWidth={2} />
                Request Sent
              </>
            ) : !isAvailable ? (
              'No Slots Available'
            ) : (
              <>
                <Send size={14} strokeWidth={2} />
                {isSending ? 'Sending...' : 'Send Request'}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
