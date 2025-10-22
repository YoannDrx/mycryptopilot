import type { MyCryptoPilotPlanName } from "@/lib/crypto/mycryptopilot-plans";

/**
 * Exchange connection limits by plan
 *
 * FREE: 0 connections (blocked - upsell to Pro)
 * PRO: 1 connection (Binance)
 * ULTRA: 3 connections (Binance + future exchanges)
 */
export const EXCHANGE_CONNECTION_LIMITS: Record<MyCryptoPilotPlanName, number> =
  {
    free: 0,
    pro: 1,
    ultra: 3,
  };

/**
 * Sync interval by plan (in minutes)
 *
 * PRO: 5 minutes
 * ULTRA: 1 minute
 */
export const SYNC_INTERVAL_MINUTES: Record<MyCryptoPilotPlanName, number> = {
  free: 0, // N/A
  pro: 5,
  ultra: 1,
};

/**
 * Get exchange connection limit for a plan
 *
 * @param planName - The plan name
 * @returns Max number of connections allowed
 */
export function getExchangeConnectionLimit(
  planName: string | null | undefined,
): number {
  const normalizedPlan = (
    planName ? planName.toLowerCase() : "free"
  ) as MyCryptoPilotPlanName;
  return EXCHANGE_CONNECTION_LIMITS[normalizedPlan];
}

/**
 * Get sync interval for a plan
 *
 * @param planName - The plan name
 * @returns Sync interval in minutes
 */
export function getSyncInterval(planName: string | null | undefined): number {
  const normalizedPlan = (
    planName ? planName.toLowerCase() : "free"
  ) as MyCryptoPilotPlanName;
  return SYNC_INTERVAL_MINUTES[normalizedPlan];
}

/**
 * Calculate next sync time based on plan
 *
 * @param planName - The plan name
 * @returns Date of next sync or null if no sync allowed
 */
export function calculateNextSyncAt(
  planName: string | null | undefined,
): Date | null {
  const intervalMinutes = getSyncInterval(planName);

  if (intervalMinutes === 0) {
    return null;
  }

  return new Date(Date.now() + intervalMinutes * 60 * 1000);
}
