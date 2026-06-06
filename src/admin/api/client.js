/**
 * API Client — connected to the real backend.
 *
 * All admin endpoints are JWT-protected.
 * Token is stored in localStorage as 'admin_token'.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');

/**
 * Base fetch wrapper with auth token handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
    return;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * API methods — connected to real backend endpoints.
 */
export const adminApi = {
  // Auth
  login: (credentials) => request('/admin/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => {
    request('/admin/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  },
  getProfile: () => request('/admin/auth/profile'),

  // Dashboard
  getDashboardStats: () => request('/admin/dashboard/stats'),
  getActivityFeed: (params) => request(`/admin/dashboard/activity${params ? '?' + new URLSearchParams(params) : ''}`),

  // Students
  getStudents: (params) => request(`/admin/students?${new URLSearchParams(params)}`),
  getStudent: (id) => request(`/admin/students/${id}`),
  updateStudent: (id, data) => request(`/admin/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),

  // Supervisors
  getSupervisors: (params) => request(`/admin/supervisors?${new URLSearchParams(params)}`),
  getSupervisor: (id) => request(`/admin/supervisors/${id}`),
  updateSupervisor: (id, data) => request(`/admin/supervisors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Applications
  getApplications: (params) => request(`/admin/applications?${new URLSearchParams(params)}`),
  getApplication: (id) => request(`/admin/applications/${id}`),
  approveApplication: (id, note) => request(`/admin/applications/${id}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
  rejectApplication: (id, reason) => request(`/admin/applications/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Departments
  getDepartments: () => request('/admin/departments'),
  createDepartment: (data) => request('/admin/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id, data) => request(`/admin/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Analytics
  getAnalytics: (params) => request(`/admin/analytics${params ? '?' + new URLSearchParams(params) : ''}`),

  // Notifications
  getNotifications: () => request('/admin/notifications'),
  markAsRead: (id) => request(`/admin/notifications/${id}/read`, { method: 'POST' }),
  markAllAsRead: () => request('/admin/notifications/read-all', { method: 'POST' }),

  // Settings
  getSettings: () => request('/admin/settings'),
  updateSettings: (data) => request('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};
