/**
 * App URLs Helper - Big Bang (Issue #77 Phase 3)
 *
 * User-centric: URLs directes sans organization slug
 *
 * Usage:
 *   import { getAppUrl } from '@/lib/urls/app-urls';
 *
 *   const pricingUrl = getAppUrl('/pricing');
 *   // => "/pricing"
 */

import { SiteConfig } from "@/site-config";

/**
 * Génère une URL pour l'application
 *
 * @param path - Chemin relatif (ex: "/pricing", "/dashboard")
 * @param absolute - Si true, retourne l'URL complète avec domaine
 * @returns URL complète ou relative
 *
 * @example
 * ```ts
 * const url = getAppUrl('/pricing');
 * // => "/pricing"
 *
 * // URL absolue
 * const url = getAppUrl('/pricing', true);
 * // => "https://mycryptopilot.com/pricing"
 * ```
 */
export function getAppUrl(path: string, absolute = false): string {
  if (absolute) {
    return `${SiteConfig.prodUrl}${path}`;
  }

  return path;
}

/**
 * Helper pour les URLs communes de l'app
 *
 * Retourne un objet avec toutes les URLs principales (absolues).
 * Pratique pour passer aux templates email ou Discord embeds.
 *
 * @returns Objet avec toutes les URLs absolues
 */
export function getCommonAppUrls() {
  return {
    dashboard: getAppUrl("/dashboard", true),
    pricing: getAppUrl("/pricing", true),
    traders: getAppUrl("/traders", true),
    account: getAppUrl("/account", true),
    signals: getAppUrl("/dashboard/signals", true),
    exchanges: getAppUrl("/account/exchanges", true),
  };
}
