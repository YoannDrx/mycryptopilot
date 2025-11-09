import { BaseSidebarLayout } from "../_navigation/base-sidebar-layout";
import type { PropsWithChildren } from "react";
import { TradingSidebar } from "./_navigation/trading-sidebar";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkUserHasTraderProfile } from "@/features/trader/trader-queries";
import { getAllNavigationLinks } from "../_navigation/navigation-helpers";

/**
 * Trading Layout
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Removed org-based queries
 * - Direct user queries
 * - Simplified allLinks generation
 *
 * Layout pour l'espace Trading avec sidebar dédiée
 * Contient: Dashboard, Signals, Traders, Pricing, Checkout
 * Sidebar conditionnelle selon le rôle (trader ou consumer)
 */
export default async function TradingLayout({ children }: PropsWithChildren) {
  const user = await getRequiredUser();

  // Check if user has trader profile (for conditional TRADER TOOLS section)
  const hasTraderProfile = await checkUserHasTraderProfile(user.id);

  // Get all links for global search (from all 4 spaces)
  const allLinks = getAllNavigationLinks(hasTraderProfile);

  return (
    <BaseSidebarLayout
      sidebar={
        <TradingSidebar
          allLinks={allLinks}
          hasTraderProfile={hasTraderProfile}
        />
      }
    >
      {children}
    </BaseSidebarLayout>
  );
}
