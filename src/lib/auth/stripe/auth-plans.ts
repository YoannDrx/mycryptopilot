import { logger } from "@/lib/logger";
import {
  Clock,
  FolderArchive,
  HardDrive,
  HeadphonesIcon,
  Shield,
  Users,
  Zap,
} from "lucide-react";

const DEFAULT_LIMIT = {
  projects: 5,
  storage: 10,
  members: 3,
};

export type PlanLimit = typeof DEFAULT_LIMIT;

type HookCtx = {
  req: Request;
  organizationId: string;
  stripeCustomerId: string;
  subscriptionId: string;
};

export type AppAuthPlan = {
  priceId?: string | undefined;
  lookupKey?: string | undefined;
  annualDiscountPriceId?: string | undefined;
  annualDiscountLookupKey?: string | undefined;
  name: string;
  limits?: Record<string, number> | undefined;
  group?: string;
  freeTrial?: {
    days: number;
    onTrialStart?: (subscription: unknown, ctx: HookCtx) => Promise<void>;
    onTrialEnd?: (
      data: {
        subscription: unknown;
      },
      ctx: HookCtx,
    ) => Promise<void>;
    onTrialExpired?: (subscription: unknown, ctx: HookCtx) => Promise<void>;
  };
  onSubscriptionCanceled?: (
    subscription: unknown,
    ctx: HookCtx,
  ) => Promise<void>;
} & {
  description: string;
  isPopular?: boolean;
  price: number;
  yearlyPrice?: number;
  currency: string;
  isHidden?: boolean;
  limits: PlanLimit;
};

export const AUTH_PLANS: AppAuthPlan[] = [
  {
    name: "free",
    description:
      "Perfect for beginners testing crypto signals with essential features",
    limits: DEFAULT_LIMIT,
    price: 0,
    currency: "USD",
    yearlyPrice: 0,
  },
  {
    name: "pro",
    isPopular: true,
    description:
      "Ideal for serious traders with multiple strategies and advanced tools",
    priceId: process.env.STRIPE_PRO_PLAN_ID ?? "",
    annualDiscountPriceId: process.env.STRIPE_PRO_YEARLY_PLAN_ID ?? "",
    limits: {
      projects: 20,
      storage: 50,
      members: 10,
    },
    freeTrial: {
      days: 14,
      onTrialStart: async (subscription) => {
        // Send a welcome email to the user
        logger.debug(`Welcome email sent to ${subscription}`);
      },
      onTrialExpired: async (subscription) => {
        // Handle trial expiration
        logger.debug(`Trial expired for ${subscription}`);
      },
      onTrialEnd: async (subscription) => {
        // Handle trial end
        logger.debug(`Trial ended for ${subscription}`);
      },
    },

    price: 49,
    yearlyPrice: 400,
    currency: "USD",
  },
  {
    name: "ultra",
    isPopular: false,
    description:
      "Professional-grade solution for full-time traders with unlimited access",
    priceId: process.env.STRIPE_ULTRA_PLAN_ID ?? "",
    annualDiscountPriceId: process.env.STRIPE_ULTRA_YEARLY_PLAN_ID ?? "",
    limits: {
      projects: 100,
      storage: 1000,
      members: 100,
    },
    freeTrial: {
      days: 14,
    },
    price: 100,
    yearlyPrice: 1000,
    currency: "USD",
  },
];

// Limits transformation object
export const LIMITS_CONFIG: Record<
  keyof PlanLimit,
  {
    icon: React.ElementType;
    getLabel: (value: number) => string;
    description: string;
  }
> = {
  projects: {
    icon: FolderArchive,
    getLabel: (value: number) =>
      `${value} ${value === 1 ? "Signal" : "Signals"}/day`,
    description: "Trading signals received daily",
  },
  storage: {
    icon: HardDrive,
    getLabel: (value: number) => `${value} Traders to Follow`,
    description: "Follow multiple verified traders",
  },
  members: {
    icon: Users,
    getLabel: (value: number) =>
      `${value === 1 ? "Basic" : value === 3 ? "Standard" : "Premium"} Screener`,
    description: "Market screener refresh rate",
  },
};

// Additional features by plan
export const ADDITIONAL_FEATURES = {
  free: [
    {
      icon: Zap,
      label: "5 Risk Calculations/day",
      description: "Calculate position sizing with 2% rule",
    },
    {
      icon: Shield,
      label: "Blurred Premium Signals",
      description: "See teasers of premium signals",
    },
  ],
  pro: [
    {
      icon: Zap,
      label: "50 Risk Calculations/day",
      description: "Calculate optimal position sizing",
    },
    {
      icon: HeadphonesIcon,
      label: "Trading Journal",
      description: "Track and analyze your trades",
    },
    {
      icon: Clock,
      label: "Priority Support",
      description: "Get help when you need it most",
    },
  ],
  ultra: [
    {
      icon: Zap,
      label: "∞ Unlimited Risk Calculations",
      description: "Calculate position sizing without limits",
    },
    {
      icon: Zap,
      label: "Custom Alerts",
      description: "Set personalized signal notifications",
    },
    {
      icon: Clock,
      label: "Advanced Filters",
      description: "Filter signals by risk, pair, strategy",
    },
  ],
};

export const getPlanLimits = (plan = "free"): PlanLimit => {
  const planLimits = AUTH_PLANS.find((p) => p.name === plan)?.limits;

  return planLimits ?? DEFAULT_LIMIT;
};
