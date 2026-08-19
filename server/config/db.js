import mongoose from "mongoose";

// ─── Global Cached Mongoose Connection Singleton ─────────────────────────────
// Vercel serverless functions are ephemeral: each cold-start creates a fresh
// Node.js process, but warm invocations REUSE the same process. By caching the
// connection at the module level (globalThis), warm invocations skip the
// expensive connect handshake entirely.
//
// However, frozen serverless lambdas hold onto dead TCP sockets. When a cold
// container wakes up, Mongoose may reuse a dead socket until it times out.
// This module actively detects stale connections and forces reconnection.

let cached = globalThis.__mongooseCache;
if (!cached) {
  cached = globalThis.__mongooseCache = { conn: null, promise: null };
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const READY_POLL_INTERVAL = 100;
const READY_TIMEOUT_MS = 10000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Connection Options (serverless-safe) ─────────────────────────────────────
const CONNECT_OPTS = {
  // Keep bufferCommands: true so Mongoose queues queries during connection
  // establishment instead of throwing immediately.
  bufferCommands: true,

  // Fail fast if the MongoDB server can't be reached (5 s vs default 30 s)
  serverSelectionTimeoutMS: 5000,

  // Close sockets after 45s of inactivity — prevents stale socket accumulation
  // when lambdas freeze and unfreeze.
  socketTimeoutMS: 45000,

  // Connection-level timeout (10 s is enough for Atlas; avoids hanging on
  // unreachable hosts).
  connectTimeoutMS: 10000,

  // Small pool for serverless — cap at 10 concurrent connections.
  maxPoolSize: 10,

  // Allow pool to drop to 0 idle connections so frozen lambdas don't hold
  // open sockets unnecessarily.
  minPoolSize: 0,

  // Keep driver-level connection alive through Lambda freeze cycles.
  heartbeatFrequencyMS: 30000,
};

// ─── Event Listeners: Auto-invalidate cache on connection loss ────────────────
// Attach once (guarded by a flag) so we don't stack duplicate listeners on
// repeated module evaluations.
if (!globalThis.__mongooseListenersAttached) {
  globalThis.__mongooseListenersAttached = true;

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected — clearing cached connection");
    cached.conn = null;
    // Don't clear promise here — let connectDB handle reconnection
  });

  mongoose.connection.on("close", () => {
    console.warn("[db] MongoDB connection closed — clearing cached connection");
    cached.conn = null;
  });

  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB connection error:", err.message);
    // On error, clear the cached connection so the next request retries
    cached.conn = null;
    cached.promise = null;
  });
}

/**
 * Wait for mongoose.connection.readyState to become 1 (connected).
 * Polls at short intervals so we don't miss a fast connection.
 * Throws after READY_TIMEOUT_MS if the connection never becomes ready.
 */
const waitForReady = () =>
  new Promise((resolve, reject) => {
    // Already connected
    if (mongoose.connection.readyState === 1) return resolve();

    const deadline = Date.now() + READY_TIMEOUT_MS;

    const check = () => {
      if (mongoose.connection.readyState === 1) return resolve();
      if (Date.now() >= deadline) {
        return reject(
          new Error(
            `Timed out waiting for MongoDB readyState=1 (current: ${mongoose.connection.readyState})`
          )
        );
      }
      setTimeout(check, READY_POLL_INTERVAL);
    };

    // Also listen for the connected event (faster than polling)
    mongoose.connection.once("connected", resolve);
    check();
  });

/**
 * Detect if the current connection is stale (dead socket from frozen lambda).
 * Returns true if the connection appears to be on a dead socket.
 */
const isConnectionStale = () => {
  if (mongoose.connection.readyState !== 1) return false;

  try {
    // Access the underlying driver to check if the connection pool is usable.
    // If the pool has no connected servers, the socket is dead.
    const pool = mongoose.connection?.client?.topology?.s?.pool;
    if (pool && typeof pool.isConnected === "function" && !pool.isConnected()) {
      console.warn("[db] Detected stale connection (pool not connected)");
      return true;
    }
  } catch {
    // If we can't access the internals, assume it's fine — the query will
    // fail and the error handler will clear the cache.
  }

  return false;
};

/**
 * Establish (or reuse) a cached MongoDB connection.
 * Safe to call multiple times — subsequent calls return the cached promise.
 * Includes retry logic, stale socket detection, and automatic reconnection.
 */
export const connectDB = async (retries = MAX_RETRIES) => {
  // ── Already fully connected — but check for stale sockets ────────────────
  if (mongoose.connection.readyState === 1 && cached.conn) {
    if (!isConnectionStale()) {
      return cached.conn;
    }
    // Stale! Fall through to reconnect
    console.warn("[db] Stale connection detected — forcing reconnection");
    cached.conn = null;
    cached.promise = null;
  }

  // ── Connecting (readyState 2) — await the in-flight promise ─────────────
  if (mongoose.connection.readyState === 2 && cached.promise) {
    try {
      await cached.promise;
      await waitForReady();
      cached.conn = mongoose.connection;
      return cached.conn;
    } catch {
      cached.promise = null;
      cached.conn = null;
    }
  }

  // ── Disconnected / failed / stale — establish new connection with retries ─
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Single connection promise shared across concurrent callers
      if (!cached.promise) {
        cached.promise = mongoose
          .connect(process.env.MONGO_URI, CONNECT_OPTS)
          .then((instance) => {
            console.log("[db] MongoDB connected (serverless-safe singleton)");
            return instance;
          })
          .catch((err) => {
            cached.promise = null;
            console.error("[db] MongoDB connection failed:", err.message);
            throw err;
          });
      }

      await cached.promise;
      // Ensure readyState is truly 1 before returning
      await waitForReady();
      cached.conn = mongoose.connection;

      return cached.conn;
    } catch (err) {
      cached.promise = null;
      cached.conn = null;

      if (attempt < retries) {
        console.warn(
          `[db] Connection attempt ${attempt}/${retries} failed, retrying in ${RETRY_DELAY_MS}ms...`
        );
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error(`[db] All ${retries} connection attempts failed:`, err.message);
        throw err;
      }
    }
  }
};

/**
 * Guard — ensures the DB connection is fully ready (readyState === 1)
 * before any model query runs. Handles all readyState values:
 *   0 = disconnected  → calls connectDB()
 *   1 = connected     → checks for stale sockets, returns if healthy
 *   2 = connecting    → awaits the in-flight connection promise + waitForReady
 *   3 = disconnecting → waits, then reconnects
 *   9 = disconnected  → calls connectDB()
 */
export const ensureDbConnected = async () => {
  const state = mongoose.connection.readyState;

  // Already connected — but check for stale sockets
  if (state === 1) {
    if (!isConnectionStale()) return;
    // Stale — force reconnection
    cached.conn = null;
    cached.promise = null;
  }

  // Connection in progress — await the existing promise + wait for readyState=1
  if (state === 2 && cached.promise) {
    try {
      await cached.promise;
      await waitForReady();
      return;
    } catch {
      // Promise rejected — fall through to create a new connection
    }
  }

  // Disconnected, disconnecting, or uninitialised — establish a fresh connection
  await connectDB();
  // Final safety: wait for readyState to stabilise at 1
  await waitForReady();
};

export default connectDB;
