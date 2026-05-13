import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Send,
  Eye,
} from 'lucide-react';
import { adminApi } from '../api/client';
import { Avatar, StatusBadge, SearchInput, Card, FilterSelect, Skeleton } from '../components/ui';
import { formatDate, timeAgo } from '../utils/helpers';

const priorityColors = {
  high: { bg: 'var(--admin-danger-subtle)', color: 'var(--admin-danger)', label: 'High' },
  medium: { bg: 'var(--admin-warning-subtle)', color: 'var(--admin-warning)', label: 'Medium' },
  low: { bg: 'var(--admin-bg-secondary)', color: 'var(--admin-text-tertiary)', label: 'Low' },
};

const timelineIcons = {
  submitted: { icon: Send, color: 'var(--admin-info)' },
  'under-review': { icon: Eye, color: 'var(--admin-warning)' },
  approved: { icon: CheckCircle2, color: 'var(--admin-success)' },
  rejected: { icon: XCircle, color: 'var(--admin-danger)' },
};

function ApplicationCard({ application, index, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const priority = priorityColors[application.priority] || priorityColors.medium;

  const handleApprove = async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await adminApi.approveApplication(application.id);
      onStatusChange && onStatusChange();
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await adminApi.rejectApplication(application.id);
      onStatusChange && onStatusChange();
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        background: 'var(--admin-bg-primary)',
        borderRadius: 'var(--admin-radius-xl)',
        border: '1px solid var(--admin-border)',
        overflow: 'hidden',
        boxShadow: 'var(--admin-shadow-xs)',
      }}
    >
      {/* Main Content */}
      <div
        style={{ padding: '20px 24px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
            <Avatar name={application.student.name} size={40} />
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                {application.student.name}
              </h3>
              <p style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', margin: '2px 0 0' }}>
                to {application.supervisor.name} / {application.department}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--admin-radius-full)',
                background: priority.bg,
                color: priority.color,
                fontSize: 'var(--admin-text-xs)',
                fontWeight: 600,
              }}
            >
              {priority.label}
            </span>
            <StatusBadge status={application.status} size="sm" />
          </div>
        </div>

        {/* Research Topic */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--admin-radius-md)',
            background: 'var(--admin-bg-secondary)',
            marginBottom: 12,
          }}
        >
          <p style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-secondary)', margin: 0, fontWeight: 500 }}>
            {application.researchTopic}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--admin-text-quaternary)', fontSize: 'var(--admin-text-xs)' }}>
              <Clock size={12} /> {timeAgo(application.submittedAt)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--admin-text-quaternary)', fontSize: 'var(--admin-text-xs)' }}>
              <FileText size={12} /> {application.documents.length} docs
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            style={{ color: 'var(--admin-text-quaternary)' }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--admin-border-subtle)' }}>
              {/* Timeline */}
              <div style={{ paddingTop: 20 }}>
                <h4 style={{ fontSize: 'var(--admin-text-xs)', fontWeight: 600, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
                  Application Timeline
                </h4>
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  {/* Vertical line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 7,
                      top: 4,
                      bottom: 4,
                      width: 2,
                      background: 'var(--admin-border)',
                      borderRadius: 'var(--admin-radius-full)',
                    }}
                  />
                  {application.timeline.map((event, i) => {
                    const tl = timelineIcons[event.status] || timelineIcons.submitted;
                    const Icon = tl.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{
                          display: 'flex',
                          gap: 14,
                          marginBottom: i < application.timeline.length - 1 ? 20 : 0,
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: -24,
                            top: 2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: `${tl.color}20`,
                            border: `2px solid ${tl.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                          }}
                        >
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: tl.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--admin-text-sm)', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 2 }}>
                            {event.note}
                          </div>
                          <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-quaternary)' }}>
                            {formatDate(event.timestamp)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Documents */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 'var(--admin-text-xs)', fontWeight: 600, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
                  Documents
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {application.documents.map(doc => (
                    <span
                      key={doc}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--admin-radius-md)',
                        border: '1px solid var(--admin-border)',
                        fontSize: 'var(--admin-text-xs)',
                        fontWeight: 500,
                        color: 'var(--admin-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <FileText size={12} /> {doc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {application.status === 'pending' || application.status === 'under-review' ? (
                <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--admin-border-subtle)' }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleApprove}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      borderRadius: 'var(--admin-radius-md)',
                      border: 'none',
                      background: 'var(--admin-success)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 'var(--admin-text-sm)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={16} /> {actionLoading ? '...' : 'Approve'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReject}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      borderRadius: 'var(--admin-radius-md)',
                      border: '1px solid var(--admin-danger)',
                      background: 'none',
                      color: 'var(--admin-danger)',
                      fontWeight: 600,
                      fontSize: 'var(--admin-text-sm)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <XCircle size={16} /> {actionLoading ? '...' : 'Reject'}
                  </motion.button>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ApplicationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = () => {
    setLoading(true);
    adminApi.getApplications({ pageSize: '100' })
      .then(res => setAllApplications(res.data || []))
      .catch(() => setAllApplications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApplications(); }, []);

  const filtered = allApplications.filter(app => {
    if (statusFilter && app.status !== statusFilter) return false;
    if (priorityFilter && app.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        app.student.name.toLowerCase().includes(q) ||
        app.supervisor.name.toLowerCase().includes(q) ||
        app.researchTopic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Toolbar */}
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search applications..." />
            <FilterSelect
              label="All Statuses"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'under-review', label: 'Under Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
            <FilterSelect
              label="All Priorities"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
          </div>
          <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)' }}>
            {filtered.length} applications
          </span>
        </div>
      </Card>

      {/* Application Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} style={{ height: 150, borderRadius: 'var(--admin-radius-xl)' }} />)
        ) : filtered.length === 0 ? (
          <Card>
            <p style={{ textAlign: 'center', color: 'var(--admin-text-tertiary)', padding: 20 }}>No applications found</p>
          </Card>
        ) : (
          filtered.map((app, i) => (
            <ApplicationCard key={app.id} application={app} index={i} onStatusChange={fetchApplications} />
          ))
        )}
      </div>
    </div>
  );
}
