/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    authInterrupts: true,
    nodeMiddleware: true,
  },
};

module.exports = nextConfig;
