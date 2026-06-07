import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, UserPlus, Search, Check, X, Inbox } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { getInitials } from '../lib/utils'
import { staggerContainer, staggerItem } from '../lib/animations'

function SkillBadges({ skills }) {
  if (!skills?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {skills.map((s) => (
        <span key={s} className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>{s}</span>
      ))}
    </div>
  )
}

export default function TeammatesPage() {
  const { session, fetchStudents, fetchInvitations, sendInvitation, respondInvitation } = useApp()
  const toast = useToast()

  const [students, setStudents] = useState([])
  const [invitations, setInvitations] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [invitedIds, setInvitedIds] = useState([])

  const loadStudents = useCallback(async (kw) => {
    const list = await fetchStudents({ openToTeam: true, keyword: kw })
    setStudents(list)
  }, [fetchStudents])

  const loadInvitations = useCallback(async () => {
    const list = await fetchInvitations()
    setInvitations(list)
  }, [fetchInvitations])

  useEffect(() => {
    if (session?.role !== 'student') return
    let active = true
    ;(async () => {
      setLoading(true)
      await Promise.all([loadStudents(''), loadInvitations()])
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [session, loadStudents, loadInvitations])

  // debounce search
  useEffect(() => {
    if (session?.role !== 'student') return
    const t = setTimeout(() => loadStudents(keyword.trim()), 300)
    return () => clearTimeout(t)
  }, [keyword, session, loadStudents])

  if (session?.role === 'supervisor') {
    return <Navigate to="/app/supervisor" replace />
  }

  const handleInvite = async (student) => {
    const res = await sendInvitation({ toUserId: student.id })
    if (!res.ok) {
      toast.error(res.error || 'Failed to send invitation.')
      return
    }
    setInvitedIds((prev) => [...prev, student.id])
    toast.success(`Invitation sent to ${student.fullName}.`)
  }

  const handleRespond = async (invitationId, action) => {
    const res = await respondInvitation(invitationId, action)
    if (!res.ok) {
      toast.error(res.error || 'Failed to respond to invitation.')
      return
    }
    toast.success(action === 'accept' ? 'You joined the team!' : 'Invitation declined.')
    await loadInvitations()
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
          Find Teammates
        </h1>
        <p className="text-body" style={{ fontSize: '1rem' }}>
          Discover students who are open to joining a team, and manage your team invitations.
        </p>
      </motion.div>

      {/* My Invitations */}
      {invitations.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 className="heading-subtitle" style={{ fontSize: '1.0625rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Inbox size={17} style={{ color: 'var(--accent)' }} />
            My Invitations
            <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>{invitations.length}</span>
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {invitations.map((inv) => (
              <div key={inv.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {inv.teamName}
                    </p>
                    <p className="text-caption" style={{ fontSize: '0.78rem', marginBottom: 8 }}>
                      Invited by {inv.fromName}{inv.fromDepartment ? ` · ${inv.fromDepartment}` : ''}
                    </p>
                    {inv.members?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {inv.members.map((m, i) => (
                          <span key={i} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                            {m.name}{m.role === 'leader' ? ' (leader)' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleRespond(inv.id, 'accept')}>
                      <Check size={14} strokeWidth={2} /> Accept
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRespond(inv.id, 'decline')}>
                      <X size={14} strokeWidth={2} /> Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 420 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          className="input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by name or department..."
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Open-to-team students */}
      {loading ? (
        <p className="text-caption">Loading...</p>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students looking for teammates yet"
          description="Students who mark themselves as open to joining a team will appear here."
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {students.map((s) => {
            const invited = invitedIds.includes(s.id)
            return (
              <motion.div key={s.id} variants={staggerItem} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {s.avatar ? (
                    <img src={s.avatar} alt={s.fullName} style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div className="avatar" style={{ width: 44, height: 44, fontSize: '0.875rem' }}>{getInitials(s.fullName)}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.fullName}</p>
                    <p className="text-caption" style={{ fontSize: '0.75rem' }}>{s.department}{s.groupName ? ` · ${s.groupName}` : ''}</p>
                  </div>
                </div>

                {s.interests && (
                  <div>
                    <p className="text-caption" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>Research Interests</p>
                    <p className="text-body" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>{s.interests}</p>
                  </div>
                )}

                {s.skills?.length > 0 && (
                  <div>
                    <p className="text-caption" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Skills</p>
                    <SkillBadges skills={s.skills} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
                  {s.preferredTeamSize ? (
                    <span className="text-caption" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={13} /> Prefers team of {s.preferredTeamSize}
                    </span>
                  ) : <span />}
                  <button
                    className={`btn ${invited ? 'btn-success' : 'btn-primary'} btn-sm`}
                    onClick={() => !invited && handleInvite(s)}
                    disabled={invited}
                  >
                    {invited ? (<><Check size={14} strokeWidth={2} /> Invited</>) : (<><UserPlus size={14} strokeWidth={2} /> Invite</>)}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </section>
  )
}
