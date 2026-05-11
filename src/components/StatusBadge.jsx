import { motion } from 'framer-motion'

const statusConfig = {
  pending: {
    className: 'badge-warning',
    label: 'Pending',
  },
  'under review': {
    className: 'badge-info',
    label: 'Under Review',
  },
  accepted: {
    className: 'badge-success',
    label: 'Accepted',
  },
  rejected: {
    className: 'badge-danger',
    label: 'Rejected',
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
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          opacity: 0.7,
        }}
      />
      {config.label}
    </motion.span>
  )
}
