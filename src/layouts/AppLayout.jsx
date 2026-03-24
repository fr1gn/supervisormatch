import { CircleHelp, Compass, GraduationCap, LogOut, PanelsTopLeft, Search, UserRound } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session, logoutUser } = useApp()
  const homePath = session?.role === 'supervisor' ? '/app/supervisor' : '/app/search'
  const shouldShowSectionTabs = location.pathname !== '/app/profile'

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="top-header">
        <button type="button" className="brand-wrap brand-link" onClick={() => navigate(homePath)}>
          <div className="brand-logo">
            <GraduationCap size={20} strokeWidth={2.3} />
          </div>
          <div>
            <h1>SupervisorMatch</h1>
            <p>{session?.role === 'supervisor' ? 'Supervisor' : 'Student'}</p>
          </div>
        </button>

        <nav className="main-links">
          <NavLink to="/app/about">
            <CircleHelp size={16} />
            <span>About</span>
          </NavLink>
          <NavLink to="/app/profile">
            <UserRound size={16} />
            <span>Profile</span>
          </NavLink>
          <button type="button" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </nav>
      </header>

      {shouldShowSectionTabs ? (
        <div className="section-tabs">
          {session?.role === 'supervisor' ? (
            <NavLink to="/app/supervisor">
              <PanelsTopLeft size={16} />
              <span>Dashboard</span>
            </NavLink>
          ) : (
            <>
              <NavLink to="/app/search">
                <Search size={16} />
                <span>Search</span>
              </NavLink>
              <NavLink to="/app/requests">
                <Compass size={16} />
                <span>Requests</span>
              </NavLink>
            </>
          )}
        </div>
      ) : null}

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
