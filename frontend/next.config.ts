import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Proxy /api/* to the Railway backend so the browser only ever talks to
   * casolisto.online — making auth cookies first-party. Without this proxy,
   * the cross-domain cookie between casolisto.online and *.railway.app gets
   * blocked by browser third-party cookie restrictions.
   *
   * NEXT_PUBLIC_API_URL must be set at build time to the backend's /api
   * origin (e.g. https://caso-listo-production.up.railway.app/api).
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
