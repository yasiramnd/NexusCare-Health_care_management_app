/**
 * Authenticated API fetch helper for Pharmacy Portal.
 * Automatically attaches the Bearer token from localStorage.
 * Vite proxy forwards /auth, /api, /admin to Flask backend.
 */

let _refreshing = null;

async function tryRefreshToken() {
    const base = import.meta.env.VITE_API_URL || "";
    const refreshToken = localStorage.getItem("ph_refresh_token");
    if (!refreshToken) return false;

    try {
        const res = await fetch(`${base}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.token) {
            localStorage.setItem("ph_access_token", data.token);
            if (data.refresh_token) localStorage.setItem("ph_refresh_token", data.refresh_token);
            return true;
        }
    } catch {
        // refresh failed
    }
    return false;
}

export async function apiFetch(path, options = {}) {
    const base = import.meta.env.VITE_API_URL || "";
    let token = localStorage.getItem("ph_access_token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    let res = await fetch(`${base}${path}`, { ...options, headers });

    // Auto-refresh on 401 (expired token)
    if (res.status === 401 && !path.startsWith("/auth/")) {
        if (!_refreshing) _refreshing = tryRefreshToken();
        const refreshed = await _refreshing;
        _refreshing = null;

        if (refreshed) {
            token = localStorage.getItem("ph_access_token");
            headers.Authorization = `Bearer ${token}`;
            res = await fetch(`${base}${path}`, { ...options, headers });
        }
    }

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
    localStorage.removeItem("ph_refresh_token");
    localStorage.removeItem("ph_role");
    localStorage.removeItem("ph_user_id");
}
