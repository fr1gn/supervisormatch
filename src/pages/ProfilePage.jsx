import { Lightbulb, Save, Shield, Key, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { getInitials } from '../lib/utils'
import LoadingSpinner from '../components/LoadingSpinner'



function StudentProfile() {
  const { session, getCurrentStudent, updateStudentProfile } = useApp()
  const toast = useToast()
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
    avatar: student?.avatar || '',
    openToTeam: student?.openToTeam || false,
    preferredTeamSize: student?.preferredTeamSize || '',
    skills: student?.skills || [],
  })
  const [saving, setSaving] = useState(false)

  const SKILL_OPTIONS = ['Frontend Development', 'Backend Development', 'AI / ML', 'UI/UX', 'Research', 'Data Analysis']

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const [uploading, setUploading] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.info('Uploading photo...');
    
    const formData = new FormData();
    formData.append('file', file);

    const { api } = await import('../lib/api');
    const res = await api.postFormData('/upload', formData);

    if (res.ok && res.data?.url) {
      setForm(prev => ({ ...prev, avatar: res.data.url }));
      toast.success('Photo uploaded! Click Save to apply.');
    } else {
      toast.error(res.error || 'Upload failed');
    }
    setUploading(false);
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    const payload = {
      ...form,
      preferredTeamSize:
        form.preferredTeamSize === '' || form.preferredTeamSize == null
          ? null
          : Number(form.preferredTeamSize),
    }

    const result = await updateStudentProfile(payload)
    if (!result.ok) {
      toast.error(result.error || 'Failed to save profile.')
      setSaving(false)
      return
    }

    toast.success('Profile updated successfully!')
    setSaving(false)
  }

  return (
    <section>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <h1 className="heading-display" style={{ fontSize: '2rem', marginBottom: 6 }}>
          My Profile
        </h1>
        <p className="text-body" style={{ fontSize: '1rem' }}>
          Manage your student profile and account settings.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={false}
        className="card"
        style={{ padding: 0 }}
      >
        {/* Profile Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {form.avatar ? (
            <img
              src={form.avatar}
              alt={form.fullName}
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                border: '2px solid var(--border)',
              }}
            />
          ) : (
            <div className="avatar avatar-xl" style={{ fontSize: '1.25rem' }}>
              {getInitials(form.fullName)}
            </div>
          )}
          <div>
            <h3 className="heading-subtitle" style={{ fontSize: '1.125rem', marginBottom: 2 }}>
              {form.fullName || 'Student'}
            </h3>
            <p className="text-caption">{form.email}</p>
            <span className="badge badge-accent" style={{ marginTop: 6 }}>Student</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding: '24px', display: 'grid', gap: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <label className="label" htmlFor="fullName">Full Name</label>
              <input className="input" id="fullName" name="fullName" value={form.fullName} onChange={onChange} required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email (Login)</label>
              <input className="input" id="email" name="email" value={form.email} disabled />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone Number</label>
              <input className="input" id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="e.g., +1234567890" />
            </div>
            <div>
              <label className="label" htmlFor="studyLevel">Study Level</label>
              <input className="input" id="studyLevel" name="studyLevel" value={form.studyLevel} onChange={onChange} placeholder="e.g., Final Year" />
            </div>
            <div>
              <label className="label" htmlFor="department">Department</label>
              <input className="input" id="department" name="department" value={form.department} onChange={onChange} required />
            </div>
            <div>
              <label className="label" htmlFor="groupName">Group Name</label>
              <input className="input" id="groupName" name="groupName" value={form.groupName} onChange={onChange} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="avatarFile">Profile Photo</label>
              <input type="file" className="input" id="avatarFile" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ padding: '8px' }} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="interests">Research Interests</label>
            <input
              className="input"
              id="interests"
              name="interests"
              value={form.interests}
              onChange={onChange}
              placeholder="e.g., AI, Data Science, HCI"
            />
          </div>

          <div>
            <label className="label" htmlFor="bio">Bio</label>
            <textarea
              className="input"
              id="bio"
              name="bio"
              rows={4}
              value={form.bio}
              onChange={onChange}
              placeholder="Write a short introduction about your goals and interests"
            />
          </div>

          {/* Team Preferences */}
          <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', display: 'grid', gap: 16, transition: 'none' }}>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Team Preferences</p>
              <p className="text-caption" style={{ fontSize: '0.78rem' }}>Let other students find you for team formation.</p>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.openToTeam}
                onChange={(e) => setForm((prev) => ({ ...prev, openToTeam: e.target.checked }))}
                style={{ accentColor: 'var(--accent)', marginTop: 2 }}
              />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>I am open to joining a team</div>
                <div className="text-caption" style={{ fontSize: '0.75rem' }}>You will appear on the Find Teammates page.</div>
              </div>
            </label>

            <div style={{ maxWidth: 220 }}>
              <label className="label" htmlFor="preferredTeamSize">Preferred Team Size</label>
              <input
                className="input"
                id="preferredTeamSize"
                name="preferredTeamSize"
                type="number"
                min={2}
                max={10}
                value={form.preferredTeamSize}
                onChange={onChange}
                placeholder="e.g., 3"
              />
            </div>

            <div>
              <label className="label">Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SKILL_OPTIONS.map((skill) => {
                  const active = form.skills.includes(skill)
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      style={{
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        padding: '7px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: active ? 'var(--accent)' : 'var(--surface)',
                        color: active ? '#fff' : 'var(--text-secondary)',
                        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        transition: 'none',
                      }}
                    >
                      {active && <Check size={13} strokeWidth={2.5} />}
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <LoadingSpinner size={16} /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="card"
        style={{
          padding: 20,
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <Shield size={16} />
          </div>
          <div>
            <p className="text-caption" style={{ fontSize: '0.75rem' }}>Account Type</p>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Student</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <Key size={16} />
          </div>
          <div>
            <p className="text-caption" style={{ fontSize: '0.75rem' }}>Password</p>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Hidden</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function SupervisorProfile() {
  const { session, getCurrentSupervisor, updateSupervisorProfile } = useApp()
  const toast = useToast()
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
      avatar: supervisor?.avatar || '',
      capacity: supervisor?.capacity || 8,
    }),
    [supervisor, session],
  )

  const [form, setForm] = useState(initialState)
  const [saving, setSaving] = useState(false)

  const [uploading, setUploading] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.info('Uploading photo...');
    
    const formData = new FormData();
    formData.append('file', file);

    const { api } = await import('../lib/api');
    const res = await api.postFormData('/upload', formData);

    if (res.ok && res.data?.url) {
      setForm(prev => ({ ...prev, avatar: res.data.url }));
      toast.success('Photo uploaded! Click Save to apply.');
    } else {
      toast.error(res.error || 'Upload failed');
    }
    setUploading(false);
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      areas: form.areas.split(',').map(s => s.trim()).filter(Boolean),
      capacity: parseInt(form.capacity, 10) || 8,
    }
    const result = await updateSupervisorProfile(payload)

    if (!result.ok) {
      toast.error(result.error || 'Failed to save profile.')
      setSaving(false)
      return
    }

    toast.success('Profile updated successfully!')
    setSaving(false)
  }

  return (
    <section>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <h1 className="heading-display" style={{ fontSize: '2rem', marginBottom: 6 }}>
          My Profile
        </h1>
        <p className="text-body" style={{ fontSize: '1rem' }}>
          Manage your supervisor profile and research information.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={false}
        className="card"
        style={{ padding: 0 }}
      >
        {/* Profile Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {form.avatar ? (
            <img
              src={form.avatar}
              alt={form.name}
              style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                border: '3px solid var(--surface)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
          ) : (
            <div className="avatar avatar-xl">{getInitials(form.name)}</div>
          )}
          <div>
            <h3 className="heading-subtitle" style={{ fontSize: '1.125rem', marginBottom: 2 }}>
              {form.name || 'Supervisor'}
            </h3>
            <p className="text-caption">{form.email}</p>
            <span className="badge badge-accent" style={{ marginTop: 6 }}>Supervisor</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding: '24px', display: 'grid', gap: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <label className="label" htmlFor="name">Full Name</label>
              <input className="input" id="name" name="name" value={form.name} onChange={onChange} required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input className="input" id="email" name="email" value={form.email} disabled />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone Number</label>
              <input className="input" id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="e.g., +1234567890" />
            </div>
            <div>
              <label className="label" htmlFor="department">Department</label>
              <input className="input" id="department" name="department" value={form.department} onChange={onChange} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="capacity">Max Students (Capacity)</label>
              <input
                className="input"
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                max={50}
                value={form.capacity}
                onChange={onChange}
                style={{ maxWidth: 180 }}
              />
              <p className="text-caption" style={{ marginTop: 4, fontSize: '0.75rem' }}>
                The maximum number of students you can supervise at once.
              </p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="avatarFile">Profile Photo</label>
              <input type="file" className="input" id="avatarFile" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ padding: '8px' }} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="input" id="title" name="title" value={form.title} onChange={onChange} placeholder="Professor / Lecturer" />
          </div>

          <div>
            <label className="label" htmlFor="areas">Research Areas</label>
            <input
              className="input"
              id="areas"
              name="areas"
              value={form.areas}
              onChange={onChange}
              placeholder="Artificial Intelligence, Machine Learning, Deep Learning"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="bio">Biography</label>
            <textarea
              className="input"
              id="bio"
              name="bio"
              rows={4}
              value={form.bio}
              onChange={onChange}
              placeholder="Help students understand your research focus and expectations"
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <LoadingSpinner size={16} /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="card"
        style={{
          padding: 20,
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <Shield size={16} />
          </div>
          <div>
            <p className="text-caption" style={{ fontSize: '0.75rem' }}>Account Type</p>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Supervisor</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <Key size={16} />
          </div>
          <div>
            <p className="text-caption" style={{ fontSize: '0.75rem' }}>Account ID</p>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'monospace' }}>{session?.id}</p>
          </div>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          marginTop: 16,
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--accent-soft)',
          border: '1px solid rgba(99, 102, 241, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Lightbulb size={16} style={{ color: 'var(--accent)' }} />
          <h4 className="heading-subtitle" style={{ fontSize: '0.875rem', color: 'var(--accent-text)' }}>
            Profile Tips
          </h4>
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: 18,
          display: 'grid',
          gap: 6,
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}>
          <li>Complete all fields to attract more qualified students.</li>
          <li>Add your contact phone for easier communication.</li>
          <li>List specific research areas to improve discovery.</li>
        </ul>
      </motion.div>
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
