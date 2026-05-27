import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Search,
  FileText,
  LayoutDashboard,
  Info,
  UserCircle,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  FolderOpen,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { PageTransition } from '../lib/animations'

function NavItem({ to, icon: Icon, label, onClick, isMobile, setMobileOpen }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: isMobile ? '12px 16px' : '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all var(--transition-fast)',
          width: '100%',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-hover)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        <Icon size={18} strokeWidth={1.75} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <NavLink
      to={to}
      onClick={() => isMobile && setMobileOpen?.(false)}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: isMobile ? '12px 16px' : '10px 14px',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-soft)' : 'transparent',
        transition: 'all var(--transition-fast)',
      })}
    >
      <Icon size={18} strokeWidth={1.75} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session, logoutUser } = useApp()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isSupervisor = session?.role === 'supervisor'

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
    setMobileOpen(false)
  }

  const navItems = isSupervisor
    ? [
        { to: '/app/supervisor', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/app/projects', icon: FolderOpen, label: 'Проекты' },
        { to: '/app/about', icon: Info, label: 'About' },
        { to: '/app/profile', icon: UserCircle, label: 'Profile' },
      ]
    : [
        { to: '/app/search', icon: Search, label: 'Find Supervisors' },
        { to: '/app/requests', icon: FileText, label: 'My Requests' },
        { to: '/app/projects', icon: FolderOpen, label: 'Проекты' },
        { to: '/app/about', icon: Info, label: 'About' },
        { to: '/app/profile', icon: UserCircle, label: 'Profile' },
      ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hide-mobile"
        style={{
          width: 260,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          transition: 'background-color var(--transition-slow), border-color var(--transition-slow)',
        }}
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => navigate(isSupervisor ? '/app/supervisor' : '/app/search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 20px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
              transition: 'transform var(--transition-spring)',
            }}
          >
            <GraduationCap size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              SupervisorMatch
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
              {session?.role || 'Student'} Portal
            </p>
          </div>
        </button>

        <hr className="divider" style={{ margin: '0 20px' }} />

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem
            onClick={toggleTheme}
            icon={theme === 'dark' ? Sun : Moon}
            label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          />
          <NavItem
            onClick={handleLogout}
            icon={LogOut}
            label="Sign Out"
          />
        </div>
      </aside>

      {/* Mobile Header */}
      <header
        className="show-mobile-only glass"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(isSupervisor ? '/app/supervisor' : '/app/search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <GraduationCap size={16} strokeWidth={1.75} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}>
            SupervisorMatch
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={toggleTheme}
            style={{ width: 36, height: 36 }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ width: 36, height: 36 }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 55,
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 280,
                maxWidth: 'calc(100vw - 60px)',
                background: 'var(--surface)',
                borderLeft: '1px solid var(--border)',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 12px',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}>
                  Menu
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setMobileOpen(false)}
                  style={{ width: 32, height: 32 }}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {navItems.map((item) => (
                  <NavItem key={item.to} {...item} isMobile setMobileOpen={setMobileOpen} />
                ))}
              </nav>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <NavItem
                  onClick={handleLogout}
                  icon={LogOut}
                  label="Sign Out"
                  isMobile
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: 'var(--sidebar-width, 0)',
          minHeight: '100vh',
          paddingTop: 'var(--mobile-header, 0)',
        }}
      >
        <style>{`
          @media (min-width: 769px) {
            main { --sidebar-width: 260px; }
          }
          @media (max-width: 768px) {
            main { --mobile-header: 60px; }
          }
        `}</style>
        <div className="container" style={{ paddingTop: 28, paddingBottom: 56 }}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
