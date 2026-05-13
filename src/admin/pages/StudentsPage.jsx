import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Eye, Edit, Trash2, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { students } from '../data/mockData';
import { useTableState } from '../hooks/useTableState';
import { Avatar, StatusBadge, SearchInput, Pagination, FilterSelect, Modal, Card } from '../components/ui';
import { formatDate } from '../utils/helpers';

function SortHeader({ label, sortKey, sortConfig, onSort }) {
  const isActive = sortConfig.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: 'var(--admin-text-xs)',
        fontWeight: 600,
        color: isActive ? 'var(--admin-accent)' : 'var(--admin-text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid var(--admin-border)',
        background: 'var(--admin-bg-secondary)',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <ChevronUp size={10} style={{ opacity: isActive && sortConfig.direction === 'asc' ? 1 : 0.3, marginBottom: -3 }} />
          <ChevronDown size={10} style={{ opacity: isActive && sortConfig.direction === 'desc' ? 1 : 0.3 }} />
        </div>
      </div>
    </th>
  );
}

function ActionDropdown({ student, onView }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 'var(--admin-radius-md)',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'var(--admin-text-tertiary)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
      >
        <MoreHorizontal size={16} />
      </motion.button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: 4,
              background: 'var(--admin-bg-primary)',
              border: '1px solid var(--admin-border)',
              borderRadius: 'var(--admin-radius-md)',
              boxShadow: 'var(--admin-shadow-lg)',
              zIndex: 20,
              minWidth: 160,
              overflow: 'hidden',
            }}
          >
            {[
              { icon: Eye, label: 'View Details', onClick: () => { onView(student); setOpen(false); } },
              { icon: Edit, label: 'Edit Student', onClick: () => setOpen(false) },
              { icon: Trash2, label: 'Delete', color: 'var(--admin-danger)', onClick: () => setOpen(false) },
            ].map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'var(--admin-text-sm)',
                  color: action.color || 'var(--admin-text-secondary)',
                  fontWeight: 500,
                  transition: 'background var(--admin-transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <action.icon size={15} />
                {action.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

export default function StudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const {
    data,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    search,
    handleSearch,
    sortConfig,
    handleSort,
    filters,
    handleFilter,
  } = useTableState(students, {
    searchKeys: ['name', 'email', 'studentId', 'department'],
    pageSize: 6,
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Toolbar */}
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput value={search} onChange={handleSearch} placeholder="Search students..." />
            <FilterSelect
              label="All Statuses"
              value={filters.status}
              onChange={(v) => handleFilter('status', v)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
            <FilterSelect
              label="All Programs"
              value={filters.program}
              onChange={(v) => handleFilter('program', v)}
              options={[
                { value: 'MSc', label: 'MSc' },
                { value: 'PhD', label: 'PhD' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)' }}>
              {totalItems} students
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 'var(--admin-radius-md)',
                border: 'none',
                background: 'var(--admin-accent)',
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'var(--admin-text-sm)',
                fontWeight: 600,
              }}
            >
              <Download size={14} /> Export
            </motion.button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <SortHeader label="Student" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="ID" sortKey="studentId" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Department" sortKey="department" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="Program" sortKey="program" sortConfig={sortConfig} onSort={handleSort} />
                <SortHeader label="GPA" sortKey="gpa" sortConfig={sortConfig} onSort={handleSort} />
                <th style={{ padding: '12px 16px', fontSize: 'var(--admin-text-xs)', fontWeight: 600, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg-secondary)', textAlign: 'left' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', fontSize: 'var(--admin-text-xs)', fontWeight: 600, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg-secondary)', width: 48 }}>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((student, i) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    borderBottom: '1px solid var(--admin-border-subtle)',
                    cursor: 'pointer',
                    transition: 'background var(--admin-transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => setSelectedStudent(student)}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={student.name} size={34} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-primary)' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)' }}>
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-secondary)', fontFamily: 'var(--admin-font-mono)', fontSize: 'var(--admin-text-xs)' }}>
                      {student.studentId}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-secondary)' }}>
                    {student.department}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: 'var(--admin-text-xs)',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 'var(--admin-radius-full)',
                        background: student.program === 'PhD' ? 'var(--admin-accent-subtle)' : 'var(--admin-bg-secondary)',
                        color: student.program === 'PhD' ? 'var(--admin-accent)' : 'var(--admin-text-secondary)',
                      }}
                    >
                      {student.program}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-primary)' }}>
                    {student.gpa}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={student.status} size="sm" />
                  </td>
                  <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                    <ActionDropdown student={student} onView={setSelectedStudent} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--admin-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)' }}>
            Showing {(currentPage - 1) * 6 + 1}-{Math.min(currentPage * 6, totalItems)} of {totalItems}
          </span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </Card>

      {/* Student Detail Modal */}
      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details" width={640}>
        {selectedStudent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar name={selectedStudent.name} size={56} />
              <div>
                <h3 style={{ fontSize: 'var(--admin-text-xl)', fontWeight: 700, margin: '0 0 4px', color: 'var(--admin-text-primary)' }}>
                  {selectedStudent.name}
                </h3>
                <p style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)', margin: 0 }}>
                  {selectedStudent.email}
                </p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <StatusBadge status={selectedStudent.status} size="lg" />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
              }}
            >
              {[
                { label: 'Student ID', value: selectedStudent.studentId },
                { label: 'Department', value: selectedStudent.department },
                { label: 'Program', value: selectedStudent.program },
                { label: 'Year', value: `Year ${selectedStudent.year}` },
                { label: 'GPA', value: selectedStudent.gpa },
                { label: 'Application Date', value: formatDate(selectedStudent.applicationDate) },
                { label: 'Supervisor', value: selectedStudent.supervisor || 'Unassigned' },
              ].map((field) => (
                <div key={field.label} style={{ padding: '12px 0', borderBottom: '1px solid var(--admin-border-subtle)' }}>
                  <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {field.label}
                  </div>
                  <div style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-primary)', fontWeight: 600 }}>
                    {field.value}
                  </div>
                </div>
              ))}
            </div>

            {selectedStudent.researchInterests?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Research Interests
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedStudent.researchInterests.map((interest) => (
                    <span
                      key={interest}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--admin-radius-full)',
                        background: 'var(--admin-accent-subtle)',
                        color: 'var(--admin-accent)',
                        fontSize: 'var(--admin-text-xs)',
                        fontWeight: 600,
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
