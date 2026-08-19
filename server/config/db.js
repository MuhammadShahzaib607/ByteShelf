import mongoose from "mongoose";

// ─── Global Cached Mongoose Connection Singleton ─────────────────────────────
// Vercel serverless functions are ephemeral: each cold-start creates a fresh
// Node.js process, but warm invocations REUSE the same process. By caching the
// connection promise at the module level (globalThis), warm invocations skip the
// expensive connect handshake entirely.

let cached = globalThis.__mongooseCache;
if (!cached) {
  cached = globalThis.__mongooseCache = { conn: null, promise: null };
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const READY_POLL_INTERVAL = 100;
const READY_TIMEOUT_MS = 10000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
 * Establish (or reuse) a cached MongoDB connection.
 * Safe to call multiple times — subsequent calls return the cached promise.
 * Includes retry logic for transient cold-start failures.
 */
export const connectDB = async (retries = MAX_RETRIES) => {
  // ── Already fully connected — short-circuit ──────────────────────────────
  if (mongoose.connection.readyState === 1 && cached.conn) {
    return cached.conn;
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

  // ── Disconnected / failed — establish new connection with retries ────────
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const opts = {
        // IMPORTANT: Do NOT set bufferCommands: false.
        // Mongoose default (bufferCommands: true) queues queries while the
        // connection is being established, which is exactly what we want.
        // With bufferCommands: false, any query fired before readyState===1
        // throws immediately — causing the "Database connection unavailable"
        // errors we're fixing.
        //
        // Fail fast if the MongoDB server can't be reached (5 s vs default 30 s)
        serverSelectionTimeoutMS: 5000,
        // Cap the connection pool for serverless.
        maxPoolSize: 10,
        // Keep driver-level connection alive through Lambda freeze cycles.
        heartbeatFrequencyMS: 30000,
      };

      // Single connection promise shared across concurrent callers
      if (!cached.promise) {
        cached.promise = mongoose
          .connect(process.env.MONGO_URI, opts)
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
 *   1 = connected     → no-op (returns immediately)
 *   2 = connecting    → awaits the in-flight connection promise + waitForReady
 *   3 = disconnecting → waits, then reconnects
 *   9 = disconnected  → calls connectDB()
 */
export const ensureDbConnected = async () => {
  const state = mongoose.connection.readyState;

  // Already connected — nothing to do
  if (state === 1) return;

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
