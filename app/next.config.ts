import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted deploys ship `.next/standalone`: a minimal server plus only the
  // node_modules it actually imports, instead of the whole dependency tree.
  //
  // Not on Vercel though — its builder expects the `.nft.json` trace files that
  // standalone mode does not emit, and the build dies on a missing
  // `next-server.js.nft.json`. Vercel does its own tracing anyway.
  output: process.env.VERCEL ? undefined : "standalone",
  devIndicators: false,
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
