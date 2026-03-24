import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import AppLayout from './layouts/AppLayout'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import RequestsPage from './pages/RequestsPage'
import SearchPage from './pages/SearchPage'
import SupervisorDashboardPage from './pages/SupervisorDashboardPage'

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
