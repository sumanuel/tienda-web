import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Permitir acceso desde IPs de red local en desarrollo
  allowedDevOrigins: ['10.2.0.2'],
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
