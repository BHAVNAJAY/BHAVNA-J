import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three.js ships modern ESM; let Next transpile the R3F ecosystem consistently.
  transpilePackages: ["three"],
};

export default nextConfig;
