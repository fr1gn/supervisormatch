import { useState, useEffect } from 'react';
import { Route, Navigate, useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdminLoginPage from '../pages/AdminLoginPage';
import DashboardPage from '../pages/DashboardPage';
import StudentsPage from '../pages/StudentsPage';
import SupervisorsPage from '../pages/SupervisorsPage';
import ApplicationsPage from '../pages/ApplicationsPage';
import DepartmentsPage from '../pages/DepartmentsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';

function AdminAuthGate({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function AdminLoginRoute() {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  // If already logged in, redirect to admin dashboard
  if (token) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = () => {
    navigate('/admin', { replace: true });
  };

  return <AdminLoginPage onLogin={handleLogin} />;
}

/**
 * Admin route tree — mount inside <Routes> in App.jsx.
 */
export function getAdminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<AdminLoginRoute />} />
      <Route
        path="/admin"
        element={
          <AdminAuthGate>
            <AdminLayout />
          </AdminAuthGate>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="supervisors" element={<SupervisorsPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </>
  );
}
