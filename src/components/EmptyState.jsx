import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      {Icon && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            marginBottom: 20,
          }}
        >
          <Icon size={28} />
        </div>
      )}

      <h3
        className="heading-subtitle"
        style={{ fontSize: '1.125rem', marginBottom: 8 }}
      >
        {title}
      </h3>

      <p
        className="text-body"
        style={{ maxWidth: 320, margin: '0 auto' }}
      >
        {description}
      </p>

      {action && (
        <div style={{ marginTop: 20 }}>
          {action}
        </div>
      )}
    </motion.div>
  )
}
