const DEFAULT_PROD_API_BASE = "https://13.60.80.212.nip.io";

function normalizeBase(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const configured = normalizeBase(import.meta.env.VITE_API_BASE_URL);
  if (configured) {
    return configured;
  }

  // Keep local dev proxy behavior unchanged when no base URL is configured.
  if (import.meta.env.DEV) {
    return "";
  }

  return DEFAULT_PROD_API_BASE;
}

export function isUsingFallbackApiBase() {
  return !normalizeBase(import.meta.env.VITE_API_BASE_URL) && !import.meta.env.DEV;
}
