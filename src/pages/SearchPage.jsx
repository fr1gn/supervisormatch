import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import SupervisorCard from '../components/SupervisorCard'
import { useApp } from '../context/AppContext'

function slotsLeft(supervisor) {
  return Math.max(0, supervisor.capacity - supervisor.currentStudents)
}

export default function SearchPage() {
  const { session, supervisors, requests, sendRequest } = useApp()

  const [filters, setFilters] = useState({
    query: '',
    department: 'all',
    area: 'all',
    onlyAvailable: false,
  })

  const departments = useMemo(() => {
    const unique = new Set(supervisors.map((item) => item.department))
    return ['all', ...Array.from(unique)]
  }, [supervisors])

  const areas = useMemo(() => {
    const unique = new Set(supervisors.flatMap((item) => item.areas))
    return ['all', ...Array.from(unique)]
  }, [supervisors])

  const filteredSupervisors = useMemo(() => {
    const query = filters.query.trim().toLowerCase()

    return supervisors.filter((supervisor) => {
      const fieldBlob = `${supervisor.name} ${supervisor.title} ${supervisor.department} ${supervisor.areas.join(' ')}`.toLowerCase()
      const matchesQuery = query ? fieldBlob.includes(query) : true
      const matchesDepartment = filters.department === 'all' || supervisor.department === filters.department
      const matchesArea = filters.area === 'all' || supervisor.areas.includes(filters.area)
      const hasCapacity = !filters.onlyAvailable || slotsLeft(supervisor) > 0

      return matchesQuery && matchesDepartment && matchesArea && hasCapacity
    })
  }, [filters, supervisors])

  const activeSupervisorIds = new Set(
    requests
      .filter((request) => request.studentEmail === session?.email && request.status !== 'rejected')
      .map((request) => request.supervisorId),
  )

  if (session?.role === 'supervisor') {
    return <Navigate to="/app/supervisor" replace />
  }

  return (
    <section>
      <div className="hero-banner">
        <h2>Hi, {session?.fullName || 'Student'}</h2>
        <p>Find your perfect supervisor with smart filters and real-time availability.</p>
      </div>

      <div className="search-panel">
        <label className="search-input">
          <Search size={18} />
          <input
            type="text"
            value={filters.query}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            placeholder="Search by name, field, department..."
          />
        </label>

        <div className="filters-grid">
          <select
            value={filters.department}
            onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department === 'all' ? 'All Departments' : department}
              </option>
            ))}
          </select>

          <select value={filters.area} onChange={(event) => setFilters((prev) => ({ ...prev, area: event.target.value }))}>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area === 'all' ? 'All Areas' : area}
              </option>
            ))}
          </select>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={filters.onlyAvailable}
            onChange={(event) => setFilters((prev) => ({ ...prev, onlyAvailable: event.target.checked }))}
          />
          Available only
        </label>
      </div>

      <p className="results-count">{filteredSupervisors.length} supervisors</p>

      <div className="cards-grid">
        {filteredSupervisors.map((supervisor) => (
          <SupervisorCard
            key={supervisor.id}
            supervisor={supervisor}
            onRequest={sendRequest}
            hasActiveRequest={activeSupervisorIds.has(supervisor.id)}
          />
        ))}
      </div>
    </section>
  )
}
