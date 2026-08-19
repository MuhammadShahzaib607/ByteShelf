// ─── Serverless safety polyfill (defensive guard) ───────────────────────────
// pdf.js-based parsers (e.g. pdfjs-dist) expect a global DOMMatrix in Node.
// Vercel's serverless runtime doesn't provide one, which crashed cold starts
// with `ReferenceError: DOMMatrix is not defined`. Current deps (pdf-parse@1.x)
// no longer need it, but this guard is kept as insurance against future
// transitive pdfjs-dist additions.
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
  };
}

import express from "express";
import cors from "cors";
import http from "http"
import { initializeSocket } from "./socket/index.js"
import dotenv from "dotenv"
import { sendRes } from "./utils/responseHandler.js"
import { connectDB, ensureDbConnected } from "./config/db.js"
import authRoute from "./routes/auth.js"
import warehouseRoute from "./routes/warehouse.js"
import shelfRoute from "./routes/shelf.js"
import bookingRoute from "./routes/booking.js"
import notificationRoute from "./routes/notification.js"
import inboundRoute from "./routes/inboundPlan.js"
import cartonRoute from "./routes/carton.js"
import orderRoute from "./routes/order.js"
import conversationRoute from "./routes/conversation.js"
import adminRoute from "./routes/admin.js"
import contactRoute from "./routes/contact.js"
import ownerRoute from "./routes/owner.js"
import dns from 'dns';

if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}

dotenv.config()
const app = express()
const server = http.createServer(app)

// ─── Local dev Socket.io ──────────────────────────────────────────────────────
// In production, Socket.io runs in its own serverless function
// (server/api/socket.js, routed via vercel.json /api/socket/*). For local dev
// we attach the same server on the STANDARD /socket.io/ path, which is what
// the dev client uses (see client/lib/socket.ts → IS_DEV → SOCKET_PATH).
if (process.env.NODE_ENV !== "production") {
  initializeSocket(server, {
    path: "/socket.io/",
    transports: ["polling", "websocket"],
    cors: {
      // Allow ANY localhost port in dev: Next.js may run on 3001+ when 3000 is
      // busy, and a blocked origin here surfaces as a socket "xhr poll error".
      origin: [
        /^https?:\/\/localhost(:\d+)?$/,
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
}

app.use(cors({
    // NOTE: origin must be a single string or an ARRAY — duplicate keys meant
    // only the last one (the Vercel frontend) was applied, silently blocking
    // localhost:3000 and causing CORS "Network Error" on /user/login etc.
    origin: [
        "http://localhost:3000",
        "https://byte-shelf-frontend.vercel.app",
    ],
    credentials: true,
}))
app.use(express.json())

// Establish the cached DB connection on cold start.
// Warm invocations reuse the singleton — no redundant handshakes.
connectDB().catch((err) => {
    console.error("[db] Initial connection failed (will retry on first request):", err.message);
});

// Middleware: ensure the DB connection is alive before every route handler.
// On warm invocations this is a no-op (readyState === 1).
// On cold starts it awaits the connection promise with retries, preventing
// Mongoose command-buffering timeouts.
app.use(async (req, res, next) => {
    try {
        await ensureDbConnected();
        next();
    } catch (err) {
        console.error("[db] Connection guard failed:", err.message);
        // Return a clear, actionable error instead of a generic 503
        return res.status(503).json({
            success: false,
            message: "Database connection unavailable. Please try again.",
            error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
        });
    }
});

app.use("/api/v1/user", authRoute);
app.use("/api/v1/warehouse", warehouseRoute);
app.use("/api/v1/shelf", shelfRoute);
app.use("/api/v1/booking", bookingRoute);
app.use("/api/v1/notification", notificationRoute);
app.use("/api/v1/inbound", inboundRoute);
app.use("/api/v1/carton", cartonRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/conversation", conversationRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/contact", contactRoute);
app.use("/api/v1/owner", ownerRoute);

app.get("/", (req, res) => {
    sendRes(res, 200, true, "API Hit Successfully")
})

app.get("/health-check", (req, res) => {
    sendRes(res, 200, true, "ok")
})

// ─── Global error handler ─────────────────────────────────────────────────
// Catches any error propagated via next(error) (e.g. from malformed JSON
// body parsing) and returns the exact error message + stack instead of a
// generic 500, so the real failure is visible to the client and in logs.
app.use((err, req, res, next) => {
    console.error("DEBUG API ERROR:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Unhandled Internal Server Error",
        error: err.toString(),
        stack: err.stack,
        data: null,
        timeStamps: new Date().toISOString(),
    });
});

if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 8000;
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

export default app;