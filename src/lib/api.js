const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
  
  const isFormData = options.body instanceof FormData;

  const fetchOptions = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  if (isFormData) {
    delete fetchOptions.headers['Content-Type'];
  }


  try {
    const response = await fetch(url, fetchOptions);

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
      ? 'Unable to connect to the server. Please check your connection and try again.'
      : err.message || 'An unexpected error occurred.';
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
