import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
const baseConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb"
    }
  }
};

export default function nextConfig(phase) {
  return {
    ...baseConfig,
    // Keep dev and prod artifacts isolated so a production build does not
    // invalidate the running dev server's chunk graph.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"
  };
}
