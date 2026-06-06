import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  FileText,
  Target,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  UserPlus,
} from 'lucide-react';
import { StatCard, Card, Avatar, StatusBadge, Skeleton } from '../components/ui';
import { adminApi } from '../api/client';
import { timeAgo } from '../utils/helpers';

const iconMap = {
  GraduationCap,
  Users,
  FileText,
  Target,
};

const activityIcons = {
  application: { icon: FileText, color: 'var(--admin-info)' },
  approval: { icon: CheckCircle2, color: 'var(--admin-success)' },
  rejection: { icon: XCircle, color: 'var(--admin-danger)' },
  system: { icon: Zap, color: 'var(--admin-accent)' },
  update: { icon: RefreshCw, color: 'var(--admin-warning)' },
  match: { icon: UserPlus, color: 'var(--admin-success)' },
};

function MiniBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.applications), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map((d, i) => (
        <motion.div
          key={d.month}
          initial={{ height: 0 }}
          animate={{ height: `${(d.applications / maxVal) * 100}%` }}
          transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
          style={{
            flex: 1,
            background: `linear-gradient(to top, var(--admin-accent), hsl(var(--admin-accent-h), var(--admin-accent-s), 72%))`,
            borderRadius: 'var(--admin-radius-xs) var(--admin-radius-xs) 0 0',
            minHeight: 4,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'var(--admin-text-xs)',
              color: 'var(--admin-text-tertiary)',
              fontWeight: 600,
              marginBottom: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {d.applications}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '20px 16px',
        borderRadius: 'var(--admin-radius-lg)',
        border: '1px solid var(--admin-border)',
        background: 'var(--admin-bg-primary)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: 'var(--admin-shadow-xs)',
        transition: 'all var(--admin-transition-base)',
        flex: 1,
        minWidth: 120,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 'var(--admin-radius-lg)',
          background: color === 'accent' ? 'var(--admin-accent-subtle)' :
                     color === 'success' ? 'var(--admin-success-subtle)' :
                     color === 'warning' ? 'var(--admin-warning-subtle)' : 'var(--admin-info-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color === 'accent' ? 'var(--admin-accent)' :
                 color === 'success' ? 'var(--admin-success)' :
                 color === 'warning' ? 'var(--admin-warning)' : 'var(--admin-info)',
        }}
      >
        <Icon size={20} />
      </div>
      <span style={{ fontSize: 'var(--admin-text-sm)', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
        {label}
      </span>
    </motion.button>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState([]);
  const [activity, setActivity] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboardStats().catch(() => ({ data: [] })),
      adminApi.getActivityFeed().catch(() => ({ data: [] })),
      adminApi.getAnalytics().catch(() => ({ data: null })),
    ]).then(([statsRes, activityRes, analyticsRes]) => {
      setStats(statsRes.data || []);
      setActivity(activityRes.data || []);
      setAnalytics(analyticsRes.data || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} style={{ height: 120, borderRadius: 'var(--admin-radius-lg)' }} />)}
        </div>
      </div>
    );
  }

  const weeklyMetrics = analytics?.weeklyMetrics || { newStudents: 0, completedMatches: 0, avgResponseTime: 'N/A', satisfactionScore: 0 };
  const monthlyApplications = analytics?.monthlyApplications || [];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {stats.map((stat, i) => (
          <StatCard
            key={stat.id}
            {...stat}
            icon={iconMap[stat.icon]}
            index={i}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Activity Feed */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
              Recent Activity
            </h3>
            <button
              style={{
                fontSize: 'var(--admin-text-xs)',
                fontWeight: 600,
                color: 'var(--admin-accent)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View All <ArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activity.length === 0 && (
              <p style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-tertiary)', textAlign: 'center', padding: 20 }}>
                No recent activity
              </p>
            )}
            {activity.map((item, i) => {
              const actIcon = activityIcons[item.type] || activityIcons.system;
              const Icon = actIcon.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: i < activity.length - 1 ? '1px solid var(--admin-border-subtle)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--admin-radius-md)',
                      background: `${actIcon.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: actIcon.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--admin-text-sm)', color: 'var(--admin-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{item.user}</span>
                      {' '}{item.action}{' '}
                      <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{item.target}</span>
                    </p>
                    <p style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-quaternary)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {timeAgo(item.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Applications Chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, color: 'var(--admin-text-primary)', margin: 0 }}>
              Applications Overview
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--admin-success)', fontSize: 'var(--admin-text-xs)', fontWeight: 600 }}>
              <TrendingUp size={14} /> Live Data
            </div>
          </div>
          <MiniBarChart data={monthlyApplications} />
          {monthlyApplications.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {monthlyApplications.map(d => (
                <span key={d.month} style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-quaternary)', flex: 1, textAlign: 'center' }}>
                  {d.month}
                </span>
              ))}
            </div>
          )}

          {/* Weekly Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid var(--admin-border-subtle)',
            }}
          >
            {[
              { label: 'Students', value: weeklyMetrics.newStudents },
              { label: 'Matches', value: weeklyMetrics.completedMatches },
              { label: 'Avg Response', value: weeklyMetrics.avgResponseTime },
              { label: 'Satisfaction', value: weeklyMetrics.satisfactionScore + '/5' },
            ].map((m, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--admin-text-xl)', fontWeight: 800, color: 'var(--admin-text-primary)' }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 'var(--admin-text-xs)', color: 'var(--admin-text-tertiary)', fontWeight: 500 }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 style={{ fontSize: 'var(--admin-text-md)', fontWeight: 700, color: 'var(--admin-text-primary)', margin: '0 0 14px' }}>
          Quick Actions
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          <QuickAction icon={UserPlus} label="Add Student" color="accent" index={0} />
          <QuickAction icon={Users} label="Add Supervisor" color="success" index={1} />
          <QuickAction icon={FileText} label="Review Apps" color="warning" index={2} />
          <QuickAction icon={TrendingUp} label="View Reports" color="info" index={3} />
        </div>
      </motion.div>
    </div>
  );
}
