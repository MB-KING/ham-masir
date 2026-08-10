import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "t.me" },
      { protocol: "https", hostname: "telegram.org" },
      { protocol: "https", hostname: "*.telegram.org" },
      { protocol: "https", hostname: "*.telegram-cdn.org" }
    ]
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  outputFileTracingRoot: path.resolve(process.cwd())
};

export default nextConfig;
