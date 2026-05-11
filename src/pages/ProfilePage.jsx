import { Lightbulb, Save, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'

function StudentProfile() {
  const { session, getCurrentStudent, updateStudentProfile } = useApp()
  const student = getCurrentStudent()

  const [form, setForm] = useState({
    fullName: student?.fullName || session?.fullName || '',
    email: student?.email || session?.email || '',
    department: student?.department || session?.department || '',
    groupName: student?.groupName || session?.groupName || '',
    phone: student?.phone || '',
    studyLevel: student?.studyLevel || '',
    interests: student?.interests || '',
    bio: student?.bio || '',
  })
  const [notice, setNotice] = useState('')

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const result = await updateStudentProfile(form)
    if (!result.ok) {
      setNotice(result.error)
      return
    }

    setNotice('Profile updated successfully.')
  }

  return (
    <section className="profile-page supervisor-profile-page">
      <article className="profile-top-banner">
        <div>
          <h2>My Profile</h2>
          <p>Student</p>
        </div>
      </article>

      <article className="supervisor-profile-card">
        <header className="supervisor-profile-head">
          <div className="student-avatar-fallback">
            <UserRound size={22} />
          </div>
          <div>
            <h3>{form.fullName || 'Student'}</h3>
            <p>{form.email}</p>
            <span className="role-badge">Student</span>
          </div>
        </header>

        <form onSubmit={onSubmit} className="supervisor-profile-form">
          <div className="two-col-grid">
            <div>
              <label htmlFor="fullName">Full Name</label>
              <input id="fullName" name="fullName" value={form.fullName} onChange={onChange} required />
            </div>
            <div>
              <label htmlFor="email">Email (Login)</label>
              <input id="email" name="email" value={form.email} disabled />
            </div>
            <div>
              <label htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="e.g., +1234567890" />
            </div>
            <div>
              <label htmlFor="studyLevel">Study Level</label>
              <input
                id="studyLevel"
                name="studyLevel"
                value={form.studyLevel}
                onChange={onChange}
                placeholder="e.g., Final Year"
              />
            </div>
            <div>
              <label htmlFor="department">Department</label>
              <input id="department" name="department" value={form.department} onChange={onChange} required />
            </div>
            <div>
              <label htmlFor="groupName">Group Name</label>
              <input id="groupName" name="groupName" value={form.groupName} onChange={onChange} />
            </div>
          </div>

          <label htmlFor="interests">Research Interests</label>
          <input
            id="interests"
            name="interests"
            value={form.interests}
            onChange={onChange}
            placeholder="e.g., AI, Data Science, HCI"
          />

          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={form.bio}
            onChange={onChange}
            placeholder="Write a short introduction about your goals and interests"
          />

          <div className="request-actions">
            <button type="submit">
              <Save size={16} />
              Save Profile
            </button>
          </div>

          {notice ? <p className="inline-note">{notice}</p> : null}
        </form>

        <section className="account-info-grid">
          <div>
            <span>Account Type</span>
            <strong>Student</strong>
          </div>
          <div>
            <span>Password</span>
            <strong>Hidden (not editable here)</strong>
          </div>
        </section>
      </article>
    </section>
  )
}

function SupervisorProfile() {
  const { session, getCurrentSupervisor, updateSupervisorProfile } = useApp()
  const supervisor = getCurrentSupervisor()

  const initialState = useMemo(
    () => ({
      name: supervisor?.name || session?.fullName || '',
      email: supervisor?.email || session?.email || '',
      title: supervisor?.title || 'Supervisor',
      phone: supervisor?.phone || '',
      department: supervisor?.department || session?.department || '',
      areas: (supervisor?.areas || []).join(', '),
      bio: supervisor?.bio || '',
    }),
    [supervisor, session],
  )

  const [form, setForm] = useState(initialState)
  const [notice, setNotice] = useState('')

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const result = await updateSupervisorProfile(form)

    if (!result.ok) {
      setNotice(result.error)
      return
    }

    setNotice('Profile updated successfully.')
  }

  return (
    <section className="profile-page supervisor-profile-page">
      <article className="profile-top-banner">
        <div>
          <h2>My Profile</h2>
          <p>Supervisor</p>
        </div>
      </article>

      <article className="supervisor-profile-card">
        <header className="supervisor-profile-head">
          <img src={supervisor?.avatar} alt={form.name || 'Supervisor'} />
          <div>
            <h3>{form.name || 'Supervisor'}</h3>
            <p>{form.email}</p>
            <span className="role-badge">Supervisor</span>
          </div>
        </header>

        <form onSubmit={onSubmit} className="supervisor-profile-form">
          <div className="two-col-grid">
            <div>
              <label htmlFor="name">Full Name</label>
              <input id="name" name="name" value={form.name} onChange={onChange} required />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" value={form.email} disabled />
            </div>
            <div>
              <label htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="e.g., +1234567890" />
            </div>
            <div>
              <label htmlFor="department">Department</label>
              <input id="department" name="department" value={form.department} onChange={onChange} required />
            </div>
          </div>

          <label htmlFor="title">Title</label>
          <input id="title" name="title" value={form.title} onChange={onChange} placeholder="Professor / Lecturer" />

          <label htmlFor="areas">Research Areas</label>
          <input
            id="areas"
            name="areas"
            value={form.areas}
            onChange={onChange}
            placeholder="Artificial Intelligence, Machine Learning, Deep Learning"
            required
          />

          <label htmlFor="bio">Biography</label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={form.bio}
            onChange={onChange}
            placeholder="Help students understand your research focus and expectations"
            required
          />

          <div className="request-actions">
            <button type="submit">
              <Save size={16} />
              Save Profile
            </button>
          </div>

          {notice ? <p className="inline-note">{notice}</p> : null}
        </form>

        <section className="account-info-grid">
          <div>
            <span>Account Type</span>
            <strong>Supervisor</strong>
          </div>
          <div>
            <span>Account ID</span>
            <strong>{session?.id}</strong>
          </div>
        </section>

        <section className="tips-box">
          <h4>
            <Lightbulb size={16} />
            Profile Tips
          </h4>
          <ul>
            <li>Complete all fields to attract more qualified students.</li>
            <li>Add your contact phone for easier communication.</li>
            <li>List specific research areas to improve discovery.</li>
          </ul>
        </section>
      </article>
    </section>
  )
}

export default function ProfilePage() {
  const { session } = useApp()

  if (session?.role === 'supervisor') {
    return <SupervisorProfile />
  }

  return <StudentProfile />
}
