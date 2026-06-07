import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppProvider, useApp } from './context/AppContext'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'
import { getAdminRoutes } from './admin/routes'
import { AdminThemeProvider } from './admin/hooks/useAdminTheme'

const AppLayout = lazy(() => import('./layouts/AppLayout'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const RequestsPage = lazy(() => import('./pages/RequestsPage'))
const TeammatesPage = lazy(() => import('./pages/TeammatesPage'))
const SupervisorDashboardPage = lazy(() => import('./pages/SupervisorDashboardPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ProjectsListPage = lazy(() => import('./pages/ProjectsListPage'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))

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

function SuspenseFallback() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LoadingSpinner size={24} style={{ color: 'var(--accent)' }} />
    </div>
  )
}

function AppRoutes() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
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
            path="teammates"
            element={
              <RequireRole role="student">
                <TeammatesPage />
              </RequireRole>
            }
          />
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
          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="projects/:id" element={<ProjectPage />} />
        </Route>

        {getAdminRoutes()}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
    <ErrorBoundary>
      <AdminThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AdminThemeProvider>
    </ErrorBoundary>
  )
}
