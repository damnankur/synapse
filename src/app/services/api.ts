const rawApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || 'https://localhost:5173').trim();
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');

export async function apiRequest(path: string, options: RequestInit = {}, token?: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return payload;
}
