import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Proxy /api/* to the Railway backend so the browser only ever talks to
   * casolisto.online — making auth cookies first-party. Without this proxy,
   * the cross-domain cookie between casolisto.online and *.railway.app gets
   * blocked by browser third-party cookie restrictions.
   *
   * The destination is hardcoded because NEXT_PUBLIC_API_URL is not reliably
   * available during Railway's Docker build phase, which would silently
   * produce `undefined/:path*` and break every API call in production.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://caso-listo-production.up.railway.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
