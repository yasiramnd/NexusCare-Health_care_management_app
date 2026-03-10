/**
 * Authenticated API fetch helper for Pharmacy Portal.
 * Automatically attaches the Bearer token from localStorage.
 * Vite proxy forwards /auth, /api, /admin to Flask backend.
 */
export async function apiFetch(path, options = {}) {
    const base = import.meta.env.VITE_API_URL || "";
    const token = localStorage.getItem("ph_access_token");

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

export function getStoredUserId() {
    return localStorage.getItem("ph_user_id");
}

export function getStoredRole() {
    return localStorage.getItem("ph_role");
}

export function isPharmacyLoggedIn() {
    const token = localStorage.getItem("ph_access_token");
    const role = localStorage.getItem("ph_role");
    return !!(token && role === "PHARMACY");
}

export function pharmacyLogout() {
    localStorage.removeItem("ph_access_token");
    localStorage.removeItem("ph_role");
    localStorage.removeItem("ph_user_id");
}
