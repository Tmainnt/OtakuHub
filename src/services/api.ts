const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers);
  if (!(typeof FormData !== 'undefined' && options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && token && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      window.dispatchEvent(new Event('authchange'));
    }
    const message = await response.text().catch(() => '');
    let error = message || `Request failed (${response.status})`;
    try { error = JSON.parse(message).error || error; } catch {}
    throw new Error(error);
  }

  if (response.status === 204) return null;
  return response.json();
}
