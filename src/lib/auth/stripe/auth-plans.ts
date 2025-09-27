import type { Subscription } from "@/generated/prisma";
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
    onTrialStart?: (subscription: Subscription, ctx: HookCtx) => Promise<void>;
    onTrialEnd?: (
      data: {
        subscription: Subscription;
      },
      ctx: HookCtx,
    ) => Promise<void>;
    onTrialExpired?: (
      subscription: Subscription,
      ctx: HookCtx,
    ) => Promise<void>;
  };
  onSubscriptionCanceled?: (
    subscription: Subscription,
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
      "Perfect for getting started in crypto trading with essential features",
    limits: DEFAULT_LIMIT,
    price: 0,
    currency: "EUR",
    yearlyPrice: 0,
  },
  {
    name: "pro",
    isPopular: true,
    description:
      "Ideal for active traders with advanced signals and automated trading",
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

    price: 89,
    yearlyPrice: 899,
    currency: "USD",
  },
  {
    name: "ultra",
    isPopular: false,
    description:
      "Enterprise solution for institutions and professional traders with VIP access",
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
    price: 249,
    yearlyPrice: 2249,
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
      `${value} ${value === 1 ? "Stratégie" : "Stratégies"} de trading`,
    description: "Créez et gérez vos stratégies de trading",
  },
  storage: {
    icon: HardDrive,
    getLabel: (value: number) => `${value} GB de données`,
    description: "Stockage pour vos données et analyses",
  },
  members: {
    icon: Users,
    getLabel: (value: number) =>
      `${value} ${value === 1 ? "Membre" : "Membres"} d'équipe`,
    description: "Invitez des membres pour collaborer",
  },
};

// Additional features by plan
export const ADDITIONAL_FEATURES = {
  free: [
    {
      icon: Shield,
      label: "Sécurité de base",
      description: "Protection standard pour vos données",
    },
  ],
  pro: [
    {
      icon: Zap,
      label: "Signaux Premium",
      description: "Accès aux signaux de trading avancés",
    },
    {
      icon: HeadphonesIcon,
      label: "Support 24/7",
      description: "Assistance continue pour vos trades",
    },
    {
      icon: Clock,
      label: "Analyses en temps réel",
      description: "Analyse technique et fondamentale en direct",
    },
  ],
  ultra: [
    {
      icon: Zap,
      label: "Support VIP",
      description: "Support prioritaire avec account manager dédié",
    },
    {
      icon: Clock,
      label: "API complète",
      description: "Accès API complet pour l'intégration",
    },
    {
      icon: Shield,
      label: "Sécurité renforcée",
      description: "Mesures de sécurité enterprise",
    },
  ],
};

export const getPlanLimits = (plan = "free"): PlanLimit => {
  const planLimits = AUTH_PLANS.find((p) => p.name === plan)?.limits;

  return planLimits ?? DEFAULT_LIMIT;
};
