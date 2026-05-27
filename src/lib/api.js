const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

    // словили 401 пробуем обновить токен и повторить запрос
    if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, fetchOptions);
      } else {
        // рефреш тоже сдох разлогиниваем юзера
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return { ok: false, error: 'Сессия истекла, залогинься заново.' };
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
      ? 'Не удалось подключиться к серверу. Проверь соединение.'
      : err.message || 'Что-то пошло не так.';
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
