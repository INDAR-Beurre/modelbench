/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow large file uploads via Server Actions / API Routes
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
