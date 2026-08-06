// ─── ByteShelf — dedicated Socket.io serverless function ───────────────────
// Production Socket.io endpoint, separated from the REST API (server/index.js).
// vercel.json routes /api/socket/(.*) → this function, and the frontend client
// (client/lib/socket.ts) connects with path "/api/socket/socket.io".
//
// IMPORTANT: do NOT call httpServer.listen(). Vercel manages the request
// lifecycle; the http.Server instance is exported as the default export.
import http from "http";
import dotenv from "dotenv";
import { initializeSocket } from "../socket/index.js";

dotenv.config();

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ByteShelf Socket Server Running");
});

// Reuses the same full Socket.io logic (JWT auth, rooms, chat persistence,
// typing, read receipts, presence) as local dev — this serverless entry point
// only adds the dedicated engine path + transport/cors/ping configuration.
// The MongoDB connection is warmed lazily inside the socket auth middleware
// (see socket/index.js → ensureDbConnected) so imports stay side-effect free.
//
// KNOWN SERVERLESS LIMITATION: rooms and the in-memory online-users map live
// per lambda instance. With multiple concurrent instances, presence/broadcasts
// only reach clients pinned to the same instance — the Redis-backed
// @socket.io/vercel-adapter is the fix if multi-instance reliability is needed.
initializeSocket(httpServer, {
  path: "/api/socket/socket.io",
  transports: ["polling", "websocket"],
  cors: {
    origin: [
      // Match ANY *.vercel.app origin — the apex frontend domain AND preview
      // deployments (byte-shelf-frontend-git-*.vercel.app). Previews otherwise
      // get CORS-blocked during long-polling → "xhr poll error" in production.
      // Safe: socket auth uses the JWT in handshake.auth.token, never cookies.
      /^https:\/\/[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.vercel\.app$/,
      process.env.CLIENT_URL,
      "https://byte-shelf-frontend.vercel.app",
      "http://localhost:3000",
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

export default httpServer;
