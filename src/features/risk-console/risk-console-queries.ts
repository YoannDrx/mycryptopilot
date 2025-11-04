import { prisma } from "@/lib/prisma";
import type { RiskCalculation } from "@/generated/prisma";

/**
 * Get User Risk Calculations
 *
 * Fetches risk calculations history for a user (excluding presets).
 * Ordered by most recent first.
 *
 * @param userId - The user ID
 * @param limit - Number of calculations to fetch (default: 20)
 * @returns Array of risk calculations
 */
export async function getUserRiskCalculations(
  userId: string,
  limit = 20,
): Promise<RiskCalculation[]> {
  return prisma.riskCalculation.findMany({
    where: {
      userId,
      isPreset: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Get User Risk Presets
 *
 * Fetches saved risk presets for a user.
 * Ordered by most recent first.
 *
 * @param userId - The user ID
 * @returns Array of risk preset calculations
 */
export async function getUserRiskPresets(
  userId: string,
): Promise<RiskCalculation[]> {
  return prisma.riskCalculation.findMany({
    where: {
      userId,
      isPreset: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get Risk Calculation by ID
 *
 * Fetches a specific risk calculation by ID.
 * Verifies ownership before returning.
 *
 * @param calculationId - The calculation ID
 * @param userId - The user ID (for ownership check)
 * @returns Risk calculation or null
 */
export async function getRiskCalculationById(
  calculationId: string,
  userId: string,
): Promise<RiskCalculation | null> {
  return prisma.riskCalculation.findFirst({
    where: {
      id: calculationId,
      userId,
    },
  });
}

/**
 * Count User Risk Calculations
 *
 * Counts total risk calculations for a user (excluding presets).
 *
 * @param userId - The user ID
 * @returns Number of calculations
 */
export async function countUserRiskCalculations(
  userId: string,
): Promise<number> {
  return prisma.riskCalculation.count({
    where: {
      userId,
      isPreset: false,
    },
  });
}
