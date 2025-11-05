/**
 * getUserSubscription: Helper unifié pour récupérer la subscription d'un user
 *
 * Refs: Issue #77 - Refactoring Suppression Organizations
 * RFC: .claude/docs/DEVELOPMENT.md (RFC-001)
 *
 * Ce helper fonctionne en "dual mode" selon le feature flag USER_ACCOUNT_MODE:
 * - Mode legacy (flag OFF): Query Organization.Subscription via Member
 * - Mode nouveau (flag ON): Query UserSubscription directement
 *
 * Usage:
 *   import { getUserSubscription } from '@/lib/subscription/get-user-subscription';
 *
 *   const sub = await getUserSubscription(userId);
 *   console.log(sub.plan); // "free" | "pro" | "ultra"
 */

import { prisma } from "@/lib/prisma";
import { FEATURES } from "@/lib/feature-flags";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * Type retour du helper
 */
export type UserSubscriptionData = {
  plan: MyCryptoPilotPlanName;
  status: string;
  periodEnd: Date | null;
};

/**
 * Récupère la subscription d'un user (dual-mode)
 *
 * @param userId - ID de l'utilisateur
 * @returns Subscription data avec plan, status, periodEnd
 *
 * @example
 * ```ts
 * const sub = await getUserSubscription('user123');
 * if (sub.plan === 'free') {
 *   // User is on free plan
 * }
 * ```
 */
export async function getUserSubscription(
  userId: string,
): Promise<UserSubscriptionData> {
  if (FEATURES.USER_ACCOUNT_MODE) {
    // ============================================
    // MODE NOUVEAU: UserSubscription directe
    // ============================================
    const userSub = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    // Fallback: Si pas de subscription, retourner FREE
    if (!userSub) {
      return {
        plan: "free",
        status: "active",
        periodEnd: null,
      };
    }

    // Vérifier si expiré
    const now = new Date();
    const isExpired = userSub.periodEnd && userSub.periodEnd < now;

    return {
      plan: (isExpired ? "free" : userSub.plan) as MyCryptoPilotPlanName,
      status: isExpired ? "expired" : userSub.status,
      periodEnd: userSub.periodEnd,
    };
  } else {
    // ============================================
    // MODE LEGACY: Organization.Subscription via Member
    // ============================================
    const member = await prisma.member.findFirst({
      where: { userId },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    // Fallback: Si pas d'org ou subscription, retourner FREE
    const sub = member?.organization.subscription;
    if (!sub) {
      return {
        plan: "free",
        status: "active",
        periodEnd: null,
      };
    }

    // Vérifier si expiré
    const now = new Date();
    const isExpired = sub.periodEnd && sub.periodEnd < now;

    return {
      plan: (isExpired ? "free" : sub.plan) as MyCryptoPilotPlanName,
      status: isExpired ? "expired" : (sub.status ?? "active"),
      periodEnd: sub.periodEnd,
    };
  }
}

/**
 * Alias: getPlanForUser (backward compat avec ancien code)
 *
 * @deprecated Use getUserSubscription() instead
 */
export async function getPlanForUser(
  userId: string,
): Promise<MyCryptoPilotPlanName> {
  const sub = await getUserSubscription(userId);
  return sub.plan;
}
