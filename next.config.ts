import type { NextConfig } from 'next';

const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:4000';

const nextConfig: NextConfig = {
  // Permitir acceso desde IPs de red local en desarrollo
  allowedDevOrigins: ['10.2.0.2'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
