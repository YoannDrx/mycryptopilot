/**
 * App URLs Helper (Dual-Mode)
 *
 * Refs: Issue #77 - Refactoring Suppression Organizations
 * RFC: .claude/docs/DEVELOPMENT.md (RFC-001)
 *
 * Ce module génère des URLs pour l'application en fonction du feature flag USER_ACCOUNT_MODE:
 * - Mode legacy (flag OFF): URLs avec /orgs/{slug}/path
 * - Mode nouveau (flag ON): URLs directes /path
 *
 * Usage:
 *   import { getAppUrl } from '@/lib/urls/app-urls';
 *
 *   const pricingUrl = await getAppUrl('/pricing', userId);
 *   // Legacy: /orgs/my-org/pricing
 *   // Nouveau: /pricing
 */

import { FEATURES } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { SiteConfig } from "@/site-config";

/**
 * Génère une URL pour l'application (dual-mode)
 *
 * @param path - Chemin relatif (ex: "/pricing", "/dashboard")
 * @param userId - User ID (nécessaire en mode legacy pour récupérer le slug)
 * @param absolute - Si true, retourne l'URL complète avec domaine
 * @returns URL complète ou relative selon le mode
 *
 * @example
 * ```ts
 * // Mode legacy (flag OFF)
 * const url = await getAppUrl('/pricing', 'user123');
 * // => "/orgs/my-org/pricing"
 *
 * // Mode nouveau (flag ON)
 * const url = await getAppUrl('/pricing', 'user123');
 * // => "/pricing"
 *
 * // URL absolue
 * const url = await getAppUrl('/pricing', 'user123', true);
 * // => "https://mycryptopilot.com/pricing"
 * ```
 */
export async function getAppUrl(
  path: string,
  userId?: string,
  absolute = false,
): Promise<string> {
  let relativePath = path;

  if (FEATURES.USER_ACCOUNT_MODE) {
    // ============================================
    // MODE NOUVEAU: URL directe sans orgs
    // ============================================
    relativePath = path;
  } else {
    // ============================================
    // MODE LEGACY: URL avec /orgs/{slug}
    // ============================================
    if (!userId) {
      // Si pas de userId, retourner l'URL sans slug (fallback)
      relativePath = path;
    } else {
      // Récupérer le slug de l'organization de l'utilisateur
      const member = await prisma.member.findFirst({
        where: { userId },
        include: {
          organization: {
            select: { slug: true },
          },
        },
      });

      if (member?.organization.slug) {
        relativePath = `/orgs/${member.organization.slug}${path}`;
      } else {
        // Pas d'organization trouvée, fallback sur URL sans slug
        relativePath = path;
      }
    }
  }

  // Retourner URL absolue ou relative
  if (absolute) {
    return `${SiteConfig.prodUrl}${relativePath}`;
  }

  return relativePath;
}

/**
 * Variante synchrone pour les cas où le slug est déjà connu
 *
 * Utile quand on a déjà récupéré l'organization slug et qu'on ne veut pas
 * faire de query supplémentaire.
 *
 * @param path - Chemin relatif
 * @param orgSlug - Slug de l'organization (ignoré en mode nouveau)
 * @param absolute - Si true, retourne l'URL complète avec domaine
 * @returns URL complète ou relative selon le mode
 *
 * @example
 * ```ts
 * const url = getAppUrlSync('/pricing', 'my-org');
 * // Legacy: "/orgs/my-org/pricing"
 * // Nouveau: "/pricing"
 * ```
 */
export function getAppUrlSync(
  path: string,
  orgSlug?: string,
  absolute = false,
): string {
  let relativePath = path;

  if (FEATURES.USER_ACCOUNT_MODE) {
    // Mode nouveau: URL directe
    relativePath = path;
  } else {
    // Mode legacy: URL avec /orgs/{slug}
    if (orgSlug) {
      relativePath = `/orgs/${orgSlug}${path}`;
    } else {
      relativePath = path;
    }
  }

  if (absolute) {
    return `${SiteConfig.prodUrl}${relativePath}`;
  }

  return relativePath;
}

/**
 * Helper pour les URLs communes de l'app
 *
 * Retourne un objet avec toutes les URLs principales générées selon le mode.
 * Pratique pour passer aux templates email ou Discord embeds.
 *
 * @param userId - User ID
 * @returns Objet avec toutes les URLs
 */
export async function getCommonAppUrls(userId: string) {
  return {
    dashboard: await getAppUrl("/dashboard", userId, true),
    pricing: await getAppUrl("/pricing", userId, true),
    traders: await getAppUrl("/traders", userId, true),
    account: await getAppUrl("/account", userId, true),
    signals: await getAppUrl("/dashboard/signals", userId, true),
    exchanges: await getAppUrl("/account/exchanges", userId, true),
  };
}
