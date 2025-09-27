export const SiteConfig = {
  title: "MyCryptoPilot",
  description:
    "Copilote de trading crypto intelligent avec analyse temps réel et signaux risk-first",
  prodUrl: "https://mycryptopilot.app",
  appId: "mycryptopilot",
  domain: "mycryptopilot.app",
  appIcon: "/images/icon.png",
  company: {
    name: "MyCryptoPilot SAS",
    address: "421 Rue de Paris, France",
  },
  brand: {
    primary: "#F59E0B", // Amber pour l'univers crypto
    secondary: "#10B981", // Emerald pour le vert (profit)
    danger: "#EF4444", // Red pour les risques
  },
  team: {
    image: "https://mycryptopilot.app/images/team/default.jpg",
    website: "https://mycryptopilot.app",
    twitter: "https://twitter.com/mycryptopilot",
    name: "MyCryptoPilot Team",
  },
  features: {
    /**
     * Activation des fonctionnalités crypto
     */
    enableCryptoPayments: true as boolean,
    enableDiscordBot: true as boolean,
    enableRealTimeSignals: true as boolean,
    enableTradingDashboard: true as boolean,
    /**
     * Si activé, l'utilisateur sera redirigé vers `/dashboard` lors de sa visite sur la page d'accueil
     * La logique est située dans middleware.ts
     */
    enableLandingRedirection: true as boolean,
    /**
     * Configuration des réseaux crypto supportés
     */
    supportedNetworks: ["base", "tron", "polygon", "ethereum"] as const,
    /**
     * Configuration des exchanges supportés
     */
    supportedExchanges: ["binance", "bybit", "okx", "bitget"] as const,
    /**
     * Configuration Discord
     */
    discord: {
      serverId: process.env.DISCORD_SERVER_ID,
      premiumRoleId: process.env.DISCORD_PREMIUM_ROLE_ID,
      ultraRoleId: process.env.DISCORD_ULTRA_ROLE_ID,
      traderRoleId: process.env.DISCORD_TRADER_ROLE_ID,
    },
  },
};
