import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Proxy /api/* to the Render backend so the browser only ever talks to
   * the frontend domain — making auth cookies first-party. Without this proxy,
   * the cross-domain cookie between the frontend and the backend gets
   * blocked by browser third-party cookie restrictions.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://caso-listo.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;