import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Static export only for production build (manual deploy). In dev, omit so /[id] works for any id.
  ...(process.env.NODE_ENV === "production" ? { output: "export" as const } : {}),
  async redirects() {
    return [
      { source: "/join-meeting/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
