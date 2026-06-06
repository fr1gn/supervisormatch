import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useSidebar } from '../hooks/useSidebar';

const pageTitles = {
  '/admin': { title: 'Dashboard', subtitle: 'Overview of your platform' },
  '/admin/students': { title: 'Students', subtitle: 'Manage student records' },
  '/admin/supervisors': { title: 'Supervisors', subtitle: 'Manage supervisor profiles' },
  '/admin/applications': { title: 'Applications', subtitle: 'Review and manage applications' },
  '/admin/departments': { title: 'Departments', subtitle: 'Manage academic departments' },
  '/admin/analytics': { title: 'Analytics', subtitle: 'Platform insights and metrics' },
  '/admin/notifications': { title: 'Notifications', subtitle: 'System notifications' },
  '/admin/settings': { title: 'Settings', subtitle: 'System configuration' },
};

export default function AdminLayout() {
  const { isOpen, isMobile, isCollapsed, toggle, close } = useSidebar();
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: 'Admin', subtitle: '' };

  return (
    <div className="admin-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        isOpen={isOpen}
        isMobile={isMobile}
        isCollapsed={isCollapsed}
        toggle={toggle}
        close={close}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <Header
          isMobile={isMobile}
          onMenuClick={toggle}
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
        />
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? 16 : 24,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
