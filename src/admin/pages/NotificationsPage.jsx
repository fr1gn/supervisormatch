import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  FileText,
  Check,
  CheckCheck,
} from 'lucide-react';
import { notifications as mockNotifications } from '../data/mockData';
import { timeAgo } from '../utils/helpers';
import { Card } from '../components/ui';

const typeConfig = {
  application: { icon: FileText, color: 'var(--admin-info)', bg: 'var(--admin-info-subtle)' },
  success: { icon: CheckCircle2, color: 'var(--admin-success)', bg: 'var(--admin-success-subtle)' },
  warning: { icon: AlertTriangle, color: 'var(--admin-warning)', bg: 'var(--admin-warning-subtle)' },
  error: { icon: XCircle, color: 'var(--admin-danger)', bg: 'var(--admin-danger-subtle)' },
  info: { icon: Info, color: 'var(--admin-accent)', bg: 'var(--admin-accent-subtle)' },
};

function NotificationItem({ notification, index, onMarkRead }) {
  const config = typeConfig[notification.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        display: 'flex',
        gap: 14,
        padding: '16px 20px',
        borderBottom: '1px solid var(--admin-border-subtle)',
        background: notification.read ? 'transparent' : 'var(--admin-bg-hover)',
        transition: 'background var(--admin-transition-fast)',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (notification.read) e.currentTarget.style.background = 'var(--admin-bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (notification.read) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--admin-accent)',
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--admin-radius-lg)',
          background: config.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: config.color,
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <h4
            style={{
              fontSize: 'var(--admin-text-sm)',
              fontWeight: notification.read ? 500 : 700,
              color: 'var(--admin-text-primary)',
              margin: 0,
            }}
          >
            {notification.title}
          </h4>
          <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-quaternary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {timeAgo(notification.timestamp)}
          </span>
        </div>
        <p style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)', margin: '4px 0 0', lineHeight: 1.5 }}>
          {notification.message}
        </p>
      </div>

      {/* Mark as read */}
      {!notification.read && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            borderRadius: 'var(--admin-radius-md)',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--admin-text-tertiary)',
            flexShrink: 0,
            alignSelf: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-bg-active)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          title="Mark as read"
        >
          <Check size={16} />
        </motion.button>
      )}
    </motion.div>
  );
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(mockNotifications);

  const unreadCount = notifs.filter(n => !n.read).length;
  const unread = notifs.filter(n => !n.read);
  const read = notifs.filter(n => n.read);

  const markRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)' }}>
            {unreadCount} unread
          </span>
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={markAllRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--admin-radius-md)',
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-bg-primary)',
              color: 'var(--admin-text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--admin-text-sm)',
              fontWeight: 600,
            }}
          >
            <CheckCheck size={16} /> Mark all as read
          </motion.button>
        )}
      </div>

      {/* Notifications */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {unread.length > 0 && (
          <>
            <div
              style={{
                padding: '12px 20px',
                background: 'var(--admin-bg-secondary)',
                fontSize: 'var(--admin-text-xs)',
                fontWeight: 600,
                color: 'var(--admin-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              New
            </div>
            {unread.map((notif, i) => (
              <NotificationItem key={notif.id} notification={notif} index={i} onMarkRead={markRead} />
            ))}
          </>
        )}

        {read.length > 0 && (
          <>
            <div
              style={{
                padding: '12px 20px',
                background: 'var(--admin-bg-secondary)',
                fontSize: 'var(--admin-text-xs)',
                fontWeight: 600,
                color: 'var(--admin-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Earlier
            </div>
            {read.map((notif, i) => (
              <NotificationItem key={notif.id} notification={notif} index={i} onMarkRead={markRead} />
            ))}
          </>
        )}
      </Card>
    </div>
  );
}
