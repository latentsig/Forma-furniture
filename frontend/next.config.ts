import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/collections.html', destination: '/collections', permanent: true },
      { source: '/product.html', destination: '/product', permanent: true },
      { source: '/spaces.html', destination: '/spaces', permanent: true },
      { source: '/craft.html', destination: '/craft', permanent: true },
      { source: '/journal.html', destination: '/journal', permanent: true },
      { source: '/visit.html', destination: '/visit', permanent: true }
    ];
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }];
  }
};

export default nextConfig;
