import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getInitials, stringToColor } from '../utils/helpers';

/* ── Stat Card ─────────────────────────── */
export function StatCard({ label, value, change, period, icon: Icon, color = 'accent', index = 0 }) {
  const colorMap = {
    accent: { bg: 'var(--admin-accent-subtle)', fg: 'var(--admin-accent)' },
    success: { bg: 'var(--admin-success-subtle)', fg: 'var(--admin-success)' },
    warning: { bg: 'var(--admin-warning-subtle)', fg: 'var(--admin-warning)' },
    danger: { bg: 'var(--admin-danger-subtle)', fg: 'var(--admin-danger)' },
    info: { bg: 'var(--admin-info-subtle)', fg: 'var(--admin-info)' },
  };
  const c = colorMap[color] || colorMap.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      style={{
        background: 'var(--admin-bg-primary)',
        borderRadius: 'var(--admin-radius-lg)',
        border: '1px solid var(--admin-border)',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        boxShadow: 'var(--admin-shadow-xs)',
        transition: 'box-shadow var(--admin-transition-base), border-color var(--admin-transition-base)',
        cursor: 'default',
      }}
      whileHover={{ boxShadow: 'var(--admin-shadow-md)' }}
    >
      <div>
        <p style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)', margin: '0 0 4px', fontWeight: 500 }}>
          {label}
        </p>
        <p style={{ fontSize: 'var(--admin-text-3xl)', fontWeight: 800, color: 'var(--admin-text-primary)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {value}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 'var(--admin-text-xs)',
              fontWeight: 600,
              color: typeof change === 'number' && change >= 0 ? 'var(--admin-success)' : 'var(--admin-danger)',
            }}
          >
            {typeof change === 'number' && change >= 0 ? '+' : ''}{change}%
          </span>
          <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-quaternary)' }}>
            {period}
          </span>
        </div>
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--admin-radius-lg)',
          background: c.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: c.fg,
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={22} />}
      </div>
    </motion.div>
  );
}

/* ── Status Badge ──────────────────────── */
export function StatusBadge({ status, size = 'md' }) {
  const styles = {
    active: { bg: 'var(--admin-success-subtle)', color: 'var(--admin-success)', label: 'Active' },
    available: { bg: 'var(--admin-success-subtle)', color: 'var(--admin-success)', label: 'Available' },
    pending: { bg: 'var(--admin-warning-subtle)', color: 'var(--admin-warning)', label: 'Pending' },
    'under-review': { bg: 'var(--admin-info-subtle)', color: 'var(--admin-info)', label: 'Under Review' },
    approved: { bg: 'var(--admin-success-subtle)', color: 'var(--admin-success)', label: 'Approved' },
    rejected: { bg: 'var(--admin-danger-subtle)', color: 'var(--admin-danger)', label: 'Rejected' },
    inactive: { bg: 'var(--admin-bg-secondary)', color: 'var(--admin-text-tertiary)', label: 'Inactive' },
    full: { bg: 'var(--admin-danger-subtle)', color: 'var(--admin-danger)', label: 'Full' },
    'on-leave': { bg: 'var(--admin-warning-subtle)', color: 'var(--admin-warning)', label: 'On Leave' },
  };
  const s = styles[status] || styles.pending;
  const sizeMap = {
    sm: { padding: '2px 8px', fontSize: 'var(--admin-text-xs)' },
    md: { padding: '4px 10px', fontSize: 'var(--admin-text-xs)' },
    lg: { padding: '6px 14px', fontSize: 'var(--admin-text-sm)' },
  };
  const sz = sizeMap[size] || sizeMap.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: s.bg,
        color: s.color,
        borderRadius: 'var(--admin-radius-full)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...sz,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
}

/* ── Avatar ────────────────────────────── */
export function Avatar({ name, size = 36, src }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--admin-radius-full)',
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--admin-radius-full)',
        background: stringToColor(name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.35,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

/* ── Card ──────────────────────────────── */
export function Card({ children, style, padding = '24px', hover = false, onClick, ...props }) {
  const Comp = hover ? motion.div : 'div';
  return (
    <Comp
      onClick={onClick}
      style={{
        background: 'var(--admin-bg-primary)',
        borderRadius: 'var(--admin-radius-lg)',
        border: '1px solid var(--admin-border)',
        padding,
        boxShadow: 'var(--admin-shadow-xs)',
        ...style,
      }}
      {...(hover ? {
        whileHover: { boxShadow: 'var(--admin-shadow-md)', borderColor: 'var(--admin-border-strong)' },
        transition: { duration: 0.2 },
      } : {})}
      {...props}
    >
      {children}
    </Comp>
  );
}

/* ── Empty State ───────────────────────── */
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div
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
            width: 56,
            height: 56,
            borderRadius: 'var(--admin-radius-xl)',
            background: 'var(--admin-bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--admin-text-quaternary)',
            marginBottom: 16,
          }}
        >
          <Icon size={24} />
        </div>
      )}
      <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 600, color: 'var(--admin-text-primary)', margin: '0 0 4px' }}>
        {title}
      </h3>
      <p style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)', margin: 0, maxWidth: 320 }}>
        {description}
      </p>
    </div>
  );
}

/* ── Modal ─────────────────────────────── */
export function Modal({ isOpen, onClose, title, children, width = 560 }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--admin-bg-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 24,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--admin-bg-primary)',
              borderRadius: 'var(--admin-radius-xl)',
              border: '1px solid var(--admin-border)',
              boxShadow: 'var(--admin-shadow-xl)',
              width: '100%',
              maxWidth: width,
              maxHeight: '85vh',
              overflow: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid var(--admin-border)',
                position: 'sticky',
                top: 0,
                background: 'var(--admin-bg-primary)',
                borderRadius: 'var(--admin-radius-xl) var(--admin-radius-xl) 0 0',
                zIndex: 1,
              }}
            >
              <h2 style={{ fontSize: 'var(--admin-text-lg)', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
                {title}
              </h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--admin-radius-md)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--admin-text-tertiary)',
                  transition: 'background var(--admin-transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <X size={18} />
              </motion.button>
            </div>
            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Skeleton ──────────────────────────── */
export function Skeleton({ width = '100%', height = 16, borderRadius = 'var(--admin-radius-sm)', style }) {
  return (
    <div
      className="admin-skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

/* ── Search Input ──────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div
      style={{
        position: 'relative',
        maxWidth: 320,
        width: '100%',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 38,
          borderRadius: 'var(--admin-radius-md)',
          border: '1px solid var(--admin-border)',
          background: 'var(--admin-bg-secondary)',
          padding: '0 12px',
          fontSize: 'var(--admin-text-sm)',
          color: 'var(--admin-text-primary)',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color var(--admin-transition-fast), box-shadow var(--admin-transition-fast)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--admin-accent)';
          e.target.style.boxShadow = '0 0 0 3px var(--admin-accent-subtle)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--admin-border)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

/* ── Pagination ────────────────────────── */
export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const btnStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    height: 34,
    borderRadius: 'var(--admin-radius-md)',
    border: active ? 'none' : '1px solid var(--admin-border)',
    background: active ? 'var(--admin-accent)' : 'var(--admin-bg-primary)',
    color: active ? '#fff' : 'var(--admin-text-secondary)',
    fontSize: 'var(--admin-text-sm)',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all var(--admin-transition-fast)',
    padding: '0 8px',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={{ ...btnStyle(false), opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
      >
        Prev
      </button>
      {pages.map(page => (
        <button key={page} onClick={() => onPageChange(page)} style={btnStyle(page === currentPage)}>
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={{ ...btnStyle(false), opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
      >
        Next
      </button>
    </div>
  );
}

/* ── Filter Select ─────────────────────── */
export function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        height: 38,
        borderRadius: 'var(--admin-radius-md)',
        border: '1px solid var(--admin-border)',
        background: 'var(--admin-bg-secondary)',
        padding: '0 12px',
        fontSize: 'var(--admin-text-sm)',
        color: 'var(--admin-text-primary)',
        fontFamily: 'inherit',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        paddingRight: 28,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      <option value="">{label}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
