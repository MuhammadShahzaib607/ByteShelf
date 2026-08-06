import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "") ||
  "http://localhost:8000";

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
  // NOTE: polling is listed FIRST so the connection works even where WebSocket
  // upgrades are blocked (e.g. Vercel / serverless hosts). Socket.io will start
  // with HTTP long-polling and transparently upgrade to WebSocket when possible.
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
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
