import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  experimental: {},
  images: {
    domains: ['localhost', 'invoice-ai-app.vercel.app'],
  },
};

export default config;
