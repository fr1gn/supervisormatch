import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileText,
  Building2,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminTheme } from '../hooks/useAdminTheme';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Students', icon: GraduationCap, path: '/admin/students' },
  { label: 'Supervisors', icon: Users, path: '/admin/supervisors' },
  { label: 'Applications', icon: FileText, path: '/admin/applications' },
  { label: 'Departments', icon: Building2, path: '/admin/departments' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Notifications', icon: Bell, path: '/admin/notifications' },
];

function NavItem({ item, collapsed, onClick }) {
  const location = useLocation();
  const isActive = item.path === '/admin'
    ? location.pathname === '/admin'
    : location.pathname.startsWith(item.path);

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      style={{ textDecoration: 'none' }}
    >
      <motion.div
        whileHover={{ x: collapsed ? 0 : 4 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: collapsed ? '10px 0' : '10px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 'var(--admin-radius-md)',
          cursor: 'pointer',
          position: 'relative',
          color: isActive ? 'var(--admin-accent)' : 'var(--admin-text-secondary)',
          background: isActive ? 'var(--admin-accent-subtle)' : 'transparent',
          fontWeight: isActive ? 600 : 500,
          fontSize: 'var(--admin-text-base)',
          transition: 'background var(--admin-transition-fast), color var(--admin-transition-fast)',
          margin: '0 0 2px',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--admin-bg-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
        {!collapsed && (
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
        )}
        {isActive && (
          <motion.div
            layoutId="admin-nav-indicator"
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: 20,
              borderRadius: 'var(--admin-radius-full)',
              background: 'var(--admin-accent)',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </motion.div>
    </NavLink>
  );
}

export default function Sidebar({ isOpen, isMobile, isCollapsed, toggle, close }) {
  const { theme, toggleTheme } = useAdminTheme();
  const sidebarWidth = isCollapsed ? 'var(--admin-sidebar-collapsed)' : 'var(--admin-sidebar-width)';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--admin-bg-overlay)',
              zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !isOpen ? -280 : 0,
          width: isMobile ? 280 : sidebarWidth,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        style={{
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          background: 'var(--admin-bg-primary)',
          borderRight: '1px solid var(--admin-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 'var(--admin-header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0' : '0 16px',
            borderBottom: '1px solid var(--admin-border)',
            flexShrink: 0,
          }}
        >
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--admin-radius-md)',
                  background: 'linear-gradient(135deg, var(--admin-accent), hsl(280, 72%, 56%))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 'var(--admin-text-sm)',
                }}
              >
                SM
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--admin-text-md)', color: 'var(--admin-text-primary)', lineHeight: 1.2 }}>
                  SupervisorMatch
                </div>
                <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', fontWeight: 500 }}>
                  Admin Panel
                </div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--admin-radius-md)',
                background: 'linear-gradient(135deg, var(--admin-accent), hsl(280, 72%, 56%))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 'var(--admin-text-sm)',
              }}
            >
              SM
            </div>
          )}

          {isMobile && (
            <button
              onClick={close}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 'var(--admin-radius-sm)',
                color: 'var(--admin-text-secondary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            padding: isCollapsed ? '12px 10px' : '12px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: 'var(--admin-text-xs)',
                  fontWeight: 600,
                  color: 'var(--admin-text-quaternary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '6px 14px',
                }}
              >
                Menu
              </div>
            )}
            {navItems.map(item => (
              <NavItem key={item.path} item={item} collapsed={isCollapsed} onClick={isMobile ? close : undefined} />
            ))}
          </div>
        </nav>

        {/* Bottom actions */}
        <div
          style={{
            borderTop: '1px solid var(--admin-border)',
            padding: isCollapsed ? '12px 10px' : '12px',
            flexShrink: 0,
          }}
        >
          {/* Theme toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '10px 0' : '10px 14px',
              width: '100%',
              borderRadius: 'var(--admin-radius-md)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--admin-text-secondary)',
              fontSize: 'var(--admin-text-base)',
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'background var(--admin-transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </motion.button>

          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px 0' : '10px 14px',
                width: '100%',
                borderRadius: 'var(--admin-radius-md)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--admin-text-secondary)',
                fontSize: 'var(--admin-text-base)',
                fontWeight: 500,
                fontFamily: 'inherit',
                transition: 'background var(--admin-transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              {!isCollapsed && <span>Collapse</span>}
            </motion.button>
          )}

          {/* Logout */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              window.location.href = '/admin/login';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '10px 0' : '10px 14px',
              width: '100%',
              borderRadius: 'var(--admin-radius-md)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--admin-danger)',
              fontSize: 'var(--admin-text-base)',
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'background var(--admin-transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-danger-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}

// Mobile trigger button (for header)
export function SidebarTrigger({ onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 'var(--admin-radius-md)',
        border: '1px solid var(--admin-border)',
        background: 'var(--admin-bg-primary)',
        cursor: 'pointer',
        color: 'var(--admin-text-secondary)',
      }}
    >
      <Menu size={20} />
    </motion.button>
  );
}
