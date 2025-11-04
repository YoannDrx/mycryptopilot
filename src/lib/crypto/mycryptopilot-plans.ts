import { Signal, TrendingUp, Zap, Lock, Clock, BarChart3 } from "lucide-react";

export type MyCryptoPilotPlanName = "free" | "pro" | "ultra" | "test";

export type MyCryptoPilotPlan = {
  name: MyCryptoPilotPlanName;
  description: string;
  priceUSD: number;
  priceCrypto: {
    usdc: number; // Price in USDC (Base network)
    usdt: number; // Price in USDT (Tron network)
  };
  limits: {
    activeSignalsLimit: number; // Nombre de signaux actifs suivis simultanément
    tradersFollow: number;
    screenerRefreshSec: number;
    customAlerts: boolean;
    riskConsole: boolean;
    journaling: boolean;
    advancedFilters: boolean; // Funding, OI, correlations
    cryptoSchool: boolean; // Accès à la Crypto School (cours, quiz, progression)
    taxHelp: boolean; // Accès aux outils d'aide fiscale (import CSV, calculs, rapports)
  };
  features: {
    icon: React.ElementType;
    label: string;
    description: string;
  }[];
  isPopular?: boolean;
};

export const MYCRYPTOPILOT_PLANS: MyCryptoPilotPlan[] = [
  {
    name: "free",
    description: "Discover trading signals with limited access",
    priceUSD: 0,
    priceCrypto: { usdc: 0, usdt: 0 },
    limits: {
      activeSignalsLimit: 3, // 3 signaux actifs max suivis
      tradersFollow: 1,
      screenerRefreshSec: 300, // 5min
      customAlerts: false,
      riskConsole: false,
      journaling: false,
      advancedFilters: false,
      cryptoSchool: false, // Pas d'accès Crypto School en Free
      taxHelp: false, // Pas d'accès Tax Help en Free
    },
    features: [
      {
        icon: Lock,
        label: "Blurred signal teasers",
        description: "Preview market opportunities",
      },
      {
        icon: Signal,
        label: "1 trader to follow",
        description: "Try signals from one verified trader",
      },
      {
        icon: Clock,
        label: "Screeners refresh 5min",
        description: "Delayed market data",
      },
    ],
  },
  {
    name: "test",
    description: "Test payment to verify the crypto system",
    priceUSD: 1,
    priceCrypto: { usdc: 1, usdt: 1 },
    limits: {
      activeSignalsLimit: 0,
      tradersFollow: 0,
      screenerRefreshSec: 0,
      customAlerts: false,
      riskConsole: false,
      journaling: false,
      advancedFilters: false,
      cryptoSchool: false,
      taxHelp: false,
    },
    features: [
      {
        icon: Lock,
        label: "Test payment",
        description: "Verify the crypto payment system works",
      },
    ],
  },
  {
    name: "pro",
    description: "Real-time signals for active traders",
    priceUSD: 49,
    priceCrypto: { usdc: 49, usdt: 49 },
    limits: {
      activeSignalsLimit: 15, // 15 signaux actifs max suivis
      tradersFollow: 5,
      screenerRefreshSec: 60, // 1min
      customAlerts: false,
      riskConsole: true,
      journaling: true,
      advancedFilters: false,
      cryptoSchool: true, // Accès Crypto School en Pro
      taxHelp: false, // Pas d'accès Tax Help en Pro (feature Ultra)
    },
    features: [
      {
        icon: Signal,
        label: "Full real-time signals",
        description: "Instant access to trading cards",
      },
      {
        icon: TrendingUp,
        label: "Up to 5 traders",
        description: "Diversify your signal sources",
      },
      {
        icon: BarChart3,
        label: "Risk console",
        description: "Calculate positions and manage risk",
      },
      {
        icon: Clock,
        label: "Trading journal",
        description: "Track your performance",
      },
      {
        icon: Zap,
        label: "Screeners refresh 1min",
        description: "Near real-time market data",
      },
    ],
    isPopular: true,
  },
  {
    name: "ultra",
    description: "Pro tools for demanding traders",
    priceUSD: 99,
    priceCrypto: { usdc: 99, usdt: 99 },
    limits: {
      activeSignalsLimit: 999, // Signaux actifs illimités
      tradersFollow: 999,
      screenerRefreshSec: 5, // 5sec
      customAlerts: true,
      riskConsole: true,
      journaling: true,
      advancedFilters: true,
      cryptoSchool: true, // Accès Crypto School en Ultra
      taxHelp: true, // Accès Tax Help en Ultra (exclusif)
    },
    features: [
      {
        icon: Signal,
        label: "Unlimited signals",
        description: "All traders, all signals",
      },
      {
        icon: TrendingUp,
        label: "Unlimited traders",
        description: "Follow as many traders as you want",
      },
      {
        icon: Zap,
        label: "Custom alerts",
        description: "Create your own alert conditions",
      },
      {
        icon: BarChart3,
        label: "Advanced filters",
        description: "Funding, OI, correlations, beta",
      },
      {
        icon: Clock,
        label: "Screeners refresh 5sec",
        description: "Real-time market data",
      },
    ],
  },
];

export const getPlanByName = (name: string): MyCryptoPilotPlan => {
  return (
    MYCRYPTOPILOT_PLANS.find((p) => p.name === name) ?? MYCRYPTOPILOT_PLANS[0]
  );
};

export const getPlanLimits = (
  plan: MyCryptoPilotPlanName = "free",
): MyCryptoPilotPlan["limits"] => {
  const planData = getPlanByName(plan);
  return planData.limits;
};

/**
 * Check if a user can perform an action based on their plan
 */
export const canPerformAction = (
  plan: MyCryptoPilotPlanName,
  action: keyof MyCryptoPilotPlan["limits"],
): boolean => {
  const limits = getPlanLimits(plan);
  const value = limits[action];

  if (typeof value === "boolean") {
    return value;
  }

  // For numeric values, we just return true if > 0
  // The actual counting/limiting should be done in the business logic
  return value > 0;
};

/**
 * Calculate days granted based on amount paid
 */
export const calculateDaysGranted = (
  amountUSD: number,
  plan: MyCryptoPilotPlanName,
): number => {
  const planData = getPlanByName(plan);
  const baseDays = 30;

  // Test plan grants 0 days (no subscription activation)
  if (plan === "test") {
    return 0;
  }

  if (planData.priceUSD === 0) {
    return 0;
  }

  // Pro-rata: if user pays half the price, they get 15 days
  const ratio = amountUSD / planData.priceUSD;
  return Math.floor(ratio * baseDays);
};

/**
 * Get plan from price amount (useful for payment detection)
 */
export const getPlanFromAmount = (amountUSD: number): MyCryptoPilotPlanName => {
  // Test payment: exactly 1 USD (with small tolerance for crypto precision)
  if (amountUSD >= 0.95 && amountUSD <= 1.05) {
    return "test";
  }

  // Match to closest plan based on price (with 5% tolerance)
  const tolerance = 0.05;

  for (const plan of MYCRYPTOPILOT_PLANS) {
    if (plan.priceUSD === 0 || plan.name === "test") continue;

    const minPrice = plan.priceUSD * (1 - tolerance);
    const maxPrice = plan.priceUSD * (1 + tolerance);

    if (amountUSD >= minPrice && amountUSD <= maxPrice) {
      return plan.name;
    }
  }

  // Default to pro if no match found
  return "pro";
};
