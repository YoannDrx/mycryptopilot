export const SiteConfig = {
  title: "MyCryptoPilot",
  description:
    "Démonstrateur crypto risk-first : données sourcées, clés read-only et simulation sans exécution financière.",
  prodUrl: "https://mycryptopilot.app",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://mycryptopilot.app",
  appId: "mycryptopilot",
  domain: "mycryptopilot.app",
  appIcon: "/images/icon.png",
  company: {
    name: "MyCryptoPilot",
  },
  brand: {
    primary: "#00ffaa", // Emerald color for crypto theme
  },
  team: {
    image: "/images/team.jpg",
    website: "https://mycryptopilot.app",
    supportUrl: "https://mycryptopilot.app/contact",
    name: "MyCryptoPilot Team",
  },
  email: {
    from: process.env.EMAIL_FROM ?? "MyCryptoPilot <mycryptopilot@yodev.fr>",
    contact: process.env.NEXT_PUBLIC_EMAIL_CONTACT ?? "hello@mycryptopilot.app",
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
    // Testnet networks for development (Base Sepolia + Tron Shasta)
    testnet: {
      base: {
        name: "Base Sepolia",
        currency: "USDC",
        confirmations: 1,
        explorerUrl: "https://sepolia.basescan.org",
        // USDC on Base Sepolia testnet
        contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      },
      tron: {
        name: "Tron Shasta",
        currency: "USDT",
        confirmations: 1, // Faster confirmation on testnet
        explorerUrl: "https://shasta.tronscan.org",
        // USDT TRC-20 on Tron Shasta testnet
        contractAddress: "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
      },
    },
  },
} as const;
