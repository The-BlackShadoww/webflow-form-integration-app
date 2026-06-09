import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow tunnel hosts to load /_next/webpack-hmr etc. during dev
  allowedDevOrigins: ["p3000.kbtanvir.dev", "*.kbtanvir.dev"],
};

export default nextConfig;
