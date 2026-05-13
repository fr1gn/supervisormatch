import { Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import DashboardPage from '../pages/DashboardPage';
import StudentsPage from '../pages/StudentsPage';
import SupervisorsPage from '../pages/SupervisorsPage';
import ApplicationsPage from '../pages/ApplicationsPage';
import DepartmentsPage from '../pages/DepartmentsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';

/**
 * Admin route tree — mount inside <Routes> in App.jsx.
 *
 * Example:
 *   <Route path="/admin/*" element={<AdminRoutes />} />
 *
 * Or use the helper function below.
 */
export function getAdminRoutes() {
  return (
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="supervisors" element={<SupervisorsPage />} />
      <Route path="applications" element={<ApplicationsPage />} />
      <Route path="departments" element={<DepartmentsPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  );
}
