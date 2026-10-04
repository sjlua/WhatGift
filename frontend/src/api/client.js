const TOKEN_KEY = 'whatgift_token';
const USER_KEY = 'whatgift_user';
const FAMILY_KEY = 'whatgift_family';

// If VITE_API_URL is set, use it; otherwise use the local Vite proxy path '/api'
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    const family = JSON.parse(localStorage.getItem(FAMILY_KEY) || 'null');
    return { token, user, family };
  } catch (e) {
    return { token: null, user: null, family: null };
  }
}

export function saveStoredAuth(token, user, family) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (family) localStorage.setItem(FAMILY_KEY, JSON.stringify(family));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(FAMILY_KEY);
}

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    console.error('API Network Error:', networkError);
    throw new Error(
      'Could not connect to the backend server. Please verify your Python backend is running on port 8100.'
    );
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      clearStoredAuth();
      window.location.reload();
    }
    const message = data?.detail || `Error (${response.status}): Request failed`;
    throw new Error(message);
  }

  return data;
}

// API methods
export const api = {
  // Family
  createFamily: (payload) => apiFetch('/families', { method: 'POST', body: JSON.stringify(payload) }),
  lookupFamily: (code) => apiFetch(`/families/lookup?code=${encodeURIComponent(code)}`),
  getCurrentFamily: () => apiFetch('/families/current'),
  updateFamily: (payload) => apiFetch('/families/current', { method: 'PUT', body: JSON.stringify(payload) }),

  // Auth
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiFetch('/auth/me'),
  updateProfile: (payload) => apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }),

  // Admin
  getMembers: () => apiFetch('/admin/members'),
  createMember: (payload) => apiFetch('/admin/members', { method: 'POST', body: JSON.stringify(payload) }),
  updateMember: (userId, payload) => apiFetch(`/admin/members/${userId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMember: (userId) => apiFetch(`/admin/members/${userId}`, { method: 'DELETE' }),

  // Items
  getUserItems: (userId) => apiFetch(`/users/${userId}/items`),
  createItem: (payload) => apiFetch('/items', { method: 'POST', body: JSON.stringify(payload) }),
  updateItem: (itemId, payload) => apiFetch(`/items/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteItem: (itemId) => apiFetch(`/items/${itemId}`, { method: 'DELETE' }),

  // Claims
  claimItem: (itemId, payload) => apiFetch(`/items/${itemId}/claim`, { method: 'POST', body: JSON.stringify(payload) }),
  updateClaim: (itemId, payload) => apiFetch(`/items/${itemId}/claim`, { method: 'PATCH', body: JSON.stringify(payload) }),
  unclaimItem: (itemId) => apiFetch(`/items/${itemId}/claim`, { method: 'DELETE' }),
};
