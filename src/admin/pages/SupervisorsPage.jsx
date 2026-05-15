import { motion } from 'framer-motion';
import { Star, Mail, BookOpen, Users as UsersIcon } from 'lucide-react';
import { adminApi } from '../api/client';
import { Avatar, StatusBadge, SearchInput, Card, FilterSelect, Skeleton } from '../components/ui';
import { useState, useEffect, useMemo } from 'react';

function SupervisorCard({ supervisor, index }) {
  const slotPercentage = supervisor.totalSlots > 0
    ? ((supervisor.totalSlots - supervisor.availableSlots) / supervisor.totalSlots) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4, boxShadow: 'var(--admin-shadow-lg)' }}
      style={{
        background: 'var(--admin-bg-primary)',
        borderRadius: 'var(--admin-radius-xl)',
        border: '1px solid var(--admin-border)',
        padding: 24,
        boxShadow: 'var(--admin-shadow-xs)',
        transition: 'all var(--admin-transition-base)',
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Avatar name={supervisor.name} size={48} src={supervisor.avatar} />
          <div>
            <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, margin: '0 0 2px', color: 'var(--admin-text-primary)' }}>
              {supervisor.name}
            </h3>
            <p style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', margin: 0, fontWeight: 500 }}>
              {supervisor.title}
            </p>
          </div>
        </div>
        <StatusBadge status={supervisor.status} size="sm" />
      </div>

      {/* Department */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--admin-text-secondary)', fontSize: 'var(--admin-text-sm)' }}>
        <BookOpen size={14} style={{ color: 'var(--admin-text-tertiary)' }} />
        {supervisor.department}
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <Star size={14} fill="var(--admin-warning)" color="var(--admin-warning)" />
        <span style={{ fontSize: 'var(--admin-text-sm)', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
          {supervisor.rating}
        </span>
        <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-quaternary)' }}>
          / 5.0
        </span>
        <div style={{ margin: '0 6px', width: 3, height: 3, borderRadius: '50%', background: 'var(--admin-text-quaternary)' }} />
        <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)' }}>
          {supervisor.yearsExperience} yrs exp.
        </span>
      </div>

      {/* Specializations */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
        {supervisor.specializations.map(spec => (
          <span
            key={spec}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--admin-radius-full)',
              background: 'var(--admin-bg-secondary)',
              fontSize: 'var(--admin-text-xs)',
              fontWeight: 500,
              color: 'var(--admin-text-secondary)',
            }}
          >
            {spec}
          </span>
        ))}
      </div>

      {/* Capacity Bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', fontWeight: 500 }}>
            Student Capacity
          </span>
          <span style={{ fontSize: 'var(--admin-text-xs)', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            {supervisor.activeStudents}/{supervisor.totalSlots}
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 'var(--admin-radius-full)',
            background: 'var(--admin-bg-tertiary)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${slotPercentage}%` }}
            transition={{ delay: 0.3 + index * 0.08, duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 'var(--admin-radius-full)',
              background: slotPercentage >= 100
                ? 'var(--admin-danger)'
                : slotPercentage >= 75
                ? 'var(--admin-warning)'
                : 'var(--admin-success)',
            }}
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          paddingTop: 14,
          borderTop: '1px solid var(--admin-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UsersIcon size={13} style={{ color: 'var(--admin-text-quaternary)' }} />
          <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)' }}>
            {supervisor.activeStudents} active
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mail size={13} style={{ color: 'var(--admin-text-quaternary)' }} />
          <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)' }}>
            {supervisor.availableSlots} slots open
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function SupervisorsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getSupervisors({ pageSize: '100' })
      .then(res => setAllSupervisors(res.data || []))
      .catch(() => setAllSupervisors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...allSupervisors];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.specializations || []).some(sp => sp.toLowerCase().includes(q))
      );
    }
    if (statusFilter) {
      result = result.filter(s => s.status === statusFilter);
    }
    return result;
  }, [search, statusFilter, allSupervisors]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Toolbar */}
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search supervisors..." />
            <FilterSelect
              label="All Statuses"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'available', label: 'Available' },
                { value: 'full', label: 'Full' },
                { value: 'on-leave', label: 'On Leave' },
              ]}
            />
          </div>
          <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)' }}>
            {filtered.length} supervisors
          </span>
        </div>
      </Card>

      {/* Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        {filtered.map((sup, i) => (
          <SupervisorCard key={sup.id} supervisor={sup} index={i} />
        ))}
      </div>
    </div>
  );
}
