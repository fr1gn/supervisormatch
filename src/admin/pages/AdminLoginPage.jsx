import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--admin-bg-root)',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--admin-bg-primary)',
          borderRadius: 'var(--admin-radius-xl)',
          border: '1px solid var(--admin-border)',
          boxShadow: 'var(--admin-shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header gradient bar */}
        <div
          style={{
            height: 4,
            background: 'linear-gradient(90deg, var(--admin-accent), hsl(280, 72%, 56%))',
          }}
        />

        <div style={{ padding: '40px 36px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--admin-radius-lg)',
                background: 'linear-gradient(135deg, var(--admin-accent), hsl(280, 72%, 56%))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Shield size={28} color="#fff" />
            </motion.div>
            <h1
              style={{
                fontSize: 'var(--admin-text-xl)',
                fontWeight: 800,
                color: 'var(--admin-text-primary)',
                margin: '0 0 6px',
              }}
            >
              Admin Panel
            </h1>
            <p
              style={{
                fontSize: 'var(--admin-text-sm)',
                color: 'var(--admin-text-tertiary)',
                margin: 0,
              }}
            >
              Sign in to SupervisorMatch administration
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 'var(--admin-radius-md)',
                background: 'var(--admin-danger-subtle)',
                color: 'var(--admin-danger)',
                fontSize: 'var(--admin-text-sm)',
                fontWeight: 500,
                marginBottom: 20,
              }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--admin-text-xs)',
                  fontWeight: 600,
                  color: 'var(--admin-text-tertiary)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Login
              </label>
              <input
                id="admin-login-input"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Enter admin login"
                autoComplete="username"
                required
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 'var(--admin-radius-md)',
                  border: '1px solid var(--admin-border)',
                  background: 'var(--admin-bg-secondary)',
                  padding: '0 14px',
                  fontSize: 'var(--admin-text-sm)',
                  color: 'var(--admin-text-primary)',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--admin-accent)';
                  e.target.style.boxShadow = '0 0 0 3px var(--admin-accent-subtle)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--admin-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--admin-text-xs)',
                  fontWeight: 600,
                  color: 'var(--admin-text-tertiary)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 'var(--admin-radius-md)',
                    border: '1px solid var(--admin-border)',
                    background: 'var(--admin-bg-secondary)',
                    padding: '0 42px 0 14px',
                    fontSize: 'var(--admin-text-sm)',
                    color: 'var(--admin-text-primary)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-accent)';
                    e.target.style.boxShadow = '0 0 0 3px var(--admin-accent-subtle)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
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
                    cursor: 'pointer',
                    color: 'var(--admin-text-tertiary)',
                    padding: 4,
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              id="admin-login-button"
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              whileHover={{ boxShadow: 'var(--admin-shadow-md)' }}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 'var(--admin-radius-md)',
                border: 'none',
                background: loading
                  ? 'var(--admin-text-quaternary)'
                  : 'linear-gradient(135deg, var(--admin-accent), hsl(280, 72%, 56%))',
                color: '#fff',
                fontWeight: 700,
                fontSize: 'var(--admin-text-sm)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                />
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
