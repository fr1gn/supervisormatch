import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info } from 'lucide-react'

const ConfirmContext = createContext(null)

const VARIANT = {
  danger: { icon: AlertTriangle, accent: 'var(--danger)', soft: 'var(--danger-soft)', text: 'var(--danger-text)', btn: 'btn-danger' },
  info: { icon: Info, accent: 'var(--accent)', soft: 'var(--accent-soft)', text: 'var(--accent-text)', btn: 'btn-primary' },
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setState({
          title: options.title || 'Are you sure?',
          message: options.message || '',
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          variant: options.variant || 'danger',
          resolve,
        })
      }),
    [],
  )

  const close = (result) => {
    state?.resolve(result)
    setState(null)
  }

  const v = state ? VARIANT[state.variant] || VARIANT.danger : VARIANT.danger
  const Icon = v.icon

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => close(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 9998,
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 24,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  pointerEvents: 'auto',
                  width: '100%',
                  maxWidth: 400,
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-xl)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '24px 24px 0' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: v.soft,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: v.accent,
                      marginBottom: 16,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3
                    className="heading-subtitle"
                    style={{ fontSize: '1.0625rem', marginBottom: 8 }}
                  >
                    {state.title}
                  </h3>
                  {state.message && (
                    <p className="text-body" style={{ fontSize: '0.875rem' }}>
                      {state.message}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '20px 24px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => close(false)}
                  >
                    {state.cancelLabel}
                  </button>
                  <button
                    type="button"
                    className={`btn ${v.btn} btn-sm`}
                    onClick={() => close(true)}
                  >
                    {state.confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
