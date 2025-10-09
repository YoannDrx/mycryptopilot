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
    address: "123 Avenue des Champs-Élysées, 75008 Paris, France",
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
        // Official USDC contract on Base
        contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      },
      tron: {
        name: "Tron",
        currency: "USDT",
        confirmations: 2,
        explorerUrl: "https://tronscan.org",
        // Official USDT TRC-20 contract on Tron
        contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      },
    },
  },
} as const;
