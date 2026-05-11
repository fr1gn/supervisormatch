import { useState } from 'react'

function slotsLeft(supervisor) {
  return Math.max(0, supervisor.capacity - supervisor.currentStudents)
}

export default function SupervisorCard({ supervisor, onRequest, hasActiveRequest }) {
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')

  const freeSlots = slotsLeft(supervisor)
  const percentage = Math.round((freeSlots / supervisor.capacity) * 100)

  const handleSubmit = async () => {
    const result = await onRequest({ supervisorId: supervisor.id, message })

    if (!result.ok) {
      setNotice(result.error)
      return
    }

    setNotice('Request sent successfully.')
    setMessage('')
  }

  return (
    <article className="supervisor-card">
      <header>
        <img src={supervisor.avatar} alt={supervisor.name} />
        <div>
          <h3>{supervisor.name}</h3>
          <p>{supervisor.title}</p>
          <p className="meta">{supervisor.department}</p>
        </div>
      </header>

      <p className="bio">{supervisor.bio}</p>

      <div className="availability-row">
        <span>Availability</span>
        <strong>
          {freeSlots}/{supervisor.capacity}
        </strong>
      </div>
      <div className="availability-track" role="presentation">
        <div className="availability-fill" style={{ width: `${percentage}%` }}></div>
      </div>

      <div className="tag-wrap">
        {supervisor.areas.map((topic) => (
          <span key={topic} className="topic-tag">
            {topic}
          </span>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Write a short message to the supervisor..."
        rows={3}
      />

      <button type="button" onClick={handleSubmit} disabled={hasActiveRequest || freeSlots === 0}>
        {hasActiveRequest ? 'Request Already Sent' : freeSlots === 0 ? 'No Slots Available' : 'Send Request'}
      </button>

      {notice ? <p className="inline-note">{notice}</p> : null}
    </article>
  )
}
