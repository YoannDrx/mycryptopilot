import { BaseSidebarLayout } from "../_navigation/base-sidebar-layout";
import type { PropsWithChildren } from "react";
import { TradingSidebar } from "./_navigation/trading-sidebar";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkUserHasTraderProfile } from "@/features/trader/trader-queries";
import { getAllNavigationLinks } from "../_navigation/navigation-helpers";
import { prisma } from "@/lib/prisma";
import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * Trading Layout
 *
 * Issue #81 - Réorganisation sidebar Trading:
 * - Nouvelle structure par intention (MY FEED, DISCOVER, MY TRADING, PUBLISH, INSIGHTS & GROWTH)
 * - Badges dynamiques selon plan utilisateur
 * - Compteur de signaux actifs suivis
 * - État des sections persiste dans localStorage
 *
 * Layout pour l'espace Trading avec sidebar dédiée
 * Contient: Dashboard, Signals, Traders, Pricing, Checkout
 * Sidebar conditionnelle selon le rôle (trader ou consumer)
 */
export default async function TradingLayout({ children }: PropsWithChildren) {
  const user = await getRequiredUser();

  // Check if user has trader profile (for conditional PUBLISH section)
  const hasTraderProfile = await checkUserHasTraderProfile(user.id);

  // Get user plan for badges
  const userPlan = (user.planName ?? "free") as MyCryptoPilotPlanName;

  // Count active signals followed (for badge on Dashboard)
  const activeSignalsCount = await prisma.follow.count({
    where: {
      userId: user.id,
    },
  });

  // Get all links for global search (from all 4 spaces)
  const allLinks = getAllNavigationLinks(hasTraderProfile);

  return (
    <BaseSidebarLayout
      sidebar={
        <TradingSidebar
          allLinks={allLinks}
          hasTraderProfile={hasTraderProfile}
          activeSignalsCount={activeSignalsCount}
          userPlan={userPlan}
        />
      }
    >
      {children}
    </BaseSidebarLayout>
  );
}
