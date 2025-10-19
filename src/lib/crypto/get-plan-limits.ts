import { MYCRYPTOPILOT_PLANS, type MyCryptoPilotPlanName } from "./mycryptopilot-plans";

/**
 * Get plan limits for a given plan name
 * @param planName - The plan name (free, pro, ultra)
 * @returns The plan limits object
 */
export function getPlanLimits(planName: MyCryptoPilotPlanName | null | undefined) {
  const normalizedPlanName = (planName ?? "free") as MyCryptoPilotPlanName;
  const plan = MYCRYPTOPILOT_PLANS.find((p) => p.name === normalizedPlanName);

  // Fallback to free plan (always at index 0) if plan not found
  return plan?.limits ?? MYCRYPTOPILOT_PLANS[0].limits;
}
