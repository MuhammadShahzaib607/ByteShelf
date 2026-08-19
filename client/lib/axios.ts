import axios from "axios";

// Resolve the API base URL with a robust fallback chain so requests never hit an
// empty or broken endpoint. Priority: NEXT_PUBLIC_API_URL (canonical) →
// NEXT_PUBLIC_API_BASE_URL (legacy) → local dev default.
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/+$/, ""); // trim trailing slashes

// Log once (browser only) so developers can verify where requests are firing.
if (typeof window !== "undefined") {
  console.log(`🌐 API base URL: ${API_BASE_URL}`);
}

// ─── Token helpers ──────────────────────────────────────────────────────────────

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  // Priority 1: byteshelf_access_token (legacy / external)
  const legacy = localStorage.getItem("byteshelf_access_token");
  if (legacy) return legacy;

  // Priority 2: auth_tokens (standard app storage)
  const stored = localStorage.getItem("auth_tokens");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.accessToken) return parsed.accessToken;
    } catch {
      // ignore
    }
  }

  return null;
};

const clearAllTokens = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("byteshelf_access_token");
  localStorage.removeItem("byteshelf_refresh_token");
  localStorage.removeItem("auth_tokens");
};

// ─── Soft redirect event ────────────────────────────────────────────────────────
// Dispatch this custom event when a 401 occurs so React can handle the redirect
// without a hard browser reload.

export const UNAUTHORIZED_EVENT = "byteshelf:unauthorized";

const dispatchUnauthorized = () => {
  if (typeof window === "undefined") return;
  clearAllTokens();
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
};

// ─── Axios Instance ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────────
// Attaches the best available access token from localStorage.
// If no token exists, does NOT attach any auth header — allowing unauthenticated
// requests (e.g. login/signup) to pass through cleanly.

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // If no token, simply don't attach auth header
    }
    // ── Trace every outgoing API call in DevTools ──
    console.log(`🚀 [API Request] ${config.method?.toUpperCase()} -> ${config.url}`, config.data || "");
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────────
// On 401: clears all tokens and dispatches a custom event so React can redirect
// gracefully via router.push() instead of a hard window.location.href reload.

api.interceptors.response.use(
  (response) => {
    // ── Trace every incoming API response in DevTools ──
    console.log(`✅ [API Response] ${response.config.url}:`, response.data);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    console.error(
      `❌ [API Error] ${status || "network"} ${url}:`,
      error.response?.data || error.message
    );

    // ── 401 Unauthorized: clear tokens and dispatch event ──
    if (status === 401) {
      dispatchUnauthorized();
      // Don't redirect here — the AuthProvider listener will handle it
    }

    // ── 503 Service Unavailable (DB cold-start / connection draining) ──
    // Instead of rejecting and crashing the UI, return a soft empty response
    // so dashboard data-fetching hooks degrade gracefully to empty states.
    if (status === 503) {
      console.warn(
        `⚠️ [API] 503 on ${url} — returning soft fallback (server may be cold-starting)`
      );
      return {
        data: { success: false, data: [], message: "Service temporarily unavailable" },
        status: 503,
        statusText: "Service Unavailable",
        headers: error.response?.headers || {},
        config: error.config,
      };
    }

    return Promise.reject(error);
  }
);

export default api;
