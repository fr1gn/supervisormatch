import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Users, User, Send, ChevronDown, ChevronUp, CheckCircle, FileText, Upload, X, Sparkles, Search, Plus, ArrowRight, ArrowLeft } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import { getInitials, slotsLeft } from '../lib/utils'

function ApplicationScorePreview({ researchInterests, message, resumeFile }) {
  let score = 0
  if (researchInterests.trim().length > 0) score += 50
  if (message.trim().length > 0) score += 20
  if (resumeFile) score += 30

  // 0 → Incomplete, 1 → Basic, 2 → Good, 3 → Strong
  const stage = score >= 90 ? 3 : score >= 70 ? 2 : score > 0 ? 1 : 0
  const label = ['Incomplete', 'Basic', 'Good', 'Strong'][stage]
  const color = stage === 3 ? 'var(--success)' : stage === 2 ? 'var(--accent)' : stage === 1 ? 'var(--warning)' : 'var(--text-tertiary)'

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        border: `1.5px solid color-mix(in srgb, ${color} 22%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'background var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      <div style={{
        width: 40, height: 40,
        borderRadius: 'var(--radius-full)',
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Sparkles size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Application Strength
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color, marginLeft: 'auto' }}>
            {label}{score > 0 ? ` · ${score}%` : ''}
          </span>
        </div>
        {/* 3-segment indicator */}
        <div style={{ display: 'flex', gap: 5 }}>
          {[1, 2, 3].map((seg) => {
            const filled = stage >= seg
            return (
              <div
                key={seg}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 'var(--radius-full)',
                  background: filled ? `color-mix(in srgb, ${color} 22%, transparent)` : 'var(--border)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ scaleX: filled ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    height: '100%',
                    transformOrigin: 'left',
                    borderRadius: 'var(--radius-full)',
                    background: color,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RequestFormModal({ supervisor, onClose, onSubmit }) {
  const toast = useToast()
  const { fetchStudents, createTeam } = useApp()
  const [step, setStep] = useState(1)
  const [researchInterests, setResearchInterests] = useState('')
  const [message, setMessage] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errors, setErrors] = useState({})

  // ===== Шаг 1: тип заявки =====
  const [applicationType, setApplicationType] = useState('individual') // 'individual' | 'team'
  const [teamName, setTeamName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([]) // [{ id, fullName, department, groupName }]
  const [memberQuery, setMemberQuery] = useState('')
  const [studentResults, setStudentResults] = useState([])
  const [step1Errors, setStep1Errors] = useState({})

  // подгружаем студентов для выбора участников (только в командном режиме)
  useEffect(() => {
    if (applicationType !== 'team') return
    let active = true
    const t = setTimeout(async () => {
      const list = await fetchStudents({ keyword: memberQuery.trim() })
      if (active) setStudentResults(list)
    }, 250)
    return () => { active = false; clearTimeout(t) }
  }, [applicationType, memberQuery, fetchStudents])

  const toggleMember = (student) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === student.id)
        ? prev.filter((m) => m.id !== student.id)
        : [...prev, student]
    )
    if (step1Errors.members) setStep1Errors((prev) => ({ ...prev, members: '' }))
  }

  const validateStep1 = () => {
    if (applicationType !== 'team') return true
    const e = {}
    if (!teamName.trim()) e.teamName = 'Team name is required.'
    if (selectedMembers.length === 0) e.members = 'Select at least one team member.'
    setStep1Errors(e)
    return Object.keys(e).length === 0
  }

  const goToStep2 = () => {
    if (!validateStep1()) return
    setStep(2)
  }

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
    if (applicationType === 'team' && !validateStep1()) {
      setStep(1)
      return
    }

    setIsSending(true)

    const formData = new FormData()
    formData.append('supervisorId', supervisor.id)
    formData.append('researchInterests', researchInterests.trim())
    formData.append('message', message.trim())
    if (resumeFile) {
      formData.append('resume', resumeFile)
    }

    formData.append('applicationType', applicationType)

    if (applicationType === 'team') {
      // сначала создаём команду (участники получат приглашения), затем прикрепляем teamId к заявке
      const teamRes = await createTeam({
        name: teamName.trim(),
        memberUserIds: selectedMembers.map((m) => m.id),
      })
      if (!teamRes.ok || !teamRes.data?.id) {
        toast.error(teamRes.error || 'Failed to create the team.')
        setIsSending(false)
        return
      }
      formData.append('teamId', teamRes.data.id)
    }

    const result = await onSubmit(formData)

    if (!result.ok) {
      toast.error(result.error || 'Failed to send request.')
      setIsSending(false)
      return
    }

    toast.success(
      applicationType === 'team'
        ? `Team application sent to ${supervisor.name}!`
        : `Request sent to ${supervisor.name}!`
    )
    onClose()
  }

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
            maxWidth: 760,
            maxHeight: '92vh',
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
              padding: 'clamp(20px, 3vw, 26px) clamp(20px, 4vw, 32px)',
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

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22, padding: 'clamp(20px, 4vw, 32px)' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                    background: step >= s ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: step >= s ? '#fff' : 'var(--text-tertiary)',
                  }}>{s}</div>
                  <span className="text-caption" style={{ fontSize: '0.75rem', fontWeight: step === s ? 700 : 500, color: step === s ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {s === 1 ? 'Application Type' : 'Details'}
                  </span>
                  {s === 1 && <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
                </div>
              ))}
            </div>

            {/* ===== STEP 1: Application Type ===== */}
            {step === 1 && (
              <>
                <div style={{ display: 'grid', gap: 10 }}>
                  <label className="label">Application Type</label>
                  {[
                    { value: 'individual', icon: User, title: 'Individual Application', desc: 'Apply on your own.' },
                    { value: 'team', icon: Users, title: 'Team Application', desc: 'Apply on behalf of a team.' },
                  ].map((opt) => {
                    const active = applicationType === opt.value
                    const Icon = opt.icon
                    return (
                      <label
                        key={opt.value}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                          padding: '14px 16px', borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                          background: active ? 'color-mix(in srgb, var(--accent) 7%, transparent)' : 'var(--surface)',
                          transition: 'border-color var(--transition-fast), background var(--transition-fast)',
                        }}
                      >
                        <input
                          type="radio"
                          name="applicationType"
                          value={opt.value}
                          checked={active}
                          onChange={() => setApplicationType(opt.value)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: active ? 'var(--accent)' : 'var(--bg-secondary)',
                        }}>
                          <Icon size={18} style={{ color: active ? '#fff' : 'var(--text-tertiary)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{opt.title}</div>
                          <div className="text-caption" style={{ fontSize: '0.75rem' }}>{opt.desc}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>



                {/* Team → name + member picker */}
                {applicationType === 'team' && (
                  <>
                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      This application is submitted on behalf of the entire team. Selected members will receive an invitation to join.
                    </div>

                    <div>
                      <label className="label" htmlFor="teamName">
                        Team Name <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        className="input"
                        id="teamName"
                        value={teamName}
                        style={step1Errors.teamName ? { borderColor: 'var(--danger)' } : undefined}
                        onChange={(e) => {
                          setTeamName(e.target.value)
                          if (step1Errors.teamName) setStep1Errors((prev) => ({ ...prev, teamName: '' }))
                        }}
                        placeholder="e.g. Neural Navigators"
                      />
                      {step1Errors.teamName && (
                        <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4, fontWeight: 500 }}>{step1Errors.teamName}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">
                        Team Members <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>

                      {/* selected chips */}
                      {selectedMembers.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {selectedMembers.map((m) => (
                            <span key={m.id} className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                              {m.fullName}
                              <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleMember(m)} />
                            </span>
                          ))}
                        </div>
                      )}

                      {/* search */}
                      <div style={{ position: 'relative', marginBottom: 8 }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                          className="input"
                          value={memberQuery}
                          onChange={(e) => setMemberQuery(e.target.value)}
                          placeholder="Search registered students by name or department..."
                          style={{ paddingLeft: 34 }}
                        />
                      </div>

                      {/* results */}
                      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        {studentResults.length === 0 ? (
                          <div className="text-caption" style={{ padding: '14px 16px', fontSize: '0.8125rem' }}>No students found.</div>
                        ) : (
                          studentResults.map((s) => {
                            const picked = selectedMembers.some((m) => m.id === s.id)
                            return (
                              <button
                                type="button"
                                key={s.id}
                                onClick={() => toggleMember(s)}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                                  padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--border)',
                                  background: picked ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                                  cursor: 'pointer',
                                }}
                              >
                                <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}>
                                  {getInitials(s.fullName)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.fullName}</div>
                                  <div className="text-caption" style={{ fontSize: '0.72rem' }}>
                                    {s.department}{s.groupName ? ` · ${s.groupName}` : ''}
                                  </div>
                                </div>
                                {picked ? (
                                  <CheckCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                ) : (
                                  <Plus size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                )}
                              </button>
                            )
                          })
                        )}
                      </div>
                      {step1Errors.members && (
                        <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4, fontWeight: 500 }}>{step1Errors.members}</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ===== STEP 2: Details ===== */}
            {step === 2 && (
            <>
            {/* Research Interests */}
            <div>
              <label className="label" htmlFor="researchInterests">
                Research Interests <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                className="input"
                id="researchInterests"
                rows={5}
                value={researchInterests}
                style={{ minHeight: 132, ...(errors.researchInterests ? { borderColor: 'var(--danger)' } : {}) }}
                onChange={(e) => {
                  setResearchInterests(e.target.value)
                  if (errors.researchInterests) setErrors(prev => ({ ...prev, researchInterests: '' }))
                }}
                placeholder="Describe your research interests relevant to this supervisor..."
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
              {resumeFile ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: '1.5px solid var(--success)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    background: 'var(--success-soft)',
                  }}
                >
                  <div style={{
                    width: 38, height: 38,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={18} style={{ color: 'var(--success)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <CheckCircle size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success-text)' }}>
                        Resume uploaded successfully
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {resumeFile.name}
                      <span className="text-caption" style={{ fontWeight: 400, marginLeft: 8 }}>
                        {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeFile(null)
                      setResumeError('')
                    }}
                    aria-label="Remove resume"
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
                    <X size={16} />
                  </button>
                </motion.div>
              ) : (
                <label
                  className="upload-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: `1.5px dashed ${resumeError ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast), background var(--transition-fast)',
                  }}
                >
                  <div style={{
                    width: 38, height: 38,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-soft, var(--bg-secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Upload size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Click to upload PDF
                    </p>
                    <p className="text-caption" style={{ fontSize: '0.75rem' }}>
                      PDF only · max 5 MB
                    </p>
                  </div>
                  <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none', flexShrink: 0 }}>
                    Browse
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    />
                  </label>
                )}
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
            </>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'space-between',
                paddingTop: 18,
                marginTop: 2,
                borderTop: '1px solid var(--border)',
              }}
            >
              {step === 1 ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSending}>
                  Cancel
                </button>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(1)} disabled={isSending}>
                  <ArrowLeft size={14} strokeWidth={2} />
                  Back
                </button>
              )}

              {step === 1 ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={goToStep2}>
                  Next
                  <ArrowRight size={14} strokeWidth={2} />
                </button>
              ) : (
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSending}>
                  <Send size={14} strokeWidth={2} />
                  {isSending ? 'Sending...' : applicationType === 'team' ? 'Submit Team Application' : 'Submit Request'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
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
