import { motion } from 'framer-motion';
import { Users, GraduationCap, FolderOpen, MoreHorizontal, Plus } from 'lucide-react';
import { departments } from '../data/mockData';
import { Card } from '../components/ui';

function DepartmentCard({ dept, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4, boxShadow: 'var(--admin-shadow-lg)' }}
      style={{
        background: 'var(--admin-bg-primary)',
        borderRadius: 'var(--admin-radius-xl)',
        border: '1px solid var(--admin-border)',
        padding: 0,
        overflow: 'hidden',
        boxShadow: 'var(--admin-shadow-xs)',
        cursor: 'pointer',
        transition: 'all var(--admin-transition-base)',
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: 4, background: dept.color }} />

      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--admin-radius-lg)',
                background: `${dept.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: dept.color,
              }}
            >
              <FolderOpen size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, margin: '0 0 2px', color: 'var(--admin-text-primary)' }}>
                {dept.name}
              </h3>
              <p style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', margin: 0 }}>
                Head: {dept.head}
              </p>
            </div>
          </div>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--admin-text-tertiary)',
              padding: 4,
              borderRadius: 'var(--admin-radius-sm)',
            }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {[
            { icon: Users, label: 'Supervisors', value: dept.totalSupervisors },
            { icon: GraduationCap, label: 'Students', value: dept.totalStudents },
            { icon: FolderOpen, label: 'Projects', value: dept.activeProjects },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '12px',
                borderRadius: 'var(--admin-radius-md)',
                background: 'var(--admin-bg-secondary)',
                textAlign: 'center',
              }}
            >
              <stat.icon
                size={16}
                style={{
                  color: 'var(--admin-text-quaternary)',
                  marginBottom: 6,
                }}
              />
              <div style={{ fontSize: 'var(--admin-text-lg)', fontWeight: 800, color: 'var(--admin-text-primary)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function DepartmentsPage() {
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)' }}>
            {departments.length} departments
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
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
          <Plus size={16} /> Add Department
        </motion.button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        {departments.map((dept, i) => (
          <DepartmentCard key={dept.id} dept={dept} index={i} />
        ))}
      </div>
    </div>
  );
}
