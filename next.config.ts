import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Standalone output produces a minimal self-contained server bundle at
  // .next/standalone — used by the Dockerfile to keep the image small (no
  // node_modules in the final stage).
  output: "standalone",
  // Pin Turbopack to this project root — Pierre has a stray package-lock.json
  // in his home directory that Next would otherwise infer as the workspace.
  turbopack: {
    root: path.resolve("."),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.simpleicons.org" },
      { protocol: "https", hostname: "img.logo.dev" },
    ],
  },
};

export default nextConfig;
