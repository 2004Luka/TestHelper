const rawBase = import.meta.env.VITE_API_URL || '/api';
const BASE = rawBase.replace(/\/$/, '');

function getHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = localStorage.getItem('teacherToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          'Backend API endpoint not found (404). Please check that VITE_API_URL environment variable is set in Netlify site settings (e.g. https://your-server.onrender.com/api).'
        );
      }
      throw new Error(`Server returned error status ${res.status}: ${res.statusText}`);
    }
    throw new Error('Server returned HTML instead of JSON. Ensure your backend server URL is configured in Netlify environment variables.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

/**
 * Lightweight API client — wraps fetch with JSON handling, auth cookies/tokens, and error normalization.
 */
const api = {
  async get(path) {
    const res = await fetch(`${BASE}${path}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async postForm(path, formData) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: formData,
    });
    return handleResponse(res);
  },

  async patch(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: getHeaders(body ? { 'Content-Type': 'application/json' } : {}),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  async del(path) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },
};

export default api;
