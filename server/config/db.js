import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Idempotent MongoDB connection for serverless functions.
 *
 * Vercel lambda instances are ephemeral: they can be cold-started fresh or
 * reused while warm. This module caches the connection at the module level, so
 * warm invocations skip the (expensive) connect handshake entirely and only
 * reconnect after a full disconnect (readyState === 0).
 */
export const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected (serverless-safe cache)");
  }
  return mongoose.connection;
};

/**
 * Connection-cache guard — call before touching any model.
 * No-op when a warm connection already exists.
 */
export const ensureDbConnected = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
};

export default connectDB;
