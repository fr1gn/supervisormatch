import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, BarChart3, PieChart, Activity } from 'lucide-react';
import { adminApi } from '../api/client';
import { Card, Skeleton } from '../components/ui';

function MetricWidget({ label, value, icon: Icon, change, index }) {
  const isPositive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{
        background: 'var(--admin-bg-primary)',
        borderRadius: 'var(--admin-radius-lg)',
        border: '1px solid var(--admin-border)',
        padding: '20px 24px',
        boxShadow: 'var(--admin-shadow-xs)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)', fontWeight: 500 }}>
          {label}
        </span>
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
      </div>
      <div style={{ fontSize: 'var(--admin-text-2xl)', fontWeight: 800, color: 'var(--admin-text-primary)', marginBottom: 4 }}>
        {value}
      </div>
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isPositive ? <TrendingUp size={14} style={{ color: 'var(--admin-success)' }} /> : <TrendingDown size={14} style={{ color: 'var(--admin-danger)' }} />}
          <span style={{ fontSize: 'var(--admin-text-xs)', fontWeight: 600, color: isPositive ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-quaternary)' }}>vs last period</span>
        </div>
      )}
    </motion.div>
  );
}

function BarChartPlaceholder({ data, label }) {
  const maxVal = Math.max(...data.map(d => d.applications));
  return (
    <Card>
      <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, color: 'var(--admin-text-primary)', margin: '0 0 24px' }}>
        {label}
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, paddingBottom: 32, position: 'relative' }}>
        {data.map((d, i) => (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.approved / maxVal) * 140}px` }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                style={{
                  width: 14,
                  background: 'var(--admin-success)',
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.85,
                }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.rejected / maxVal) * 140}px` }}
                transition={{ delay: i * 0.1 + 0.1, duration: 0.6 }}
                style={{
                  width: 14,
                  background: 'var(--admin-danger)',
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.85,
                }}
              />
            </div>
            <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-quaternary)', position: 'absolute', bottom: 0 }}>
              {d.month}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--admin-success)' }} />
          <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)' }}>Approved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--admin-danger)' }} />
          <span style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)' }}>Rejected</span>
        </div>
      </div>
    </Card>
  );
}

function DepartmentDistribution({ analyticsData }) {
  if (!analyticsData?.departmentDistribution) return null;
  const maxCount = Math.max(...analyticsData.departmentDistribution.map(d => d.count), 1);

  return (
    <Card>
      <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, color: 'var(--admin-text-primary)', margin: '0 0 20px' }}>
        Department Distribution
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {analyticsData.departmentDistribution.map((d, i) => (
          <motion.div
            key={d.department}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
                {d.department}
              </span>
              <span style={{ fontSize: 'var(--admin-text-sm)', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                {d.count} ({d.percentage}%)
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 'var(--admin-radius-full)',
                background: 'var(--admin-bg-tertiary)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.percentage}%` }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: 'var(--admin-radius-full)',
                  background: 'var(--admin-accent)',
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function SupervisorLoadChart({ analyticsData }) {
  if (!analyticsData?.supervisorLoad) return null;
  return (
    <Card>
      <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, color: 'var(--admin-text-primary)', margin: '0 0 20px' }}>
        Supervisor Workload
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {analyticsData.supervisorLoad.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-secondary)', fontWeight: 500, minWidth: 90, textAlign: 'right' }}>
              {s.name}
            </span>
            <div style={{ flex: 1, height: 24, borderRadius: 'var(--admin-radius-sm)', background: 'var(--admin-bg-tertiary)', overflow: 'hidden', position: 'relative' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.load}%` }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                style={{
                  height: '100%',
                  borderRadius: 'var(--admin-radius-sm)',
                  background: s.load >= 100
                    ? 'linear-gradient(90deg, var(--admin-danger), hsl(0, 72%, 48%))'
                    : s.load >= 75
                    ? 'linear-gradient(90deg, var(--admin-warning), hsl(38, 92%, 42%))'
                    : 'linear-gradient(90deg, var(--admin-accent), hsl(var(--admin-accent-h), var(--admin-accent-s), 52%))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 8,
                }}
              >
                <span style={{ fontSize: 'var(--admin-text-xs)', fontWeight: 700, color: '#fff' }}>
                  {Math.round(s.load)}%
                </span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics()
      .then(res => setAnalytics(res.data || null))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} style={{ height: 120, borderRadius: 'var(--admin-radius-lg)' }} />)}
        </div>
      </div>
    );
  }

  const summary = analytics.summary || {};

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricWidget label="Total Applications" value={summary.totalApplications || 0} icon={BarChart3} change={0} index={0} />
        <MetricWidget label="Approval Rate" value={summary.approvalRate || '0%'} icon={Activity} index={1} />
        <MetricWidget label="Pending Review" value={summary.pendingReview || 0} icon={PieChart} index={2} />
        <MetricWidget label="Active Users" value={summary.activeUsers || 0} icon={Users} index={3} />
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {analytics.monthlyApplications && analytics.monthlyApplications.length > 0 && (
          <BarChartPlaceholder data={analytics.monthlyApplications} label="Application Outcomes" />
        )}
        {analytics.departmentDistribution && analytics.departmentDistribution.length > 0 && (
          <DepartmentDistribution analyticsData={analytics} />
        )}
      </div>

      {/* Supervisor Load */}
      {analytics.supervisorLoad && analytics.supervisorLoad.length > 0 && (
        <SupervisorLoadChart analyticsData={analytics} />
      )}
    </div>
  );
}
