// в проде VITE_API_URL пустой — запросы идут на тот же домен через nginx proxy
// в деве — на localhost:4000
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : '');

// флаги чтобы не спамить рефрешами при нескольких параллельных 401
let isRefreshing = false;
let refreshPromise = null;

function getHeaders() {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// пробуем обновить access токен через httpOnly refresh cookie
async function refreshAccessToken() {
  if (isRefreshing) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.ok && data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const fetchOptions = {
    ...options,
    credentials: 'include',
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  if (isFormData) {
    delete fetchOptions.headers['Content-Type'];
  }

  try {
    let response = await fetch(url, fetchOptions);

    // got 401 — try to refresh the token and retry (skip auth endpoints — they return their own errors)
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, fetchOptions);
      } else {
        // refresh also failed — log the user out
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return { ok: false, error: 'Session expired. Please log in again.' };
      }
    }

    if (response.status === 204) {
      return { ok: true, data: null };
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return { ok: false, error: data?.message || 'API request failed' };
    }

    return { ok: true, data };
  } catch (err) {
    const message = err.message?.includes('fetch')
      ? 'Could not connect to server. Check your connection.'
      : err.message || 'Something went wrong.';
    return { ok: false, error: message };
  }
}

export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  postFormData: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
};
