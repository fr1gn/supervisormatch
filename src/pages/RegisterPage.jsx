import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

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
  const [form, setForm] = useState(initialState)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.password.length < 6) {
      setError('Password should contain at least 6 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!form.department.trim()) {
      setError('Department is required.')
      return
    }

    const result = await registerUser(form)

    if (!result.ok) {
      setError(result.error)
      return
    }

    navigate('/login')
  }

  return (
    <section className="auth-screen">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <GraduationCap size={26} />
        </div>

        <h2>Create Account</h2>
        <p>Join SupervisorMatch</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />

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

          <fieldset className="radio-group">
            <legend>I am a:</legend>
            <label>
              <input
                type="radio"
                name="role"
                value="student"
                checked={form.role === 'student'}
                onChange={handleChange}
              />
              Student
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="supervisor"
                checked={form.role === 'supervisor'}
                onChange={handleChange}
              />
              Supervisor
            </label>
          </fieldset>

          <label htmlFor="department">Department</label>
          <input
            id="department"
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="e.g., Computer Science"
            required
          />

          <label htmlFor="groupName">Group Name (Optional)</label>
          <input
            id="groupName"
            name="groupName"
            value={form.groupName}
            onChange={handleChange}
            placeholder="e.g., CS-2024-A"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          {error ? <p className="error-note">{error}</p> : null}

          <button type="submit" className="btn-primary">
            Register
          </button>
        </form>

        <p className="auth-alt">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </section>
  )
}
