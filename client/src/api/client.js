const BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Lightweight API client — wraps fetch with JSON handling and error normalization.
 */
const api = {
  async get(path) {
    const res = await fetch(`${BASE}${path}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  async post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  async postForm(path, formData) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      body: formData, // multipart — no Content-Type header (browser sets boundary)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  async patch(path) {
    const res = await fetch(`${BASE}${path}`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  async del(path) {
    const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },
};

export default api;
