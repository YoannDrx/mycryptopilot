export const SiteConfig = {
  title: "MyCryptoPilot",
  description:
    "Signaux de trading crypto risk-first. Analyse temps réel, plans explicables, console de risque.",
  prodUrl: "https://mycryptopilot.app",
  appId: "mycryptopilot",
  domain: "mycryptopilot.app",
  appIcon: "/images/icon.png",
  company: {
    name: "MyCryptoPilot",
    address: "", // To be filled according to jurisdiction
  },
  brand: {
    primary: "#F59E0B", // Amber color for crypto theme
  },
  team: {
    image: "/images/team.jpg",
    website: "https://mycryptopilot.app",
    twitter: "https://twitter.com/mycryptopilot",
    name: "MyCryptoPilot Team",
  },
  features: {
    /**
     * Image upload enabled for trader profile pictures and logos
     */
    enableImageUpload: true as boolean,
    /**
     * Keep landing page visible - users need to see pricing and features before signing up
     */
    enableLandingRedirection: false as boolean,
  },
  /**
   * Crypto payment networks configuration
   */
  crypto: {
    networks: {
      base: {
        name: "Base",
        currency: "USDC",
        confirmations: 1,
        explorerUrl: "https://basescan.org",
      },
      tron: {
        name: "Tron",
        currency: "USDT",
        confirmations: 2,
        explorerUrl: "https://tronscan.org",
      },
    },
  },
} as const;
