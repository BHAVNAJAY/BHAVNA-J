import type { NextConfig } from "next";

// GitHub Pages: the deploy workflow sets GITHUB_ACTIONS and NEXT_PUBLIC_BASE_PATH ("/BHAVNA-J"),
// which turns the site into a plain static export under that path. Locally nothing changes.
const isPages = process.env.GITHUB_ACTIONS === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three.js ships modern ESM; let Next transpile the R3F ecosystem consistently.
  transpilePackages: ["three"],
  ...(isPages ? { output: "export" as const, trailingSlash: true } : {}),
  basePath,
  images: { unoptimized: isPages },
};

export default nextConfig;
