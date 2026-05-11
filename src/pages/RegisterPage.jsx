import { GraduationCap, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Moon, Sun } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const initialState = {
  fullName: '',
  email: '',
  role: 'student',
  department: '',
  groupName: '',
  password: '',
  confirmPassword: '',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { registerUser } = useApp()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState(initialState)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    if (form.password.length < 6) {
      setError('Password should contain at least 6 characters.')
      setLoading(false)
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    if (!form.department.trim()) {
      setError('Department is required.')
      setLoading(false)
      return
    }

    const result = await registerUser(form)

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    navigate('/login')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg-primary)',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: '#8b5cf6',
            opacity: 0.04,
            top: '10%',
            left: '-10%',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'var(--accent)',
            opacity: 0.04,
            bottom: '-5%',
            right: '-5%',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="btn btn-ghost btn-icon"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
          width: 40,
          height: 40,
        }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Left Panel — Branding (Desktop only) */}
      <div
        className="hide-mobile"
        style={{
          flex: '0 0 440px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px',
          position: 'relative',
          zIndex: 1,
          background: 'var(--accent-gradient)',
          borderRadius: '0 32px 32px 0',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: 380, color: 'white' }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
            }}
          >
            <GraduationCap size={32} />
          </div>
          <h1
            className="heading-display"
            style={{ fontSize: '2.5rem', color: 'white', marginBottom: 16 }}
          >
            Start Your Research Journey
          </h1>
          <p style={{ fontSize: '1.0625rem', opacity: 0.85, lineHeight: 1.7 }}>
            Join thousands of students and supervisors on the leading academic matching platform.
            Create your profile and start connecting.
          </p>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          position: 'relative',
          zIndex: 1,
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ width: '100%', maxWidth: 480 }}
        >
          {/* Mobile logo */}
          <div
            className="show-mobile-only"
            style={{ textAlign: 'center', marginBottom: 24 }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-gradient)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: 12,
              }}
            >
              <GraduationCap size={24} />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)',
                marginBottom: 16,
              }}
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
            <h2 className="heading-display" style={{ fontSize: '1.75rem', marginBottom: 6 }}>
              Create Account
            </h2>
            <p className="text-body">Join SupervisorMatch and find your ideal supervisor</p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label className="label" htmlFor="fullName">Full Name</label>
              <input
                className="input"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your.email@university.edu"
                required
              />
            </div>

            {/* Role Toggle */}
            <div>
              <label className="label">I am a</label>
              <div
                style={{
                  display: 'flex',
                  padding: 4,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  gap: 4,
                }}
              >
                {['student', 'supervisor'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role }))}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all var(--transition-fast)',
                      background: form.role === role ? 'var(--surface)' : 'transparent',
                      color: form.role === role ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      boxShadow: form.role === role ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="label" htmlFor="department">Department</label>
                <input
                  className="input"
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="groupName">Group (Optional)</label>
                <input
                  className="input"
                  id="groupName"
                  name="groupName"
                  value={form.groupName}
                  onChange={handleChange}
                  placeholder="e.g., CS-2024-A"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    required
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
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
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirm</label>
                <input
                  className="input"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-soft)',
                  color: 'var(--danger-text)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ height: 48, fontSize: '0.9375rem' }}
            >
              {loading ? (
                <LoadingSpinner size={18} />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: 24,
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--accent)', fontWeight: 600 }}
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
