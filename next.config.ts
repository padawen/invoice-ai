import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
  },
};

export default config;
