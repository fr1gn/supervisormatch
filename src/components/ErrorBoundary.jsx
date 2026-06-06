import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary, #0f0f12)',
            color: 'var(--text-primary, #f0f0f5)',
            fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
              }}
            >
              ⚠️
            </div>

            <div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary, #f0f0f5)',
                }}
              >
                Something went wrong
              </h1>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary, #9ca3af)',
                  lineHeight: 1.6,
                }}
              >
                An unexpected error occurred. Please try reloading the page.
              </p>
            </div>

            {this.state.error && (
              <details
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--bg-secondary, #1a1a24)',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-tertiary, #6b7280)',
                  border: '1px solid var(--border-color, #2a2a3a)',
                }}
              >
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Error details
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error?.message || String(this.state.error)}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #2a2a3a)',
                  background: 'var(--bg-secondary, #1a1a24)',
                  color: 'var(--text-primary, #f0f0f5)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent, #6366f1)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
