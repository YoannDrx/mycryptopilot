import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  typedRoutes: true,
  serverExternalPackages: [
    "discord.js",
    "@discordjs/ws",
    "@discordjs/rest",
    "@discordjs/builders",
    "zlib-sync",
  ],
  images: {
    // No need to declare remote patterns anymore
    // All external images are automatically proxied through /api/image-proxy
    remotePatterns: [],
  },
};

export default nextConfig;
