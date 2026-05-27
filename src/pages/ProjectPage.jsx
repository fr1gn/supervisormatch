import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Upload, Download, Trash2, FileText, Image, File,
  Pencil, Check, X, Users, FileSpreadsheet, FileArchive, FolderOpen,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../components/ConfirmDialog'
import { api } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'

// человекочитаемый размер файла
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' Б'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ'
}

// иконка по типу файла
function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return Image
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return FileSpreadsheet
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('archive')) return FileArchive
  return FileText
}

// цвет иконки по типу
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

  // состояние редактирования
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [descDraft, setDescDraft] = useState('')

  const fileInputRef = useRef(null)

  // загружаем проект
  const fetchProject = useCallback(async () => {
    const res = await api.get(`/projects/${id}`)
    if (res.ok) {
      setProject(res.data)
    } else {
      toast.error('Не удалось загрузить проект')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  // сохраняем название
  const saveTitle = async () => {
    if (!titleDraft.trim()) { setEditingTitle(false); return }
    const res = await api.patch(`/projects/${id}`, { title: titleDraft.trim() })
    if (res.ok) {
      setProject(p => ({ ...p, title: titleDraft.trim() }))
      toast.success('Название обновлено')
    }
    setEditingTitle(false)
  }

  // сохраняем описание
  const saveDesc = async () => {
    const res = await api.patch(`/projects/${id}`, { description: descDraft.trim() })
    if (res.ok) {
      setProject(p => ({ ...p, description: descDraft.trim() }))
      toast.success('Описание обновлено')
    }
    setEditingDesc(false)
  }

  // загрузка файла
  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)

    const res = await api.postFormData(`/projects/${id}/files`, formData)
    if (res.ok) {
      toast.success(`Файл "${file.name}" загружен`)
      await fetchProject()
    } else {
      toast.error(res.error || 'Ошибка загрузки файла')
    }
    setUploading(false)
  }

  // скачивание файла
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
      toast.error('Не удалось скачать файл')
    }
  }

  // удаление файла
  const deleteFile = async (fileId, fileName) => {
    const ok = await confirm({
      title: 'Удалить файл?',
      message: `"${fileName}" будет удалён без возможности восстановления`,
      variant: 'danger',
    })
    if (!ok) return

    const res = await api.delete(`/projects/${id}/files/${fileId}`)
    if (res.ok) {
      toast.success('Файл удалён')
      await fetchProject()
    } else {
      toast.error('Не удалось удалить файл')
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
        Проект не найден
      </div>
    )
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* кнопка назад */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/app/projects')}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0', marginBottom: '1rem',
        }}
      >
        <ArrowLeft size={18} /> Назад к проектам
      </motion.button>

      {/* шапка проекта */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
        }}
      >
        {/* название */}
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
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => { setTitleDraft(project.title); setEditingTitle(true) }}
            >
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {project.title}
              </h1>
              <Pencil size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </div>
          )}
        </div>

        {/* описание */}
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
                {project.description || 'Нажмите, чтобы добавить описание...'}
              </p>
              <Pencil size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '0.15rem' }} />
            </div>
          )}
        </div>

        {/* участники */}
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap',
          padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Участники:</span>
          </div>
          {/* студент */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden',
              background: 'var(--bg-secondary)',
            }}>
              {project.student?.avatar ? (
                <img src={project.student.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                  {project.student?.fullName?.[0]}
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{project.student?.fullName}</span>
            <span style={{
              fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
              background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)',
            }}>студент</span>
          </div>
          {/* супервайзер */}
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
            }}>супервайзер</span>
          </div>
        </div>
      </motion.div>

      {/* зона загрузки файлов */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 style={{
          fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)',
          marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <FolderOpen size={20} /> Файлы проекта
        </h2>

        {/* drag & drop зона */}
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
                Перетащите файл сюда или нажмите для выбора
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Максимум 20 МБ
              </p>
            </>
          )}
        </div>

        {/* список файлов */}
        {project.files?.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem', padding: '2rem 0' }}>
            Пока файлов нет — загрузите первый!
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
                    {/* иконка типа файла */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={18} style={{ color }} />
                    </div>

                    {/* инфо о файле */}
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

                    {/* кнопки */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        onClick={() => downloadFile(file.id, file.fileName)}
                        title="Скачать"
                        style={{
                          ...iconBtnStyle,
                          color: 'var(--accent)',
                        }}
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deleteFile(file.id, file.name)}
                        title="Удалить"
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

// стиль для маленьких иконочных кнопок
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
