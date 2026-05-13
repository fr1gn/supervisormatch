import { Navigate, Route, Routes } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppProvider, useApp } from './context/AppContext'
import AppLayout from './layouts/AppLayout'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import RequestsPage from './pages/RequestsPage'
import SearchPage from './pages/SearchPage'
import SupervisorDashboardPage from './pages/SupervisorDashboardPage'
import LoadingSpinner from './components/LoadingSpinner'
import { getAdminRoutes } from './admin/routes'
import { AdminThemeProvider } from './admin/hooks/useAdminTheme'

function RequireAuth({ children }) {
  const { session } = useApp()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RootRedirect() {
  const { session } = useApp()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={session.role === 'supervisor' ? '/app/supervisor' : '/app/search'} replace />
}

function RequireRole({ role, children }) {
  const { session } = useApp()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (session.role !== role) {
    return <Navigate to={session.role === 'supervisor' ? '/app/supervisor' : '/app/search'} replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="search" element={<SearchPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route
          path="supervisor"
          element={
            <RequireRole role="supervisor">
              <SupervisorDashboardPage />
            </RequireRole>
          }
        />
        <Route path="about" element={<AboutPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Panel Routes */}
      {getAdminRoutes()}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function InitScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <LoadingSpinner size={28} style={{ color: 'var(--accent)' }} />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 500 }}>
          Loading SupervisorMatch...
        </p>
      </motion.div>
    </div>
  )
}

function AppContent() {
  const { isInitializing } = useApp()
  if (isInitializing) return <InitScreen />
  return <AppRoutes />
}

export default function App() {
  return (
    <AdminThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AdminThemeProvider>
  )
}
