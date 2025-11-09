import type { SerializableGroup } from "./global-search-command";
import { getTradingNavigationGroups } from "../(trading)/_navigation/trading-links";
import { ACCOUNT_LINKS } from "../(account)/_navigation/account-links";
import { SCHOOL_LINKS } from "../(school)/_navigation/school-links";
import { TAX_LINKS } from "../(tax)/_navigation/tax-links";

/**
 * Navigation Helpers
 *
 * Big Bang (Issue #77) - Adapted for user-centric architecture:
 * - Centralized navigation links generation for global search
 * - Combines links from all 4 spaces: Trading, School, Tax, Account
 * - No slug replacement needed (direct URLs)
 *
 * Used by all layout.tsx files to generate allLinks for GlobalSearchCommand (cmd+k)
 */

/**
 * Get all navigation links from all 4 spaces
 * Used for global search (cmd+k) to show all available pages
 *
 * @param hasTraderProfile - Whether user has trader profile (affects TRADER TOOLS section visibility)
 * @returns Array of navigation groups for all spaces
 */
export function getAllNavigationLinks(
  hasTraderProfile: boolean,
): SerializableGroup[] {
  // Get trading groups (conditional TRADER TOOLS)
  const tradingGroups = getTradingNavigationGroups(hasTraderProfile);

  // Transform NavigationGroup[] to SerializableGroup[]
  const tradingLinks: SerializableGroup[] = tradingGroups.map((group) => ({
    title: `Trading - ${group.title}`,
    links: group.links.map((link) => ({
      href: link.href,
      label: link.label,
    })),
  }));

  // Account links
  const accountLinks: SerializableGroup = {
    title: "Account Settings",
    links: ACCOUNT_LINKS.map((link) => ({
      href: link.href,
      label: link.label,
    })),
  };

  // School links
  const schoolLinks: SerializableGroup = {
    title: "Crypto School",
    links: SCHOOL_LINKS.map((link) => ({
      href: link.href,
      label: link.label,
    })),
  };

  // Tax links
  const taxLinks: SerializableGroup = {
    title: "Tax & Declaration",
    links: TAX_LINKS.map((link) => ({
      href: link.href,
      label: link.label,
    })),
  };

  // Combine all links
  return [...tradingLinks, accountLinks, schoolLinks, taxLinks];
}
