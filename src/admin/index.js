/**
 * Admin Module — Public API
 *
 * Usage in App.jsx:
 *   import { getAdminRoutes, AdminThemeProvider } from './admin';
 */

export { getAdminRoutes } from './routes';
export { AdminThemeProvider, useAdminTheme } from './hooks/useAdminTheme';
