const API_URL = 'http://localhost:4000';

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

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Notice we include credentials: 'include' if we want to send refresh cookies
  // Although the NestJS backend might require it for /auth/refresh, let's include it for auth routes.
  const fetchOptions = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };
  
  // If we ever need to send credentials (cookies), we can uncomment this
  // fetchOptions.credentials = 'include';

  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle 204 No Content
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};
