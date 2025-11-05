/**
 * Dual-Mode Organization Cache Helper
 *
 * Refs: Issue #77 - Refactoring Suppression Organizations
 * Phase 5: UI Progressive
 *
 * Ce helper remplace getRequiredCurrentOrgCache() avec support dual-mode:
 * - Mode legacy (flag OFF): Retourne l'organisation réelle via getCurrentOrgCache()
 * - Mode nouveau (flag ON): Retourne un stub organization (pour compatibilité code existant)
 *
 * Usage dans les routes racine (/dashboard, /traders, etc.):
 *   import { getOrgOrStub } from '@/lib/react/org-cache-dual';
 *   const org = await getOrgOrStub();
 */

import { FEATURES } from "@/lib/feature-flags";
import { getRequiredCurrentOrgCache } from "./cache";
import { getRequiredUser } from "../auth/auth-user";
import { generateSlug } from "../format/id";
import type { CurrentOrgPayload } from "../organizations/get-org";

/**
 * Récupère organization (legacy) ou crée un stub (nouveau)
 *
 * Mode legacy: Query Member → Organization (avec subscription)
 * Mode nouveau: Crée un stub basé sur User.planName
 *
 * @returns CurrentOrgPayload (real ou stub selon mode)
 */
export async function getOrgOrStub(): Promise<CurrentOrgPayload> {
  if (FEATURES.USER_ACCOUNT_MODE) {
    // ============================================
    // MODE NOUVEAU: Créer stub organization compatible CurrentOrgPayload
    // ============================================
    const user = await getRequiredUser();

    // Import getUserSubscription pour récupérer le plan
    const { getUserSubscription } = await import(
      "../subscription/get-user-subscription"
    );
    const subscription = await getUserSubscription(user.id);

    // Créer un stub CurrentOrgPayload
    // Note: Certains champs sont stubs/vides car pas pertinents en mode user-centric
    const orgStub: CurrentOrgPayload = {
      id: user.id, // User ID comme org ID
      slug: generateSlug(user.id), // Slug basé sur user ID
      name: user.name || "Personal Account",
      logo: null, // No logo for user account
      metadata: null, // No metadata needed
      user: user, // User from auth
      email: user.email,
      memberRoles: ["owner"], // User is always owner of their account
      subscription:
        subscription.status === "active" || subscription.status === "trialing"
          ? {
              id: `sub_${user.id}`, // Fake subscription ID
              plan: subscription.plan,
              status: subscription.status as "active" | "trialing",
              periodStart: new Date(), // Stub
              periodEnd: subscription.periodEnd,
              cancelAtPeriodEnd: false,
              stripeCustomerId: null, // No Stripe in crypto mode
              stripeSubscriptionId: null,
              referenceId: `ref_${user.id}`, // Fake reference
              seats: 1, // Single user
              limits: {
                projects: 999, // Not relevant for MyCryptoPilot
                storage: 999,
                members: 1,
              },
            }
          : null,
      createdAt: new Date(), // Stub
      stripeCustomerId: null, // No Stripe in crypto mode
      // Fields below are not relevant in user-centric mode but needed for type compat
      members: [], // Empty array (no members concept)
      invitations: [], // Empty array (no invitations)
    };

    return orgStub;
  } else {
    // ============================================
    // MODE LEGACY: Retourner vraie organization
    // ============================================
    return getRequiredCurrentOrgCache();
  }
}
