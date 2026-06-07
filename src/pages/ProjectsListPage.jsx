import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderOpen, FileText, Calendar, User, Tag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ProjectsListPage() {
  const { session } = useApp()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/projects').then(res => {
      if (res.ok) setProjects(res.data)
      setLoading(false)
    })
  }, [])

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner size={24} style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem' }}
      >
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: '0.5rem',
        }}>
          Projects
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {session?.role === 'student'
            ? 'Your research projects with supervisors'
            : 'Projects with your students'}
        </p>
      </motion.div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="A project is created automatically when a supervisor accepts your request"
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem',
        }}>
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/app/projects/${project.id}`)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* icon + title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FolderOpen size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <h3 style={{
                      fontSize: '1rem', fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {project.title}
                    </h3>
                    {(() => {
                      const completed = project.status === 'completed'
                      const color = completed ? '#10b981' : 'var(--accent)'
                      return (
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700, padding: '1px 7px', borderRadius: '999px',
                          background: `${color}1a`, color, textTransform: 'capitalize', flexShrink: 0,
                        }}>{project.status || 'active'}</span>
                      )
                    })()}
                  </div>
                  {/* assigned topic */}
                  {project.topicTitle && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                      <Tag size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span style={{
                        fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{project.topicTitle}</span>
                    </div>
                  )}
                  {project.description && (
                    <p style={{
                      fontSize: '0.85rem', color: 'var(--text-tertiary)',
                      marginTop: '0.25rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              {/* info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                {/* participant */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} />
                  <span>
                    {session?.role === 'student'
                      ? project.supervisor?.name
                      : project.student?.fullName}
                  </span>
                </div>

                {/* files */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={14} />
                  <span>{project.files?.length || 0} file(s)</span>
                </div>

                {/* date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
