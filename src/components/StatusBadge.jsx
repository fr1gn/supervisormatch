import { motion } from 'framer-motion'

const statusConfig = {
  pending: {
    className: 'badge-warning',
    label: 'Pending',
    pulse: true,
  },
  'under review': {
    className: 'badge-info',
    label: 'Under Review',
    pulse: true,
  },
  accepted: {
    className: 'badge-success',
    label: 'Accepted',
    pulse: false,
  },
  rejected: {
    className: 'badge-danger',
    label: 'Rejected',
    pulse: false,
  },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <motion.span
      className={`badge ${config.className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ gap: 6 }}
    >
      <span
        style={{
          position: 'relative',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }}
      >
        {config.pulse && (
          <span
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: '50%',
              background: 'currentColor',
              opacity: 0.4,
              animation: 'statusPulse 2s ease-in-out infinite',
            }}
          />
        )}
      </span>
      {config.label}
      <style>{`
        @keyframes statusPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </motion.span>
  )
}
