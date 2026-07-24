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
export const getSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;

  if (socket?.connected) return socket;

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

  const token = getAccessToken();
  if (!token) return null;

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
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
