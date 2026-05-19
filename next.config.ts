import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/notifications/:path*",
        destination: `${backendUrl}/notifications/:path*`,
      },
    ];
  },
};

export default nextConfig;
