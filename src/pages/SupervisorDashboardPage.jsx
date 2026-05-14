import { Inbox, Plus, Trash2, Users, Clock, BookOpen, Eye, Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../components/ConfirmDialog'
import { getInitials, slotsLeft } from '../lib/utils'
import { staggerContainer, staggerItem } from '../lib/animations'

export default function SupervisorDashboardPage() {
  const {
    session,
    getCurrentSupervisor,
    getSupervisorRequests,
    updateRequestStatus,
    addSupervisorTopic,
    removeSupervisorTopic,
  } = useApp()

  const toast = useToast()
  const confirm = useConfirm()
  const [activeTab, setActiveTab] = useState('requests')
  const [topicDraft, setTopicDraft] = useState({ title: '', area: '', description: '' })
  const [topicSaving, setTopicSaving] = useState(false)

  const supervisor = getCurrentSupervisor()

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

  const handleStatusUpdate = async (requestId, status, studentName) => {
    const isAccept = status === 'accepted'
    const ok = await confirm({
      title: isAccept ? 'Accept Student' : 'Reject Student',
      message: isAccept
        ? `Accept ${studentName || 'this student'}? They will be assigned to you.`
        : `Reject ${studentName || 'this student'}? They will be notified.`,
      confirmLabel: isAccept ? 'Accept' : 'Reject',
      variant: isAccept ? 'info' : 'danger',
    })
    if (!ok) return

    const result = await updateRequestStatus(requestId, status)
    if (result?.ok !== false) {
      toast.success(isAccept ? 'Student accepted!' : 'Request rejected.')
    } else {
      toast.error(result.error || 'Failed to update status.')
    }
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
                          <div className="avatar avatar-sm">
                            {getInitials(request.studentName || request.studentEmail)}
                          </div>
                          <div>
                            <h3
                              className="heading-subtitle"
                              style={{ fontSize: '0.9375rem', marginBottom: 2 }}
                            >
                              {request.studentName || request.studentEmail}
                            </h3>
                            <p className="text-caption" style={{ fontSize: '0.75rem' }}>
                              {request.studentEmail}
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
                            marginBottom: 12,
                            borderLeft: '3px solid var(--accent)',
                            lineHeight: 1.55,
                          }}
                        >
                          {request.message}
                        </p>
                      )}

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
                        {request.status !== 'accepted' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusUpdate(request.id, 'accepted', request.studentName)}
                          >
                            <Check size={14} strokeWidth={2.5} />
                            Accept
                          </button>
                        )}
                        {request.status !== 'rejected' && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStatusUpdate(request.id, 'rejected', request.studentName)}
                          >
                            <X size={14} strokeWidth={2.5} />
                            Reject
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
              <h3 className="heading-subtitle" style={{ fontSize: '1rem', marginBottom: 4 }}>
                Add Research Topic
              </h3>
              <p className="text-caption" style={{ marginBottom: 20 }}>
                Create topics so students know what areas you supervise.
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
                    style={{ padding: 20 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <h4 className="heading-subtitle" style={{ fontSize: '0.9375rem' }}>
                        {topic.title}
                      </h4>
                      <span className="badge badge-accent" style={{ fontSize: '0.6875rem', flexShrink: 0 }}>
                        {topic.area}
                      </span>
                    </div>
                    <p className="text-body" style={{ fontSize: '0.8125rem', marginBottom: 14 }}>
                      {topic.description}
                    </p>
                    <button
                      type="button"
                      className="btn btn-danger btn-xs"
                      onClick={() => handleTopicRemove(topic.id, topic.title)}
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
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
