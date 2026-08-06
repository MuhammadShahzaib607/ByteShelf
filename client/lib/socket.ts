import { io, Socket } from "socket.io-client";

// Derive a Socket.io origin from an API base URL by stripping any path segment
// (e.g. /api/v1) down to the bare origin, so the socket always connects to the
// host root. Robust regardless of whether the env URL ends in /api/v1 or not.
const toSocketOrigin = (url: string): string => {
  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
  }
};

// ─── Environment-aware socket config ────────────────────────────────────────
// Local dev connects to the local backend on the STANDARD Socket.io path
// (/socket.io/), while production connects to the dedicated Vercel serverless
// function at the custom routed path (/api/socket/socket.io → api/socket.js).
// Detected via NODE_ENV plus the browser hostname so `next build && next start`
// on localhost also behaves like dev.
const IS_DEV =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"));

const SOCKET_URL = IS_DEV
  ? process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_LOCAL_API_URL
      ? toSocketOrigin(process.env.NEXT_PUBLIC_LOCAL_API_URL)
      : "") ||
    "http://localhost:8000"
  : process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_API_URL
      ? toSocketOrigin(process.env.NEXT_PUBLIC_API_URL)
      : "") ||
    (process.env.NEXT_PUBLIC_API_BASE_URL
      ? toSocketOrigin(process.env.NEXT_PUBLIC_API_BASE_URL)
      : "") ||
    "https://byte-shelf-backend.vercel.app";

const SOCKET_PATH = IS_DEV ? "/socket.io/" : "/api/socket/socket.io";

let socket: Socket | null = null;

/**
 * Returns a singleton Socket.io instance.
 * - If a socket already exists and is connected, returns it.
 * - Otherwise creates a new connection with the JWT token from localStorage.
 */
const getAccessToken = (): string | null => {
  const legacy = localStorage.getItem("byteshelf_access_token");
  if (legacy) return legacy;

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

/**
 * Request a Socket.io connection and return a singleton instance.
 * - **Reconnection-safe:** If the socket exists but is disconnected, it calls
 *   `.connect()` instead of creating a brand-new instance, preserving all
 *   event listeners that the rest of the app has already attached.
 */
export const getSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;

  if (socket?.connected) return socket;

  const token = getAccessToken();
  if (!token) return null;

  // ── Existing socket but disconnected → reconnect it (preserves listeners!) ──
  if (socket) {
    socket.connect();
    return socket;
  }

  // ── First time → create new socket ──
  // Dev: http://localhost:8000/socket.io/ (standard path, served by the local
  // index.js dev guard). Prod: <backend-origin>/api/socket/socket.io (routed
  // by vercel.json to the dedicated api/socket.js serverless function).
  // Polling-first with WebSocket upgrade — long-polling is the fallback.
  socket = io(SOCKET_URL, {
    auth: { token },
    path: SOCKET_PATH,
    transports: ["polling", "websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    // Keep retrying forever so chat recovers automatically after a serverless
    // cold start / lambda swap instead of giving up after N attempts.
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // ── Lifecycle logs for debugging connection issues in DevTools ──
  socket.on("connect", () => {
    console.log("🟢 Socket Connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("🔴 Socket Connection Error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Socket Disconnected:", reason);
  });

  socket.on("receive_message", (msg) => {
    console.log("📩 Socket Message Received:", msg);
  });

  return socket;
};

/**
 * Disconnect and clean up the socket instance.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
