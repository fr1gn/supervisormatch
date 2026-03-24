import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function LoginPage() {
  const { loginUser } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const result = loginUser(form)

    if (!result.ok) {
      setError(result.error)
      return
    }

    navigate(result.role === 'supervisor' ? '/app/supervisor' : '/app/search')
  }

  return (
    <section className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <GraduationCap size={26} />
        </div>

        <h2>Welcome Back</h2>
        <p>Sign in to SupervisorMatch</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="your.email@university.edu"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          {error ? <p className="error-note">{error}</p> : null}

          <button type="submit" className="btn-primary">
            Login
          </button>
        </form>

        <p className="auth-alt">
          Don&apos;t have an account? <Link to="/register">Register here</Link>
        </p>

        <div className="demo-note">
          <p>Demo Accounts</p>
          <p>
            Student: <strong>student@test.com</strong> (or any new student email)
          </p>
          <p>
            Supervisor: <strong>johnson@university.edu</strong>
          </p>
          <p>Password: any password</p>
        </div>
      </div>
    </section>
  )
}
