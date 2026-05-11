import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
      }}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            marginBottom: 24,
          }}
        >
          <Icon size={32} strokeWidth={1.5} />
        </motion.div>
      )}

      <h3
        className="heading-subtitle"
        style={{ fontSize: '1.125rem', marginBottom: 8 }}
      >
        {title}
      </h3>

      <p
        className="text-body"
        style={{ maxWidth: 360, margin: '0 auto', fontSize: '0.875rem' }}
      >
        {description}
      </p>

      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: 24 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}
