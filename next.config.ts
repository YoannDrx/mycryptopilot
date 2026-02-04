import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
  // Disable Next.js dev indicators in test environment
  // Prevents overlay portal from blocking Playwright click interactions
  devIndicators: process.env.NODE_ENV === "test" ? false : undefined,
};

export default withNextIntl(nextConfig);
