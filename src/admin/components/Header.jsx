import { Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { SidebarTrigger } from './Sidebar';
import { getInitials, stringToColor } from '../utils/helpers';

export default function Header({ isMobile, onMenuClick, title, subtitle }) {
  const adminName = 'Alex Morgan';
  const unreadCount = 3;

  return (
    <header
      style={{
        height: 'var(--admin-header-height)',
        background: 'var(--admin-bg-primary)',
        borderBottom: '1px solid var(--admin-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {isMobile && <SidebarTrigger onClick={onMenuClick} />}
        <div>
          <h1
            style={{
              fontSize: 'var(--admin-text-lg)',
              fontWeight: 700,
              color: 'var(--admin-text-primary)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 'var(--admin-text-sm)',
                color: 'var(--admin-text-tertiary)',
                margin: 0,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search trigger */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 'var(--admin-radius-md)',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--admin-text-tertiary)',
            transition: 'background var(--admin-transition-fast), color var(--admin-transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--admin-bg-hover)';
            e.currentTarget.style.color = 'var(--admin-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--admin-text-tertiary)';
          }}
        >
          <Search size={18} />
        </motion.button>

        {/* Notifications */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 'var(--admin-radius-md)',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--admin-text-tertiary)',
            position: 'relative',
            transition: 'background var(--admin-transition-fast), color var(--admin-transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--admin-bg-hover)';
            e.currentTarget.style.color = 'var(--admin-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--admin-text-tertiary)';
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--admin-danger)',
                border: '2px solid var(--admin-bg-primary)',
              }}
            />
          )}
        </motion.button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 24,
            background: 'var(--admin-border)',
            margin: '0 4px',
          }}
        />

        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--admin-radius-full)',
              background: stringToColor(adminName),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 'var(--admin-text-xs)',
              fontWeight: 700,
            }}
          >
            {getInitials(adminName)}
          </div>
          {!isMobile && (
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 'var(--admin-text-sm)', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                {adminName}
              </div>
              <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)' }}>
                Administrator
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
