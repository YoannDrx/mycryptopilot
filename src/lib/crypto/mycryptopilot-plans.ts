import { Signal, TrendingUp, Zap, Lock, Clock, BarChart3 } from "lucide-react";

export type MyCryptoPilotPlanName = "free" | "pro" | "ultra";

export type MyCryptoPilotPlan = {
  name: MyCryptoPilotPlanName;
  description: string;
  priceUSD: number;
  priceCrypto: {
    usdc: number; // Price in USDC (Base network)
    usdt: number; // Price in USDT (Tron network)
  };
  limits: {
    signalsPerDay: number;
    tradersFollow: number;
    screenerRefreshSec: number;
    customAlerts: boolean;
    riskConsole: boolean;
    journaling: boolean;
    advancedFilters: boolean; // Funding, OI, correlations
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
    description: "Découvrez les signaux de trading avec accès limité",
    priceUSD: 0,
    priceCrypto: { usdc: 0, usdt: 0 },
    limits: {
      signalsPerDay: 5,
      tradersFollow: 1,
      screenerRefreshSec: 300, // 5min
      customAlerts: false,
      riskConsole: false,
      journaling: false,
      advancedFilters: false,
    },
    features: [
      {
        icon: Lock,
        label: "Teasers de signaux floutés",
        description: "Aperçu des opportunités du marché",
      },
      {
        icon: Signal,
        label: "1 trader à suivre",
        description: "Essayez les signaux d'un trader vérifié",
      },
      {
        icon: Clock,
        label: "Screeners refresh 5min",
        description: "Données marché en différé",
      },
    ],
  },
  {
    name: "pro",
    description: "Signaux temps réel pour traders actifs",
    priceUSD: 49,
    priceCrypto: { usdc: 49, usdt: 49 },
    limits: {
      signalsPerDay: 50,
      tradersFollow: 5,
      screenerRefreshSec: 60, // 1min
      customAlerts: false,
      riskConsole: true,
      journaling: true,
      advancedFilters: false,
    },
    features: [
      {
        icon: Signal,
        label: "Signaux complets en temps réel",
        description: "Accès immédiat aux cartes de trading",
      },
      {
        icon: TrendingUp,
        label: "Jusqu'à 5 traders",
        description: "Diversifiez vos sources de signaux",
      },
      {
        icon: BarChart3,
        label: "Console de risque",
        description: "Calculez vos positions et gérez votre risque",
      },
      {
        icon: Clock,
        label: "Journal de trading",
        description: "Suivez vos performances",
      },
      {
        icon: Zap,
        label: "Screeners refresh 1min",
        description: "Données marché quasi temps réel",
      },
    ],
    isPopular: true,
  },
  {
    name: "ultra",
    description: "Outils pro pour traders exigeants",
    priceUSD: 99,
    priceCrypto: { usdc: 99, usdt: 99 },
    limits: {
      signalsPerDay: 999,
      tradersFollow: 999,
      screenerRefreshSec: 5, // 5sec
      customAlerts: true,
      riskConsole: true,
      journaling: true,
      advancedFilters: true,
    },
    features: [
      {
        icon: Signal,
        label: "Signaux illimités",
        description: "Tous les traders, tous les signaux",
      },
      {
        icon: TrendingUp,
        label: "Traders illimités",
        description: "Suivez autant de traders que vous voulez",
      },
      {
        icon: Zap,
        label: "Alertes personnalisées",
        description: "Créez vos propres conditions d'alerte",
      },
      {
        icon: BarChart3,
        label: "Filtres avancés",
        description: "Funding, OI, corrélations, bêta",
      },
      {
        icon: Clock,
        label: "Screeners refresh 5sec",
        description: "Données marché temps réel",
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
  // Match to closest plan based on price (with 5% tolerance)
  const tolerance = 0.05;

  for (const plan of MYCRYPTOPILOT_PLANS) {
    if (plan.priceUSD === 0) continue;

    const minPrice = plan.priceUSD * (1 - tolerance);
    const maxPrice = plan.priceUSD * (1 + tolerance);

    if (amountUSD >= minPrice && amountUSD <= maxPrice) {
      return plan.name;
    }
  }

  // Default to pro if no match found
  return "pro";
};
