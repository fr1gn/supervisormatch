import { Inbox, Plus, Trash2, Users, Clock, BookOpen, Eye, Check, X, Mail, Phone, GraduationCap, FileText, Download, Sparkles, Tag, Archive, ArchiveRestore } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../components/ConfirmDialog'
import { getInitials, slotsLeft } from '../lib/utils'
import { staggerContainer, staggerItem } from '../lib/animations'

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');

function ApplicationStrengthInline({ score, label }) {
  if (!score && score !== 0) return null
  const color = score >= 90 ? 'var(--success)' : score >= 70 ? 'var(--accent)' : 'var(--warning)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      background: `${color}10`,
      border: `1px solid ${color}25`,
    }}>
      <Sparkles size={16} style={{ color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color }}>{score}%</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color, opacity: 0.85 }}>{label}</span>
        </div>
        <div style={{
          height: 4,
          borderRadius: 'var(--radius-full)',
          background: `${color}20`,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${score}%`,
            height: '100%',
            borderRadius: 'var(--radius-full)',
            background: color,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
    </div>
  )
}

function ResumeDownloadButton({ requestId }) {
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/requests/${requestId}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (!response.ok) {
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    }
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-xs"
      onClick={handleDownload}
      style={{ gap: 5 }}
    >
      <Download size={12} />
      Download Resume
    </button>
  )
}

function StudentProfileModal({ student, onClose }) {
  if (!student) return null

  return createPortal(
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
            maxWidth: 500,
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: 28,
            position: 'relative',
          }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'sticky',
              float: 'right',
              top: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>

          {/* Avatar + Name + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            {student.studentAvatar ? (
              <img
                src={student.studentAvatar}
                alt={student.studentName}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  border: '3px solid var(--surface)',
                  boxShadow: 'var(--shadow-md)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div style={{
                width: 68,
                height: 68,
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-gradient)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.375rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {getInitials(student.studentName || student.studentEmail)}
              </div>
            )}
            <div>
              <h2 className="heading-subtitle" style={{ fontSize: '1.125rem', marginBottom: 6 }}>
                {student.studentName || 'Student'}
              </h2>
              <StatusBadge status={student.status} />
            </div>
          </div>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Basic info section */}
            <p className="text-caption" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-tertiary)' }}>
              Contacts
            </p>

            <InfoRow icon={Mail} label="Email" value={student.studentEmail} />
            <InfoRow icon={Phone} label="Phone number" value={student.studentPhone} />

            <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
            <p className="text-caption" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-tertiary)' }}>
              Study
            </p>

            <InfoRow icon={GraduationCap} label="Department" value={student.studentDepartment} />
            <InfoRow icon={Users} label="Group" value={student.studentGroup} />
            <InfoRow icon={BookOpen} label="Study level" value={student.studentStudyLevel} />

            {student.studentInterests && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <p className="text-caption" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-tertiary)' }}>
                  Interests
                </p>
                <p className="text-body" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {student.studentInterests}
                </p>
              </>
            )}

            {student.studentBio && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <p className="text-caption" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-tertiary)' }}>
                  About me
                </p>
                <p className="text-body" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {student.studentBio}
                </p>
              </>
            )}

            {student.researchInterests && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <p className="text-caption" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-tertiary)' }}>
                  Research Interests
                </p>
                <p className="text-body" style={{
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  borderLeft: '3px solid var(--accent)',
                }}>
                  {student.researchInterests}
                </p>
              </>
            )}

            {student.message && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <p className="text-caption" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-tertiary)' }}>
                  Motivation Message
                </p>
                <p className="text-body" style={{
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  borderLeft: '3px solid var(--accent)',
                }}>
                  {student.message}
                </p>
              </>
            )}

            {/* Application Strength */}
            {student.applicationScore > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <p className="text-caption" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-tertiary)' }}>
                  Application Strength
                </p>
                <ApplicationStrengthInline score={student.applicationScore} label={student.applicationLabel} />
              </>
            )}

            {/* Resume Download */}
            {student.resumePath && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
                <p className="text-caption" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-tertiary)' }}>
                  Resume / CV
                </p>
                <ResumeDownloadButton requestId={student.id} />
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{
        width: 32, height: 32,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={15} />
      </div>
      <div>
        <p className="text-caption" style={{ fontSize: '0.7rem', marginBottom: 1 }}>{label}</p>
        <p className="text-body" style={{ fontSize: '0.875rem' }}>{value}</p>
      </div>
    </div>
  )
}

// цвет бейджа статуса темы
function topicStatusColor(status) {
  if (status === 'Assigned') return 'var(--accent)'
  if (status === 'Completed') return 'var(--success)'
  return 'var(--warning)' // Available
}

function TopicStatusBadge({ status, archived }) {
  if (archived) {
    return <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>Archived</span>
  }
  const color = topicStatusColor(status)
  return (
    <span style={{
      fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)',
      background: `${color}18`, color, border: `1px solid ${color}33`,
    }}>
      {status || 'Available'}
    </span>
  )
}

// Модалка назначения темы при принятии заявки (или для уже принятой без темы).
// Супервайзер выбирает существующую доступную тему ИЛИ создаёт новую и сразу назначает.
function AssignTopicModal({ open, request, availableTopics, onClose, onConfirm }) {
  const [mode, setMode] = useState('existing') // 'existing' | 'new'
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState({ title: '', area: '', description: '' })
  const [saving, setSaving] = useState(false)

  // сбрасываем форму при каждом открытии
  useEffect(() => {
    if (open) {
      const firstAvailable = availableTopics[0]?.id || ''
      setMode(availableTopics.length > 0 ? 'existing' : 'new')
      setSelectedId(firstAvailable)
      setDraft({ title: '', area: '', description: '' })
      setSaving(false)
    }
  }, [open, availableTopics])

  if (!open) return null

  const submit = async () => {
    setSaving(true)
    let payload
    if (mode === 'existing') {
      if (!selectedId) { setSaving(false); return }
      payload = { topicId: selectedId }
    } else {
      if (!draft.title.trim() || !draft.area.trim() || !draft.description.trim()) { setSaving(false); return }
      payload = { newTopic: { title: draft.title.trim(), area: draft.area.trim(), description: draft.description.trim() } }
    }
    await onConfirm(payload)
    setSaving(false)
  }

  const studentLabel = request?.applicationType === 'team'
    ? (request?.team?.name || 'this team')
    : (request?.studentName || 'this student')

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="topic-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        <motion.div
          key="topic-modal"
          initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="card"
          style={{ width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', padding: 26 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h2 className="heading-subtitle" style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={18} style={{ color: 'var(--accent)' }} /> Assign a Topic
            </h2>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
              <X size={18} />
            </button>
          </div>
          <p className="text-caption" style={{ marginBottom: 18 }}>
            Every project must be linked to a topic. Choose one for <strong>{studentLabel}</strong>.
          </p>

          {/* mode switch */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('existing')}
              disabled={availableTopics.length === 0}
              style={{ flex: 1, opacity: availableTopics.length === 0 ? 0.5 : 1 }}
            >
              Existing Topic
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('new')}
              style={{ flex: 1 }}
            >
              <Plus size={14} /> New Topic
            </button>
          </div>

          {mode === 'existing' ? (
            availableTopics.length === 0 ? (
              <p className="text-caption" style={{ padding: '12px 0' }}>
                No available topics. Create a new one to continue.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginBottom: 4 }}>
                {availableTopics.map((t) => (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)', border: `1px solid ${selectedId === t.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: selectedId === t.id ? 'var(--accent-soft)' : 'var(--surface)',
                    }}
                  >
                    <input
                      type="radio" name="topic-choice" checked={selectedId === t.id}
                      onChange={() => setSelectedId(t.id)} style={{ marginTop: 3 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.title}</span>
                        <span className="badge badge-accent" style={{ fontSize: '0.625rem' }}>{t.area}</span>
                      </div>
                      <p className="text-caption" style={{ fontSize: '0.75rem' }}>{t.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="label">Topic Title</label>
                <input className="input" value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Graph Neural Networks for Fraud Detection" />
              </div>
              <div>
                <label className="label">Main Area</label>
                <input className="input" value={draft.area}
                  onChange={(e) => setDraft((p) => ({ ...p, area: e.target.value }))}
                  placeholder="e.g., Machine Learning" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={draft.description}
                  onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Briefly describe this topic" />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} style={{ flex: 1 }} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={submit} style={{ flex: 1 }} disabled={saving}>
              <Check size={14} /> {saving ? 'Assigning...' : 'Accept & Assign'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default function SupervisorDashboardPage() {
  const {
    session,
    getCurrentSupervisor,
    getSupervisorRequests,
    updateRequestStatus,
    addSupervisorTopic,
    removeSupervisorTopic,
    archiveTopic,
    assignTopic,
  } = useApp()

  const toast = useToast()
  const confirm = useConfirm()
  const [activeTab, setActiveTab] = useState('requests')
  const [topicDraft, setTopicDraft] = useState({ title: '', area: '', description: '' })
  const [topicSaving, setTopicSaving] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [topicModalRequest, setTopicModalRequest] = useState(null) // заявка, для которой назначаем тему

  const supervisor = getCurrentSupervisor()

  // только доступные (не архивные, не назначенные/завершённые) темы — для назначения
  const availableTopics = useMemo(
    () => (supervisor?.topics || []).filter((t) => !t.archived && (t.status || 'Available') === 'Available'),
    [supervisor],
  )
  const activeTopicCount = useMemo(
    () => (supervisor?.topics || []).filter((t) => !t.archived && t.status !== 'Completed').length,
    [supervisor],
  )

  const requests = useMemo(() => {
    return getSupervisorRequests().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [getSupervisorRequests])

  const pendingCount = requests.filter((item) => item.status === 'pending').length
  const reviewCount = requests.filter((item) => item.status === 'under review').length
  const acceptedCount = requests.filter((item) => item.status === 'accepted').length
  const slots = slotsLeft(supervisor)

  const handleTopicCreate = async (event) => {
    event.preventDefault()
    setTopicSaving(true)
    const result = await addSupervisorTopic(topicDraft)

    if (!result.ok) {
      toast.error(result.error || 'Failed to add topic.')
      setTopicSaving(false)
      return
    }

    toast.success('Topic added successfully!')
    setTopicDraft({ title: '', area: '', description: '' })
    setTopicSaving(false)
  }

  const handleTopicRemove = async (topicId, topicTitle) => {
    const ok = await confirm({
      title: 'Remove Topic',
      message: `Are you sure you want to remove "${topicTitle}"? This cannot be undone.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    })
    if (!ok) return
    await removeSupervisorTopic(topicId)
    toast.success('Topic removed.')
  }

  // принятие теперь проходит через назначение темы — открываем модалку
  const handleAccept = (request) => {
    setTopicModalRequest(request)
  }

  // подтверждение из модалки: принимаем заявку (если ещё не принята), затем назначаем тему
  const handleAssignConfirm = async (payload) => {
    const request = topicModalRequest
    if (!request) return

    // если заявка ещё не принята — принимаем её (создаётся проект)
    if (request.status !== 'accepted') {
      const acceptRes = await updateRequestStatus(request.id, 'accepted')
      if (acceptRes?.ok === false) {
        toast.error(acceptRes.error || 'Failed to accept request.')
        return
      }
    }

    // назначаем тему созданному проекту (существующую или новую)
    const res = await assignTopic({ requestId: request.id, ...payload })
    if (res?.ok === false) {
      toast.error(res.error || 'Failed to assign topic.')
      return
    }

    toast.success('Accepted and topic assigned!')
    setTopicModalRequest(null)
  }

  const handleReject = async (requestId, studentName) => {
    const ok = await confirm({
      title: 'Reject Student',
      message: `Reject ${studentName || 'this student'}? They will be notified.`,
      confirmLabel: 'Reject',
      variant: 'danger',
    })
    if (!ok) return

    const result = await updateRequestStatus(requestId, 'rejected')
    if (result?.ok !== false) {
      toast.success('Request rejected.')
    } else {
      toast.error(result.error || 'Failed to update status.')
    }
  }

  const handleArchiveToggle = async (topic) => {
    const res = await archiveTopic(topic.id, !topic.archived)
    if (res?.ok === false) {
      toast.error(res.error || 'Failed to update topic.')
      return
    }
    toast.success(topic.archived ? 'Topic restored.' : 'Topic archived.')
  }

  const handleReview = async (requestId) => {
    await updateRequestStatus(requestId, 'under review')
    toast.info('Marked as under review.')
  }

  const tabs = [
    { id: 'requests', label: 'Requests', count: requests.length },
    { id: 'topics', label: 'Topics', count: supervisor?.topics?.length || 0 },
  ]

  return (
    <section>
      <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      <AssignTopicModal
        open={!!topicModalRequest}
        request={topicModalRequest}
        availableTopics={availableTopics}
        onClose={() => setTopicModalRequest(null)}
        onConfirm={handleAssignConfirm}
      />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          {supervisor?.avatar ? (
            <img
              src={supervisor.avatar}
              alt={supervisor.name}
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                border: '3px solid var(--surface)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
          ) : (
            <div className="avatar avatar-xl">{getInitials(supervisor?.name || session?.fullName)}</div>
          )}
          <div>
            <h1 className="heading-display" style={{ fontSize: '1.75rem', marginBottom: 2 }}>
              {supervisor?.name || session?.fullName || 'Supervisor'}
            </h1>
            <p className="text-body" style={{ fontSize: '0.875rem' }}>
              {supervisor?.title || 'Supervisor'} · {supervisor?.department || session?.department || 'Department'}
            </p>
          </div>
        </div>

        {supervisor?.areas?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {supervisor.areas.map((area) => (
              <span key={area} className="badge badge-accent">
                {area}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
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
          { icon: Users, label: 'Available Slots', value: `${slots}/${supervisor?.capacity || 8}`, color: slots > 0 ? 'var(--success)' : 'var(--danger)' },
          { icon: Clock, label: 'Pending', value: pendingCount, color: 'var(--warning)' },
          { icon: BookOpen, label: 'Under Review', value: reviewCount, color: 'var(--accent)' },
          { icon: Users, label: 'Accepted', value: acceptedCount, color: 'var(--success)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="card"
            style={{ padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: `${color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: color,
                }}
              >
                <Icon size={16} />
              </div>
            </div>
            <p className="text-caption" style={{ marginBottom: 2, fontSize: '0.75rem' }}>{label}</p>
            <p className="heading-title" style={{ fontSize: '1.375rem', color }}>{value}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginBottom: 24,
          maxWidth: 360,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all var(--transition-fast)',
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.label}
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 'var(--radius-full)',
                background: activeTab === tab.id ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                color: activeTab === tab.id ? 'var(--accent-text)' : 'var(--text-tertiary)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Requests Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'requests' ? (
          <motion.div
            key="requests"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
          >
            {requests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No requests yet"
                description="Requests from students will appear here once they find your profile."
              />
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                style={{ display: 'grid', gap: 12 }}
              >
                {requests.map((request) => (
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
                          marginBottom: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(request)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left',
                            }}
                            title="View student profile"
                          >
                            {request.studentAvatar ? (
                              <img
                                src={request.studentAvatar}
                                alt={request.studentName}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 'var(--radius-full)',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div className="avatar avatar-sm">
                                {getInitials(request.studentName || request.studentEmail)}
                              </div>
                            )}
                            <div>
                              <h3
                                className="heading-subtitle"
                                style={{
                                  fontSize: '0.9375rem',
                                  marginBottom: 2,
                                  color: 'var(--accent)',
                                  textDecoration: 'underline',
                                  textDecorationStyle: 'dotted',
                                  textUnderlineOffset: 3,
                                }}
                              >
                                {request.studentName || request.studentEmail}
                              </h3>
                              <p className="text-caption" style={{ fontSize: '0.75rem' }}>
                                {request.studentEmail}
                              </p>
                            </div>
                          </button>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>

                      {/* Application Type + team composition / open-to-team */}
                      {(() => {
                        const isTeam = request.applicationType === 'team'
                        const members = request.team?.members || []
                        return (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isTeam ? 8 : 0 }}>
                              <span
                                className={`badge ${isTeam ? 'badge-accent' : 'badge-neutral'}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem' }}
                              >
                                <Users size={11} strokeWidth={2.2} />
                                {isTeam ? 'Team Application' : 'Individual Application'}
                              </span>
                            </div>

                            {isTeam && (
                              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent)' }}>
                                {request.team?.name && (
                                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: members.length ? 6 : 0 }}>
                                    {request.team.name}
                                  </p>
                                )}
                                <div style={{ display: 'grid', gap: 4 }}>
                                  {members.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                                      <span className="text-caption" style={{ fontSize: '0.72rem' }}>
                                        {m.department}{m.group ? ` · ${m.group}` : ''}
                                      </span>
                                      {m.role === 'leader' && (
                                        <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>Leader</span>
                                      )}
                                      {m.status === 'pending' && (
                                        <span className="text-caption" style={{ fontSize: '0.66rem', fontStyle: 'italic' }}>(invited)</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Research Interests */}
                      {request.researchInterests && (
                        <div style={{ marginBottom: 10 }}>
                          <p className="text-caption" style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                            color: 'var(--text-tertiary)',
                          }}>
                            Research Interests
                          </p>
                          <p
                            className="text-body"
                            style={{
                              fontSize: '0.8125rem',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-secondary)',
                              borderLeft: '3px solid var(--accent)',
                              lineHeight: 1.55,
                            }}
                          >
                            {request.researchInterests}
                          </p>
                        </div>
                      )}

                      {request.message && (
                        <p
                          className="text-body"
                          style={{
                            fontSize: '0.8125rem',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-secondary)',
                            marginBottom: 12,
                            borderLeft: '3px solid var(--accent)',
                            lineHeight: 1.55,
                          }}
                        >
                          {request.message}
                        </p>
                      )}

                      {/* Application Strength + Resume row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {request.applicationScore > 0 && (
                          <ApplicationStrengthInline score={request.applicationScore} label={request.applicationLabel} />
                        )}
                        {request.resumePath && (
                          <ResumeDownloadButton requestId={request.id} />
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                        <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-caption" style={{ fontSize: '0.75rem' }}>
                          Received {new Date(request.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* назначенная тема для принятой заявки */}
                      {request.status === 'accepted' && request.project?.topicTitle && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--accent-soft)', border: '1px solid var(--accent)',
                        }}>
                          <Tag size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          <span className="text-caption" style={{ fontSize: '0.72rem' }}>Topic:</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {request.project.topicTitle}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {request.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReview(request.id)}
                          >
                            <Eye size={14} strokeWidth={2} />
                            Review
                          </button>
                        )}
                        {(request.status === 'pending' || request.status === 'under review') && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAccept(request)}
                          >
                            <Check size={14} strokeWidth={2.5} />
                            Accept & Assign Topic
                          </button>
                        )}
                        {(request.status === 'pending' || request.status === 'under review') && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReject(request.id, request.studentName)}
                          >
                            <X size={14} strokeWidth={2.5} />
                            Reject
                          </button>
                        )}
                        {/* принятая заявка без темы — даём назначить тему */}
                        {request.status === 'accepted' && !request.project?.topicId && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAccept(request)}
                          >
                            <Tag size={14} strokeWidth={2.2} />
                            Assign Topic
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="topics"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Add Topic Form */}
            <div
              className="card"
              style={{ padding: 24, marginBottom: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h3 className="heading-subtitle" style={{ fontSize: '1rem', marginBottom: 4 }}>
                  Add Research Topic
                </h3>
                {(() => {
                  const cap = supervisor?.capacity || 8
                  const full = activeTopicCount >= cap
                  return (
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)',
                      background: full ? 'var(--danger)15' : 'var(--success)15',
                      color: full ? 'var(--danger)' : 'var(--success)',
                    }}>
                      {activeTopicCount}/{cap} active topics
                    </span>
                  )
                })()}
              </div>
              <p className="text-caption" style={{ marginBottom: 20 }}>
                Create topics so students know what you supervise. Active topics are limited to your capacity ({supervisor?.capacity || 8}).
              </p>

              <form
                onSubmit={handleTopicCreate}
                style={{ display: 'grid', gap: 14 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <label className="label" htmlFor="topicTitle">Topic Title</label>
                    <input
                      className="input"
                      id="topicTitle"
                      value={topicDraft.title}
                      onChange={(e) => setTopicDraft((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Neural Networks for Image Recognition"
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="topicArea">Main Area</label>
                    <input
                      className="input"
                      id="topicArea"
                      value={topicDraft.area}
                      onChange={(e) => setTopicDraft((prev) => ({ ...prev, area: e.target.value }))}
                      placeholder="e.g., Machine Learning"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="topicDescription">Description</label>
                  <textarea
                    className="input"
                    id="topicDescription"
                    rows={3}
                    value={topicDraft.description}
                    onChange={(e) => setTopicDraft((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Briefly describe this topic for students"
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={topicSaving}>
                    <Plus size={16} />
                    {topicSaving ? 'Adding...' : 'Add Topic'}
                  </button>
                </div>
              </form>
            </div>

            {/* Topics Grid */}
            {(supervisor?.topics || []).length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No topics yet"
                description="Add your first research topic so students can discover your areas of interest."
              />
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 12,
                }}
              >
                {supervisor.topics.map((topic) => (
                  <motion.article
                    key={topic.id}
                    variants={staggerItem}
                    className="card card-interactive"
                    style={{ padding: 20, opacity: topic.archived ? 0.6 : 1 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <h4 className="heading-subtitle" style={{ fontSize: '0.9375rem' }}>
                        {topic.title}
                      </h4>
                      <span className="badge badge-accent" style={{ fontSize: '0.6875rem', flexShrink: 0 }}>
                        {topic.area}
                      </span>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <TopicStatusBadge status={topic.status} archived={topic.archived} />
                    </div>
                    <p className="text-body" style={{ fontSize: '0.8125rem', marginBottom: 14 }}>
                      {topic.description}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleArchiveToggle(topic)}
                      >
                        {topic.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                        {topic.archived ? 'Restore' : 'Archive'}
                      </button>
                      {/* назначенную тему удалять нельзя — целостность данных */}
                      {topic.status !== 'Assigned' && (
                        <button
                          type="button"
                          className="btn btn-danger btn-xs"
                          onClick={() => handleTopicRemove(topic.id, topic.title)}
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      )}
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
