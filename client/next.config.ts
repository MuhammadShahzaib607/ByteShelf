const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack root for monorepo: this project lives in client/, so point the
  // application root at the repo root (../). Without this, Turbopack refuses to
  // resolve modules that live outside its detected root and throws workspace
  // root errors. (Next 16 syntax — `experimental.turbo` was removed.)
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

module.exports = nextConfig;