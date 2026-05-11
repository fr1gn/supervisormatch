import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SupervisorCard from '../components/SupervisorCard'
import EmptyState from '../components/EmptyState'
import { useApp } from '../context/AppContext'
import { staggerContainer, staggerItem } from '../lib/animations'

function slotsLeft(supervisor) {
  return Math.max(0, supervisor.capacity - supervisor.currentStudents)
}

export default function SearchPage() {
  const { session, supervisors, requests, sendRequest } = useApp()
  const [showFilters, setShowFilters] = useState(false)

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

  const hasActiveFilters = filters.department !== 'all' || filters.area !== 'all' || filters.onlyAvailable

  const clearFilters = () => {
    setFilters({ query: '', department: 'all', area: 'all', onlyAvailable: false })
  }

  if (session?.role === 'supervisor') {
    return <Navigate to="/app/supervisor" replace />
  }

  return (
    <section>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <h1 className="heading-display" style={{ fontSize: '2rem', marginBottom: 6 }}>
          Hi, {session?.fullName?.split(' ')[0] || 'Student'} 👋
        </h1>
        <p className="text-body" style={{ fontSize: '1rem' }}>
          Find your perfect supervisor with smart filters and real-time availability.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ marginBottom: 20 }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon
              size={18}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="input"
              type="text"
              value={filters.query}
              onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              placeholder="Search by name, field, department..."
              style={{ paddingLeft: 42, height: 48 }}
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, query: '' }))}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
            style={{ height: 48, gap: 8 }}
          >
            <SlidersHorizontal size={16} />
            <span className="hide-mobile">Filters</span>
            {hasActiveFilters && (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: hasActiveFilters && !showFilters ? 'rgba(255,255,255,0.25)' : 'var(--accent-soft)',
                  color: hasActiveFilters && !showFilters ? 'white' : 'var(--accent-text)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                !
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="card"
            style={{ marginTop: 12, padding: 20 }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 14,
              }}
            >
              <div>
                <label className="label">Department</label>
                <select
                  className="input"
                  value={filters.department}
                  onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
                >
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department === 'all' ? 'All Departments' : department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Research Area</label>
                <select
                  className="input"
                  value={filters.area}
                  onChange={(event) => setFilters((prev) => ({ ...prev, area: event.target.value }))}
                >
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area === 'all' ? 'All Areas' : area}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0 14px',
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border)',
                    background: filters.onlyAvailable ? 'var(--accent-soft)' : 'var(--surface)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all var(--transition-fast)',
                    width: '100%',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.onlyAvailable}
                    onChange={(event) => setFilters((prev) => ({ ...prev, onlyAvailable: event.target.checked }))}
                    style={{ width: 'auto', accentColor: 'var(--accent)' }}
                  />
                  Available only
                </label>
              </div>
            </div>

            {hasActiveFilters && (
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <X size={14} />
                  Clear all filters
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Results count */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="text-caption" style={{ fontWeight: 500 }}>
          {filteredSupervisors.length} supervisor{filteredSupervisors.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Grid */}
      {filteredSupervisors.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No supervisors found"
          description="Try adjusting your search or filters to find more supervisors."
          action={
            hasActiveFilters ? (
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          }}
        >
          {filteredSupervisors.map((supervisor) => (
            <motion.div key={supervisor.id} variants={staggerItem}>
              <SupervisorCard
                supervisor={supervisor}
                onRequest={sendRequest}
                hasActiveRequest={activeSupervisorIds.has(supervisor.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  )
}
