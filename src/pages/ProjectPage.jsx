import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Upload, Download, Trash2, FileText, Image, File,
  Pencil, Check, X, Users, FileSpreadsheet, FileArchive, FolderOpen, AlertTriangle, Tag,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../components/ConfirmDialog'
import { api } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'

// human-readable file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// icon by file type
function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return Image
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return FileSpreadsheet
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('archive')) return FileArchive
  return FileText
}

// icon color by type
function getFileColor(mimeType) {
  if (mimeType?.startsWith('image/')) return '#10b981'
  if (mimeType?.includes('pdf')) return '#ef4444'
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '#22c55e'
  if (mimeType?.includes('word') || mimeType?.includes('document')) return '#3b82f6'
  if (mimeType?.includes('zip') || mimeType?.includes('archive')) return '#f59e0b'
  return '#8b5cf6'
}

export default function ProjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useApp()
  const toast = useToast()
  const confirm = useConfirm()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // editing state
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [descDraft, setDescDraft] = useState('')

  const fileInputRef = useRef(null)

  // fetch project
  const fetchProject = useCallback(async () => {
    const res = await api.get(`/projects/${id}`)
    if (res.ok) {
      setProject(res.data)
    } else {
      toast.error('Failed to load project')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  // save title
  const saveTitle = async () => {
    if (!titleDraft.trim()) { setEditingTitle(false); return }
    const res = await api.patch(`/projects/${id}`, { title: titleDraft.trim() })
    if (res.ok) {
      setProject(p => ({ ...p, title: titleDraft.trim() }))
      toast.success('Title updated')
    }
    setEditingTitle(false)
  }

  // save description
  const saveDesc = async () => {
    const res = await api.patch(`/projects/${id}`, { description: descDraft.trim() })
    if (res.ok) {
      setProject(p => ({ ...p, description: descDraft.trim() }))
      toast.success('Description updated')
    }
    setEditingDesc(false)
  }

  // upload file
  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)

    const res = await api.postFormData(`/projects/${id}/files`, formData)
    if (res.ok) {
      toast.success(`File "${file.name}" uploaded`)
      await fetchProject()
    } else {
      toast.error(res.error || 'Failed to upload file')
    }
    setUploading(false)
  }

  // download file
  const downloadFile = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem('access_token')
      const baseUrl = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '')
      const response = await fetch(`${baseUrl}/projects/${id}/files/${fileId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download file')
    }
  }

  // delete file
  const deleteFile = async (fileId, fileName) => {
    const ok = await confirm({
      title: 'Delete file?',
      message: `"${fileName}" will be permanently deleted`,
      variant: 'danger',
    })
    if (!ok) return

    const res = await api.delete(`/projects/${id}/files/${fileId}`)
    if (res.ok) {
      toast.success('File deleted')
      await fetchProject()
    } else {
      toast.error('Failed to delete file')
    }
  }

  // disband (delete) project
  const disbandProject = async () => {
    const ok = await confirm({
      title: 'Disband Project',
      message: 'Are you sure you want to disband and delete this project? All uploaded files will be permanently deleted, and the supervision request will be cancelled.',
      confirmLabel: 'Disband',
      variant: 'danger',
    })
    if (!ok) return

    const res = await api.delete(`/projects/${id}`)
    if (res.ok) {
      toast.success('Project disbanded successfully')
      navigate('/app/projects')
    } else {
      toast.error(res.error || 'Failed to disband project')
    }
  }

  // drag & drop
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner size={24} style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Project not found
      </div>
    )
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* header row: back + disband */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/app/projects')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0',
          }}
        >
          <ArrowLeft size={18} /> Back to Projects
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={disbandProject}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.45rem 0.85rem',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
        >
          <AlertTriangle size={14} />
          Disband Project
        </motion.button>
      </div>

      {/* project header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
        }}
      >
        {/* assigned topic — central entity, shown prominently at the top */}
        {(() => {
          const topicTitle = project.topic?.title || project.topicTitle
          const topicDesc = project.topic?.description || project.topicDescription
          const topicArea = project.topic?.area
          if (!topicTitle) {
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
                padding: '0.6rem 0.85rem', borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
              }}>
                <Tag size={15} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  No topic assigned yet.
                </span>
              </div>
            )
          }
          return (
            <div style={{
              marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: topicDesc ? '0.4rem' : 0, flexWrap: 'wrap' }}>
                <Tag size={15} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Research Topic
                </span>
                {topicArea && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 600, padding: '1px 8px', borderRadius: '999px',
                    background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)',
                  }}>{topicArea}</span>
                )}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {topicTitle}
              </div>
              {topicDesc && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: 1.5 }}>
                  {topicDesc}
                </p>
              )}
            </div>
          )
        })()}

        {/* title */}
        <div style={{ marginBottom: '0.75rem' }}>
          {editingTitle ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                style={{
                  flex: 1, fontSize: '1.4rem', fontWeight: 700, background: 'var(--bg-tertiary)',
                  border: '1px solid var(--accent)', borderRadius: '8px', padding: '0.4rem 0.75rem',
                  color: 'var(--text-primary)', outline: 'none',
                }}
              />
              <button onClick={saveTitle} style={iconBtnStyle}><Check size={18} /></button>
              <button onClick={() => setEditingTitle(false)} style={iconBtnStyle}><X size={18} /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                onClick={() => { setTitleDraft(project.title); setEditingTitle(true) }}
              >
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {project.title}
                </h1>
                <Pencil size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </div>
              {(() => {
                const completed = project.status === 'completed'
                const color = completed ? '#10b981' : 'var(--accent)'
                return (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '999px',
                    background: `${color}1a`, color, border: `1px solid ${color}40`, textTransform: 'capitalize',
                  }}>
                    {project.status || 'active'}
                  </span>
                )
              })()}
            </div>
          )}
        </div>

        {/* description */}
        <div style={{ marginBottom: '1rem' }}>
          {editingDesc ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <textarea
                autoFocus
                value={descDraft}
                onChange={e => setDescDraft(e.target.value)}
                rows={3}
                style={{
                  flex: 1, fontSize: '0.9rem', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--accent)', borderRadius: '8px', padding: '0.5rem 0.75rem',
                  color: 'var(--text-primary)', outline: 'none', resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button onClick={saveDesc} style={iconBtnStyle}><Check size={18} /></button>
                <button onClick={() => setEditingDesc(false)} style={iconBtnStyle}><X size={18} /></button>
              </div>
            </div>
          ) : (
            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => { setDescDraft(project.description || ''); setEditingDesc(true) }}
            >
              <p style={{
                fontSize: '0.9rem', color: project.description ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                lineHeight: 1.6, fontStyle: project.description ? 'normal' : 'italic',
              }}>
                {project.description || 'Click to add a description...'}
              </p>
              <Pencil size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '0.15rem' }} />
            </div>
          )}
        </div>

        {/* participants */}
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap',
          padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Participants:</span>
          </div>
          {/* students / team members — backend returns the full accepted participant list */}
          {(project.participants && project.participants.length > 0
            ? project.participants
            : [{ userId: project.student?.id, fullName: project.student?.fullName, avatar: project.student?.avatar, role: 'student' }]
          ).map((p) => (
            <div key={p.userId || p.fullName} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden',
                background: 'var(--bg-secondary)',
              }}>
                {p.avatar ? (
                  <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                    {p.fullName?.[0]}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.fullName}</span>
              <span style={{
                fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)',
              }}>{p.role === 'leader' ? 'team leader' : p.role === 'member' ? 'member' : 'student'}</span>
            </div>
          ))}
          {/* supervisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden',
              background: 'var(--bg-secondary)',
            }}>
              {project.supervisor?.avatar ? (
                <img src={project.supervisor.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                  {project.supervisor?.name?.[0]}
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{project.supervisor?.name}</span>
            <span style={{
              fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
            }}>supervisor</span>
          </div>
        </div>
      </motion.div>

      {/* file upload zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 style={{
          fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)',
          marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <FolderOpen size={20} /> Project Files
        </h2>

        {/* drag & drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-color)'}`,
            borderRadius: '14px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); e.target.value = '' }}
          />
          {uploading ? (
            <LoadingSpinner size={20} style={{ color: 'var(--accent)' }} />
          ) : (
            <>
              <Upload size={28} style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Drag & drop a file here or click to browse
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Max 20 MB
              </p>
            </>
          )}
        </div>

        {/* file list */}
        {project.files?.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem', padding: '2rem 0' }}>
            No files yet — upload your first one!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <AnimatePresence>
              {project.files?.map((file, i) => {
                const Icon = getFileIcon(file.mimeType)
                const color = getFileColor(file.mimeType)
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                    }}
                  >
                    {/* file type icon */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={18} style={{ color }} />
                    </div>

                    {/* file info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                        {formatFileSize(file.fileSize)} · {formatDate(file.createdAt)}
                      </div>
                    </div>

                    {/* actions */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        onClick={() => downloadFile(file.id, file.fileName)}
                        title="Download"
                        style={{
                          ...iconBtnStyle,
                          color: 'var(--accent)',
                        }}
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deleteFile(file.id, file.name)}
                        title="Delete"
                        style={{
                          ...iconBtnStyle,
                          color: 'var(--error, #ef4444)',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// small icon button style
const iconBtnStyle = {
  background: 'none',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.4rem',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
}
