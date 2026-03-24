import { GraduationCap, Lightbulb, Mail, Workflow, Target } from 'lucide-react'

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
  'Multi-status workflow (pending, under review, accepted/rejected)',
  'View student information and status',
  'Edit profile with bio and areas',
  'Automatic availability updates',
]

const steps = [
  {
    title: 'Create Your Account',
    text: 'Register as a student or supervisor. Complete your profile with contact information, department, and other relevant details.',
  },
  {
    title: 'Search and Discover',
    text: 'Students can search supervisors using advanced filters, view detailed profiles, research areas, and available topics. Get smart recommendations when exact matches are not found.',
  },
  {
    title: 'Send and Track Requests',
    text: 'Send personalized supervision requests with messages. Track status through multiple stages: pending to under consideration to accepted or rejected.',
  },
  {
    title: 'Connect and Collaborate',
    text: 'Once accepted, both parties can access contact information to arrange meetings and begin the research journey together.',
  },
]

export default function AboutPage() {
  return (
    <section className="about-page">
      <div className="about-hero">
        <div className="about-icon-wrap">
          <GraduationCap size={30} />
        </div>
        <h2>SupervisorMatch</h2>
        <p>Connecting students with academic supervisors</p>
      </div>

      <article className="about-block">
        <h3>
          <Target size={18} />
          Our Mission
        </h3>
        <p>
          SupervisorMatch streamlines the process of matching students with academic supervisors for research projects,
          theses, and dissertations.
        </p>
        <p>
          We make finding the right supervisor easier, more transparent, and more efficient with real-time availability
          tracking, smart recommendations, and comprehensive request management.
        </p>
      </article>

      <article className="about-block">
        <h3>
          <Lightbulb size={18} />
          Key Features
        </h3>

        <div className="feature-columns">
          <div>
            <h4>For Students</h4>
            <ul>
              {studentFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4>For Supervisors</h4>
            <ul>
              {supervisorFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <article className="about-block">
        <h3>
          <Workflow size={18} />
          How It Works
        </h3>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={step.title} className="step-card">
              <span>{index + 1}</span>
              <h4>{step.title}</h4>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="about-block">
        <h3>
          <Mail size={18} />
          Contact Us
        </h3>
        <p>Have questions or feedback? We would love to hear from you.</p>
        <p>Email: support@supervisormatch.edu</p>
        <p>Support Hours: Monday to Friday, 9:00 AM to 5:00 PM</p>
      </article>
    </section>
  )
}
