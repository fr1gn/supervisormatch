import { GraduationCap, Lightbulb, Mail, Workflow, Target, Sparkles, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '../lib/animations'

const studentFeatures = [
  'Search by research area and department',
  'View real-time slot availability',
  'Browse available research topics',
  'Send personalized supervision requests',
  'Get smart recommendations',
  'Track request status with updates',
  'Access contact information when accepted',
]

const supervisorFeatures = [
  'Manage capacity (up to 8 slots)',
  'Create and showcase research topics',
  'Review incoming student requests',
  'Multi-status workflow (pending → review → accepted)',
  'View student information and status',
  'Edit profile with bio and areas',
  'Automatic availability updates',
]

const steps = [
  {
    title: 'Create Your Account',
    text: 'Register as a student or supervisor. Complete your profile with relevant details.',
    emoji: '📝',
  },
  {
    title: 'Search & Discover',
    text: 'Use advanced filters to find the perfect supervisor match for your research.',
    emoji: '🔍',
  },
  {
    title: 'Send Requests',
    text: 'Send personalized requests and track status through multiple stages.',
    emoji: '📨',
  },
  {
    title: 'Connect & Collaborate',
    text: 'Once accepted, access contact details and begin your research journey.',
    emoji: '🤝',
  },
]

export default function AboutPage() {
  return (
    <section>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          textAlign: 'center',
          padding: '40px 24px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--accent-gradient)',
          color: 'white',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            top: -100,
            right: -80,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <GraduationCap size={32} />
          </div>
          <h1
            className="heading-display"
            style={{ fontSize: '2.25rem', color: 'white', marginBottom: 8 }}
          >
            SupervisorMatch
          </h1>
          <p style={{ fontSize: '1.0625rem', opacity: 0.85, maxWidth: 480, margin: '0 auto' }}>
            Connecting students with academic supervisors for impactful research collaboration
          </p>
        </div>
      </motion.div>

      {/* Mission */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="card"
        style={{ padding: 28, marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
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
            <Target size={18} />
          </div>
          <h2 className="heading-title" style={{ fontSize: '1.25rem' }}>Our Mission</h2>
        </div>
        <p className="text-body" style={{ marginBottom: 10 }}>
          SupervisorMatch streamlines the process of matching students with academic supervisors for
          research projects, theses, and dissertations.
        </p>
        <p className="text-body">
          We make finding the right supervisor easier, more transparent, and more efficient with real-time
          availability tracking, smart recommendations, and comprehensive request management.
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="card"
        style={{ padding: 28, marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--warning-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning-text)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <h2 className="heading-title" style={{ fontSize: '1.25rem' }}>Key Features</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          <div>
            <h3 className="heading-subtitle" style={{ fontSize: '0.9375rem', marginBottom: 14, color: 'var(--accent)' }}>
              For Students
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {studentFeatures.map((feature) => (
                <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-body" style={{ fontSize: '0.8125rem' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="heading-subtitle" style={{ fontSize: '0.9375rem', marginBottom: 14, color: 'var(--accent)' }}>
              For Supervisors
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {supervisorFeatures.map((feature) => (
                <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-body" style={{ fontSize: '0.8125rem' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="card"
        style={{ padding: 28, marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--info-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--info-text)',
            }}
          >
            <Workflow size={18} />
          </div>
          <h2 className="heading-title" style={{ fontSize: '1.25rem' }}>How It Works</h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={staggerItem}
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>{step.emoji}</span>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {index + 1}
                </span>
              </div>
              <h4 className="heading-subtitle" style={{ fontSize: '0.9375rem', marginBottom: 6 }}>
                {step.title}
              </h4>
              <p className="text-body" style={{ fontSize: '0.8125rem' }}>{step.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="card"
        style={{ padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--success-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success-text)',
            }}
          >
            <Mail size={18} />
          </div>
          <h2 className="heading-title" style={{ fontSize: '1.25rem' }}>Contact Us</h2>
        </div>
        <p className="text-body" style={{ marginBottom: 8 }}>
          Have questions or feedback? We would love to hear from you.
        </p>
        <p className="text-body" style={{ marginBottom: 4 }}>
          Email: <strong style={{ color: 'var(--text-primary)' }}>support@supervisormatch.edu</strong>
        </p>
        <p className="text-body">
          Support Hours: <strong style={{ color: 'var(--text-primary)' }}>Monday – Friday, 9:00 AM – 5:00 PM</strong>
        </p>
      </motion.div>
    </section>
  )
}
