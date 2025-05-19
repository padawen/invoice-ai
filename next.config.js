/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  experimental: {},
  images: {
    domains: ['localhost', 'invoice-ai-app.vercel.app'],
  },
};

module.exports = config;
