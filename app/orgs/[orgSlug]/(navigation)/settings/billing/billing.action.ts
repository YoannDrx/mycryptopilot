"use server";

import { ActionError, orgAction } from "@/lib/actions/safe-actions";
import { hasPermission } from "@/lib/auth/auth-org";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { stripe } from "@/lib/stripe";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { z } from "zod";

export const openStripePortalAction = orgAction
  .metadata({
    permissions: {
      subscription: ["manage"],
    },
  })
  .action(async ({ ctx: { org } }) => {
    const stripeCustomerId = org.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new ActionError("No stripe customer id found");
    }

    if (!(await hasPermission({ subscription: ["manage"] }))) {
      throw new ActionError(
        "You do not have permission to manage subscriptions",
      );
    }

    const stripeBilling = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getServerUrl()}/orgs/${org.slug}/settings/billing`,
    });

    if (!stripeBilling.url) {
      throw new ActionError("Failed to create stripe billing portal session");
    }

    return {
      url: stripeBilling.url,
    };
  });

export const upgradeOrgAction = orgAction
  .metadata({
    permissions: {
      subscription: ["manage"],
    },
  })
  .schema(
    z.object({
      plan: z.string(),
      annual: z.boolean().default(false),
      successUrl: z.string(),
      cancelUrl: z.string(),
    })
  )
  .action(async ({ parsedInput: { plan, annual, successUrl, cancelUrl }, ctx: { org } }) => {
    if (!(await hasPermission({ subscription: ["manage"] }))) {
      throw new ActionError(
        "You do not have permission to manage subscriptions",
      );
    }

    // Find the plan
    const authPlan = AUTH_PLANS.find(p => p.name === plan);
    if (!authPlan) {
      throw new ActionError(`Plan "${plan}" not found`);
    }

    // Get the price ID based on annual or monthly
    const priceId = annual ? authPlan.annualDiscountPriceId : authPlan.priceId;
    if (!priceId) {
      throw new ActionError(`Price ID not found for plan "${plan}"`);
    }

    // Get or create Stripe customer
    let customerId = org.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: org.email ?? undefined,
        name: org.name,
        metadata: {
          organizationId: org.id,
        },
      });
      customerId = customer.id;
      
      // Update organization with the new customer ID
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${getServerUrl()}${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getServerUrl()}${cancelUrl}`,
      metadata: {
        organizationId: org.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          organizationId: org.id,
          plan: plan,
        },
      },
    });

    if (!session.url) {
      throw new ActionError("Failed to create checkout session");
    }

    return {
      url: session.url,
    };
  });

export const cancelOrgSubscriptionAction = orgAction
  .metadata({
    permissions: {
      subscription: ["manage"],
    },
  })
  .schema(
    z.object({
      returnUrl: z.string(),
    })
  )
  .action(async ({ parsedInput: { returnUrl }, ctx: { org } }) => {
    if (!(await hasPermission({ subscription: ["manage"] }))) {
      throw new ActionError(
        "You do not have permission to manage subscriptions",
      );
    }

    const stripeCustomerId = org.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new ActionError("No stripe customer id found");
    }

    // Get the current subscription
    const subscription = await prisma.subscription.findFirst({
      where: { referenceId: org.id },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new ActionError("No active subscription found");
    }

    // Create billing portal session which allows the user to cancel
    const stripeBilling = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getServerUrl()}${returnUrl}`,
    });

    if (!stripeBilling.url) {
      throw new ActionError("Failed to create stripe billing portal session");
    }

    return {
      url: stripeBilling.url,
    };
  });
