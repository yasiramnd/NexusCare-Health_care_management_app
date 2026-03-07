/**
 * Authenticated API fetch helper.
 * Automatically attaches the Bearer token from localStorage.
 * In dev, Vite proxy forwards /auth, /api, /admin to Flask.
 */
export async function apiFetch(path, options = {}) {
  const base = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

/** Read the logged-in user_id from localStorage (set at login). */
export function getStoredUserId() {
  return localStorage.getItem("user_id");
}