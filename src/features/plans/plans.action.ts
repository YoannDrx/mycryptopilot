"use server";

/**
 * DEPRECATED: Stripe Plans Action
 * Big Bang (Issue #77 Phase 8)
 *
 * This file contained Stripe-based subscription actions using orgAction.
 * MyCryptoPilot uses crypto payments instead of Stripe.
 *
 * Legacy action: upgradeOrgAction
 * - Used by: pricing-card.tsx (Stripe legacy UI)
 * - Replacement: Crypto checkout flow at /checkout/[plan]
 *
 * This stub prevents TypeScript errors until Phase 10 cleanup.
 */

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { z } from "zod";

/**
 * Stub for upgradeOrgAction
 * Throws error directing users to crypto checkout
 */
export const upgradeOrgAction = authAction
  .inputSchema(
    z.object({
      plan: z.string(),
      annual: z.boolean().default(false),
      successUrl: z.string(),
      cancelUrl: z.string(),
    }),
  )
  .action(async () => {
    throw new ActionError(
      "Stripe subscriptions are deprecated. Please use crypto checkout at /pricing",
    );
  });
