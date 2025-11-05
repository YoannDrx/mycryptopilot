/**
 * Feature Flags for Organizations → User Refactoring
 *
 * Refs: Issue #77 - Refactoring Suppression Organizations
 * RFC: .claude/docs/DEVELOPMENT.md (RFC-001)
 *
 * These flags control the migration from multi-tenant B2B architecture
 * to pure B2C user-centric architecture.
 *
 * Usage:
 *   import { FEATURES } from '@/lib/feature-flags';
 *
 *   if (FEATURES.USER_ACCOUNT_MODE) {
 *     // New architecture (UserSubscription)
 *   } else {
 *     // Legacy architecture (Organization/Member/Subscription)
 *   }
 */

/**
 * Feature flags configuration
 *
 * Environment variables required:
 * - NEXT_PUBLIC_USER_ACCOUNT_MODE: "true" | "false"
 * - NEXT_PUBLIC_LEGACY_REDIRECTS: "true" | "false"
 */
export const FEATURES = {
  /**
   * USER_ACCOUNT_MODE: Enable new user-centric architecture
   *
   * When true:
   * - Use UserSubscription model (direct User → Subscription)
   * - Routes: /dashboard, /traders, /signals (no /orgs prefix)
   * - Better Auth: Skip organization plugin
   * - Middleware: Simple user validation (no org switching)
   *
   * When false (default):
   * - Use Organization/Member/Subscription (legacy)
   * - Routes: /orgs/[orgSlug]/* (legacy)
   * - Better Auth: Organization plugin active
   * - Middleware: Organization validation + switching
   *
   * Timeline:
   * - Phases 1-6: false (development + testing)
   * - Phase 7: true (production rollout)
   * - Phase 8: Remove flag (permanent true)
   */
  USER_ACCOUNT_MODE: process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE === "true",

  /**
   * LEGACY_ORG_REDIRECTS: Enable 307 redirects from old URLs
   *
   * When true (default):
   * - Redirect /orgs/{slug}/* → new routes (307 temporary)
   * - Preserves old URLs in emails/Discord
   *
   * When false:
   * - No redirects (404 on old URLs)
   * - Only after Phase 8 cleanup
   *
   * Timeline:
   * - Phases 1-6: irrelevant (USER_ACCOUNT_MODE=false)
   * - Phase 7: true (preserve old URLs)
   * - Phase 8: false (cleanup complete)
   */
  LEGACY_ORG_REDIRECTS: process.env.NEXT_PUBLIC_LEGACY_REDIRECTS !== "false",
} as const;

/**
 * Type-safe feature flags
 */
export type FeatureFlags = typeof FEATURES;

/**
 * Helper to check if we're in legacy mode
 */
export const isLegacyMode = () => !FEATURES.USER_ACCOUNT_MODE;

/**
 * Helper to check if we're in new user-centric mode
 */
export const isUserAccountMode = () => FEATURES.USER_ACCOUNT_MODE;

/**
 * Get current architecture mode (for logging/debugging)
 */
export const getArchitectureMode = (): "legacy" | "user-centric" => {
  return FEATURES.USER_ACCOUNT_MODE ? "user-centric" : "legacy";
};
