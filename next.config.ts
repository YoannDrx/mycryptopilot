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
  // Disable Next.js dev overlay in test environment
  // Prevents overlay from blocking Playwright interactions
  ...(process.env.NODE_ENV === "test" && {
    devIndicators: {
      buildActivity: false,
      buildActivityPosition: "bottom-right",
    },
  }),
};

export default nextConfig;
