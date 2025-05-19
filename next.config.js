import { NextConfig } from 'next';

const config = {
  output: 'standalone',
  experimental: {},
  images: {
    domains: ['localhost', 'invoice-ai-app.vercel.app'],
  },
} as NextConfig;

export default config;
