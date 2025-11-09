/**
 * getUserSubscription: Helper pour récupérer la subscription d'un user
 *
 * Refs: Issue #77 - Refactoring Suppression Organizations (Big Bang Phase 3)
 *
 * User-centric: Query UserSubscription directement
 *
 * Usage:
 *   import { getUserSubscription } from '@/lib/subscription/get-user-subscription';
 *
 *   const sub = await getUserSubscription(userId);
 *   console.log(sub.plan); // "free" | "pro" | "ultra"
 */

import { prisma } from "@/lib/prisma";
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
 * Récupère la subscription d'un user
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
