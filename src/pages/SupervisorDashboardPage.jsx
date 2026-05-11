import { Inbox, Plus, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import StatusPill from '../components/StatusPill'
import { useApp } from '../context/AppContext'

export default function SupervisorDashboardPage() {
  const {
    session,
    getCurrentSupervisor,
    getSupervisorRequests,
    updateRequestStatus,
    addSupervisorTopic,
    removeSupervisorTopic,
  } = useApp()

  const [activeTab, setActiveTab] = useState('requests')
  const [topicDraft, setTopicDraft] = useState({ title: '', area: '', description: '' })
  const [topicNotice, setTopicNotice] = useState('')

  const supervisor = getCurrentSupervisor()

  const requests = useMemo(() => {
    return getSupervisorRequests().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [getSupervisorRequests])

  const pendingCount = requests.filter((item) => item.status === 'pending').length
  const slotsLeft = Math.max(0, (supervisor?.capacity || 8) - (supervisor?.currentStudents || 0))

  const handleTopicCreate = async (event) => {
    event.preventDefault()

    const result = await addSupervisorTopic(topicDraft)

    if (!result.ok) {
      setTopicNotice(result.error)
      return
    }

    setTopicNotice('Topic added successfully.')
    setTopicDraft({ title: '', area: '', description: '' })
  }

  const handleStatusUpdate = async (requestId, status) => {
    await updateRequestStatus(requestId, status)
  }

  return (
    <section className="supervisor-page">
      <article className="supervisor-hero">
        <header>
          <img src={supervisor?.avatar} alt={supervisor?.name || 'Supervisor'} />
          <div>
            <h2>{supervisor?.name || session?.fullName || 'Supervisor'}</h2>
            <p>
              {supervisor?.title || 'Supervisor'} · {supervisor?.department || session?.department || 'Department'}
            </p>
            <div className="tag-wrap compact">
              {(supervisor?.areas || []).map((area) => (
                <span key={area} className="topic-tag">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="supervisor-stats">
          <div>
            <span>Slots</span>
            <strong>
              {slotsLeft}/{supervisor?.capacity || 8}
            </strong>
          </div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
          <div>
            <span>Topics</span>
            <strong>{supervisor?.topics?.length || 0}</strong>
          </div>
        </div>
      </article>

      <div className="inner-tabs">
        <button type="button" className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
          Requests
        </button>
        <button type="button" className={activeTab === 'topics' ? 'active' : ''} onClick={() => setActiveTab('topics')}>
          Topics
        </button>
      </div>

      {activeTab === 'requests' ? (
        requests.length === 0 ? (
          <div className="empty-box">
            <Inbox size={48} />
            <h3>No requests yet</h3>
            <p>Requests from students will appear here.</p>
          </div>
        ) : (
          <div className="request-list">
            {requests.map((request) => (
              <article key={request.id} className="request-card">
                <header>
                  <div>
                    <h3>{request.studentName || request.studentEmail}</h3>
                    <p>{request.studentEmail}</p>
                  </div>
                  <StatusPill status={request.status} />
                </header>

                <p className="request-message">{request.message}</p>
                <p className="request-time">Received on {new Date(request.createdAt).toLocaleString()}</p>

                <div className="request-actions">
                  <button type="button" onClick={() => handleStatusUpdate(request.id, 'under review')}>
                    Under Review
                  </button>
                  <button type="button" onClick={() => handleStatusUpdate(request.id, 'accepted')}>
                    Accept
                  </button>
                  <button
                    type="button"
                    className="ghost remove-btn inline-flex items-center"
                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        <section className="topics-section">
          <div className="topics-head">
            <div>
              <h3>Research Topics</h3>
              <p>Manage your available thesis and diploma topics.</p>
            </div>
          </div>

          <form className="topic-form" onSubmit={handleTopicCreate}>
            <label htmlFor="topicTitle">Topic Title</label>
            <input
              id="topicTitle"
              value={topicDraft.title}
              onChange={(event) => setTopicDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="e.g., Neural Networks for Image Recognition"
              required
            />

            <label htmlFor="topicArea">Main Area</label>
            <input
              id="topicArea"
              value={topicDraft.area}
              onChange={(event) => setTopicDraft((prev) => ({ ...prev, area: event.target.value }))}
              placeholder="e.g., Machine Learning"
              required
            />

            <label htmlFor="topicDescription">Description</label>
            <textarea
              id="topicDescription"
              rows={3}
              value={topicDraft.description}
              onChange={(event) => setTopicDraft((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Briefly describe this topic for students"
              required
            />

            <button type="submit" className="btn-primary add-topic-btn">
              <Plus size={16} />
              Add Topic
            </button>

            {topicNotice ? <p className="inline-note">{topicNotice}</p> : null}
          </form>

          <div className="topic-grid">
            {(supervisor?.topics || []).map((topic) => (
              <article key={topic.id} className="topic-card">
                <h4>{topic.title}</h4>
                <span className="topic-tag">{topic.area}</span>
                <p>{topic.description}</p>
                <button
                  type="button"
                  className="ghost remove-btn inline-flex items-center"
                  onClick={() => removeSupervisorTopic(topic.id)}
                >
                  Remove Topic
                </button>
              </article>
            ))}

            {!supervisor?.topics?.length ? (
              <div className="empty-inline">
                <UserRound size={22} />
                <span>No topics yet. Add your first one.</span>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </section>
  )
}
