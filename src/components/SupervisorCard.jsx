import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Users, Send, ChevronDown, ChevronUp, CheckCircle, FileText, Upload, X, Sparkles } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { getInitials, slotsLeft } from '../lib/utils'

function ApplicationScorePreview({ researchInterests, message, resumeFile }) {
  let score = 0
  if (researchInterests.trim().length > 0) score += 50
  if (message.trim().length > 0) score += 20
  if (resumeFile) score += 30

  const label = score >= 90 ? 'Strong Application' : score >= 70 ? 'Good Application' : 'Basic Application'
  const color = score >= 90 ? 'var(--success)' : score >= 70 ? 'var(--accent)' : 'var(--warning)'

  if (score === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: `${color}12`,
        border: `1.5px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40,
        borderRadius: 'var(--radius-full)',
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Sparkles size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color }}>{score}%</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color, opacity: 0.85 }}>{label}</span>
        </div>
        <div style={{
          height: 5,
          borderRadius: 'var(--radius-full)',
          background: `${color}20`,
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              height: '100%',
              borderRadius: 'var(--radius-full)',
              background: color,
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

function RequestFormModal({ supervisor, onClose, onSubmit }) {
  const toast = useToast()
  const [researchInterests, setResearchInterests] = useState('')
  const [message, setMessage] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errors, setErrors] = useState({})

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setResumeError('')

    if (!file) {
      setResumeFile(null)
      return
    }

    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are allowed.')
      setResumeFile(null)
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File is too large. Maximum size is 5 MB.')
      setResumeFile(null)
      e.target.value = ''
      return
    }

    setResumeFile(file)
  }

  const validate = () => {
    const newErrors = {}
    if (!researchInterests.trim()) {
      newErrors.researchInterests = 'Research interests are required.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSending(true)

    const formData = new FormData()
    formData.append('supervisorId', supervisor.id)
    formData.append('researchInterests', researchInterests.trim())
    formData.append('message', message.trim())
    if (resumeFile) {
      formData.append('resume', resumeFile)
    }

    const result = await onSubmit(formData)

    if (!result.ok) {
      toast.error(result.error || 'Failed to send request.')
      setIsSending(false)
      return
    }

    toast.success(`Request sent to ${supervisor.name}!`)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="card"
          style={{
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 0,
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '24px 28px',
              borderBottom: '1px solid var(--border)',
              position: 'sticky',
              top: 0,
              background: 'var(--surface)',
              zIndex: 1,
              borderTopLeftRadius: 'inherit',
              borderTopRightRadius: 'inherit',
            }}
          >
            {supervisor.avatar ? (
              <img
                src={supervisor.avatar}
                alt={supervisor.name}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div className="avatar" style={{ width: 48, height: 48, fontSize: '0.9375rem' }}>
                {getInitials(supervisor.name)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                className="heading-subtitle"
                style={{
                  fontSize: '1.0625rem',
                  marginBottom: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Apply to {supervisor.name}
              </h2>
              <p className="text-caption" style={{ fontSize: '0.8125rem' }}>
                {supervisor.title} · {supervisor.department}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                padding: 6,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18, padding: 28 }}>
            {/* Research Interests */}
            <div>
              <label className="label" htmlFor="researchInterests">
                Research Interests <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                className="input"
                id="researchInterests"
                rows={3}
                value={researchInterests}
                onChange={(e) => {
                  setResearchInterests(e.target.value)
                  if (errors.researchInterests) setErrors(prev => ({ ...prev, researchInterests: '' }))
                }}
                placeholder="Describe your research interests relevant to this supervisor..."
                style={errors.researchInterests ? { borderColor: 'var(--danger)' } : undefined}
              />
              {errors.researchInterests && (
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4, fontWeight: 500 }}>
                  {errors.researchInterests}
                </p>
              )}
            </div>

            {/* Motivation Message */}
            <div>
              <label className="label" htmlFor="motivationMessage">
                Motivation Message <span className="text-caption">(optional)</span>
              </label>
              <textarea
                className="input"
                id="motivationMessage"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why do you want to work with this supervisor? What motivates you?"
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label className="label">
                Resume / CV <span className="text-caption">(optional, PDF only, max 5 MB)</span>
              </label>
              <div
                style={{
                  border: `1.5px dashed ${resumeError ? 'var(--danger)' : resumeFile ? 'var(--success)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  background: resumeFile ? 'var(--success-soft)' : 'var(--surface)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {resumeFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--success-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {resumeFile.name}
                      </p>
                      <p className="text-caption" style={{ fontSize: '0.6875rem' }}>
                        {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeFile(null)
                        setResumeError('')
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger)',
                        padding: 4,
                        display: 'flex',
                        flexShrink: 0,
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}>
                    <Upload size={22} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Click to upload PDF
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              {resumeError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4, fontWeight: 500 }}>
                  {resumeError}
                </p>
              )}
            </div>

            {/* Application Strength Preview */}
            <ApplicationScorePreview
              researchInterests={researchInterests}
              message={message}
              resumeFile={resumeFile}
            />

            {/* Submit */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                paddingTop: 18,
                marginTop: 2,
                borderTop: '1px solid var(--border)',
              }}
            >
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSending}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSending}>
                <Send size={14} strokeWidth={2} />
                {isSending ? 'Sending...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function SupervisorCard({ supervisor, onRequest, hasActiveRequest }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const freeSlots = slotsLeft(supervisor)
  const percentage = supervisor.capacity > 0 ? Math.round((freeSlots / supervisor.capacity) * 100) : 0
  const isAvailable = freeSlots > 0

  return (
    <>
      {showModal && (
        <RequestFormModal
          supervisor={supervisor}
          onClose={() => setShowModal(false)}
          onSubmit={onRequest}
        />
      )}
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
            <button
              type="button"
              className={`btn ${hasActiveRequest ? 'btn-success' : !isAvailable ? 'btn-secondary' : 'btn-primary'} btn-sm`}
              style={{ width: '100%' }}
              onClick={() => {
                if (!hasActiveRequest && isAvailable) setShowModal(true)
              }}
              disabled={hasActiveRequest || !isAvailable}
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
                  Request Supervisor
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    </>
  )
}
