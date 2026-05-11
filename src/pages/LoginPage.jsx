import { GraduationCap, ArrowRight, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function LoginPage() {
  const { loginUser } = useApp()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
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
    setError('')
    const result = await loginUser(form)

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    navigate(result.data?.user?.role === 'supervisor' ? '/app/supervisor' : '/app/search')
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
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'var(--accent)',
            opacity: 0.04,
            top: '-20%',
            right: '-10%',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: '#8b5cf6',
            opacity: 0.04,
            bottom: '-10%',
            left: '-5%',
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
          flex: 1,
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
          style={{ maxWidth: 440, color: 'white' }}
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
            style={{ fontSize: '2.75rem', color: 'white', marginBottom: 16 }}
          >
            Find Your Perfect Supervisor
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.85, lineHeight: 1.7, marginBottom: 40 }}>
            Connect with academic supervisors, browse research topics, and start your thesis journey
            with smart matching and real-time availability tracking.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { value: '500+', label: 'Supervisors' },
              { value: '2k+', label: 'Students' },
              { value: '95%', label: 'Match Rate' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: '0.8125rem', opacity: 0.7 }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Mobile logo */}
          <div
            className="show-mobile-only"
            style={{ textAlign: 'center', marginBottom: 32 }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-gradient)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: 16,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
              }}
            >
              <GraduationCap size={28} />
            </div>
            <h2 className="heading-title" style={{ fontSize: '1.25rem' }}>SupervisorMatch</h2>
          </div>

          <div className="hide-mobile" style={{ marginBottom: 32 }}>
            <h2 className="heading-display" style={{ fontSize: '1.875rem', marginBottom: 8 }}>
              Welcome back
            </h2>
            <p className="text-body">Sign in to your SupervisorMatch account</p>
          </div>

          <div className="show-mobile-only" style={{ marginBottom: 24, textAlign: 'center' }}>
            <h2 className="heading-title" style={{ fontSize: '1.5rem', marginBottom: 6 }}>
              Welcome back
            </h2>
            <p className="text-body">Sign in to continue</p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
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
                autoComplete="email"
              />
            </div>

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
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                  Sign In
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
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--accent)', fontWeight: 600 }}
            >
              Create account
            </Link>
          </p>

          {/* Demo accounts */}
          <div
            className="card"
            style={{
              marginTop: 24,
              padding: '16px',
              background: 'var(--accent-soft)',
              border: '1px solid rgba(99, 102, 241, 0.12)',
            }}
          >
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-text)' }}>
              Demo Accounts
            </p>
            <div style={{ display: 'grid', gap: 4, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <div>Student: <strong style={{ color: 'var(--text-primary)' }}>student@test.com</strong></div>
              <div>Supervisor: <strong style={{ color: 'var(--text-primary)' }}>johnson@university.edu</strong></div>
              <div>Password: <strong style={{ color: 'var(--text-primary)' }}>demo123</strong></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
