import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
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
