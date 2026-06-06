import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save } from 'lucide-react';
import { Card, Avatar } from '../components/ui';
import { adminApi } from '../api/client';

function TextInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ flex: 1 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 'var(--admin-text-xs)', fontWeight: 600, color: 'var(--admin-text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 40,
          borderRadius: 'var(--admin-radius-md)',
          border: '1px solid var(--admin-border)',
          background: 'var(--admin-bg-secondary)',
          padding: '0 14px',
          fontSize: 'var(--admin-text-sm)',
          color: 'var(--admin-text-primary)',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color var(--admin-transition-fast)',
          boxSizing: 'border-box',
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
  );
}

function SettingsSection({ icon: Icon, title, children, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--admin-border)' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--admin-radius-md)',
              background: 'var(--admin-accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--admin-accent)',
            }}
          >
            <Icon size={18} />
          </div>
          <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
            {title}
          </h3>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: 'Super Admin',
    phone: '',
    avatar: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(res => {
      if (res?.data?.profile) {
        setProfile(res.data.profile);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings({ profile });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: 40 }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Profile Section */}
      <SettingsSection icon={User} title="Profile" index={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <Avatar name={profile.name} size={72} src={profile.avatar} />
          <div>
            <div style={{ fontSize: 'var(--admin-text-lg)', fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 2 }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)' }}>
              {profile.role}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <TextInput
            label="Full Name"
            value={profile.name}
            onChange={(v) => setProfile(p => ({ ...p, name: v }))}
          />
          <TextInput
            label="Email"
            value={profile.email}
            onChange={(v) => setProfile(p => ({ ...p, email: v }))}
            type="email"
          />
          <TextInput
            label="Phone"
            value={profile.phone}
            onChange={(v) => setProfile(p => ({ ...p, phone: v }))}
          />
          <TextInput
            label="Avatar URL"
            value={profile.avatar || ''}
            onChange={(v) => setProfile(p => ({ ...p, avatar: v }))}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
      </SettingsSection>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 'var(--admin-radius-md)',
            border: 'none',
            background: 'var(--admin-accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 'var(--admin-text-sm)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>
    </div>
  );
}
