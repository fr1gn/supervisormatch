import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const CONFIG = {
  success: { Icon: CheckCircle, bg: 'var(--success-soft)', color: 'var(--success-text)', border: 'var(--success)' },
  error: { Icon: AlertCircle, bg: 'var(--danger-soft)', color: 'var(--danger-text)', border: 'var(--danger)' },
  info: { Icon: Info, bg: 'var(--info-soft)', color: 'var(--info-text)', border: 'var(--accent)' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      success: (msg) => addToast(msg, 'success'),
      error: (msg) => addToast(msg, 'error'),
      info: (msg) => addToast(msg, 'info'),
    }),
    [addToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 380,
          width: 'calc(100% - 32px)',
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const cfg = CONFIG[t.type] || CONFIG.info
            const Icon = cfg.Icon
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: cfg.bg,
                  color: cfg.color,
                  borderLeft: `3px solid ${cfg.border}`,
                  boxShadow: 'var(--shadow-lg)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                <Icon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{t.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
