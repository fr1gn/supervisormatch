import { CircleHelp, Compass, GraduationCap, LogOut, PanelsTopLeft, Search, UserRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function AppLayout() {
  const navigate = useNavigate()
  const { session, logoutUser } = useApp()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand-wrap">
          <div className="brand-logo">
            <GraduationCap size={20} strokeWidth={2.3} />
          </div>
          <div>
            <h1>SupervisorMatch</h1>
            <p>{session?.role === 'supervisor' ? 'Supervisor' : 'Student'}</p>
          </div>
        </div>

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

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
