import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Bell as BellIcon,
  Palette,
  Globe,
  Lock,
  Mail,
  Save,
} from 'lucide-react';
import { Card, Avatar } from '../components/ui';

function ToggleSwitch({ checked, onChange }) {
  return (
    <motion.button
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 'var(--admin-radius-full)',
        background: checked ? 'var(--admin-accent)' : 'var(--admin-bg-tertiary)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        padding: 2,
        transition: 'background var(--admin-transition-fast)',
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: 'var(--admin-shadow-sm)',
        }}
      />
    </motion.button>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0',
        borderBottom: '1px solid var(--admin-border-subtle)',
        gap: 24,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--admin-text-sm)', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 2 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)' }}>
            {description}
          </div>
        )}
      </div>
      {children}
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

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: 'Alex Morgan',
    email: 'alex.morgan@university.edu',
    role: 'Super Admin',
    phone: '+1 (555) 123-4567',
  });

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    darkMode: false,
    compactView: false,
    twoFactorAuth: false,
    autoApprove: false,
    maintenanceMode: false,
  });

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Profile Section */}
      <SettingsSection icon={User} title="Profile" index={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <Avatar name={profile.name} size={72} />
          <div>
            <div style={{ fontSize: 'var(--admin-text-lg)', fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 2 }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)' }}>
              {profile.role}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                marginTop: 8,
                padding: '6px 14px',
                borderRadius: 'var(--admin-radius-md)',
                border: '1px solid var(--admin-border)',
                background: 'none',
                fontSize: 'var(--admin-text-xs)',
                fontWeight: 600,
                color: 'var(--admin-text-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Change Photo
            </motion.button>
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
            label="Role"
            value={profile.role}
            onChange={() => {}}
          />
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={BellIcon} title="Notifications" index={1}>
        <SettingRow label="Email Notifications" description="Receive email for new applications and updates">
          <ToggleSwitch checked={prefs.emailNotifications} onChange={() => togglePref('emailNotifications')} />
        </SettingRow>
        <SettingRow label="Push Notifications" description="Browser push notifications for urgent alerts">
          <ToggleSwitch checked={prefs.pushNotifications} onChange={() => togglePref('pushNotifications')} />
        </SettingRow>
        <SettingRow label="Weekly Report" description="Receive a summary email every Monday">
          <ToggleSwitch checked={prefs.weeklyReport} onChange={() => togglePref('weeklyReport')} />
        </SettingRow>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection icon={Palette} title="Appearance" index={2}>
        <SettingRow label="Dark Mode" description="Switch between light and dark themes">
          <ToggleSwitch checked={prefs.darkMode} onChange={() => togglePref('darkMode')} />
        </SettingRow>
        <SettingRow label="Compact View" description="Reduce padding and spacing for dense layouts">
          <ToggleSwitch checked={prefs.compactView} onChange={() => togglePref('compactView')} />
        </SettingRow>
      </SettingsSection>

      {/* Security */}
      <SettingsSection icon={Shield} title="Security" index={3}>
        <SettingRow label="Two-Factor Authentication" description="Add extra security to your account">
          <ToggleSwitch checked={prefs.twoFactorAuth} onChange={() => togglePref('twoFactorAuth')} />
        </SettingRow>
        <SettingRow label="Change Password" description="Update your admin account password">
          <motion.button
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--admin-radius-md)',
              border: '1px solid var(--admin-border)',
              background: 'none',
              fontSize: 'var(--admin-text-sm)',
              fontWeight: 600,
              color: 'var(--admin-text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Lock size={14} /> Change
          </motion.button>
        </SettingRow>
      </SettingsSection>

      {/* System */}
      <SettingsSection icon={Globe} title="System" index={4}>
        <SettingRow label="Auto-Approve Applications" description="Automatically approve applications that meet criteria">
          <ToggleSwitch checked={prefs.autoApprove} onChange={() => togglePref('autoApprove')} />
        </SettingRow>
        <SettingRow label="Maintenance Mode" description="Disable public access temporarily">
          <ToggleSwitch checked={prefs.maintenanceMode} onChange={() => togglePref('maintenanceMode')} />
        </SettingRow>
      </SettingsSection>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, marginBottom: 24 }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ boxShadow: 'var(--admin-shadow-md)' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            borderRadius: 'var(--admin-radius-md)',
            border: 'none',
            background: 'var(--admin-accent)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 'var(--admin-text-sm)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Save size={16} /> Save Changes
        </motion.button>
      </motion.div>
    </div>
  );
}
