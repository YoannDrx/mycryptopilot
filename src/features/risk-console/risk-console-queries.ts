import { prisma } from "@/lib/prisma";
import type { RiskCalculation } from "@/generated/prisma";

/**
 * Serializable RiskCalculation (converts Decimal to number for Client Components)
 */
export type SerializableRiskCalculation = Omit<
  RiskCalculation,
  | "capital"
  | "riskPercent"
  | "entryPrice"
  | "stopLoss"
  | "riskAmount"
  | "positionSize"
  | "contracts"
  | "rrRatio"
> & {
  capital: number;
  riskPercent: number;
  entryPrice: number;
  stopLoss: number;
  riskAmount: number;
  positionSize: number;
  contracts: number;
  rrRatio: number;
};

/**
 * Get User Risk Calculations
 *
 * Fetches risk calculations history for a user (excluding presets).
 * Ordered by most recent first.
 *
 * @param userId - The user ID
 * @param limit - Number of calculations to fetch (default: 20)
 * @returns Array of risk calculations (serializable for Client Components)
 */
export async function getUserRiskCalculations(
  userId: string,
  limit = 20,
): Promise<SerializableRiskCalculation[]> {
  const calculations = await prisma.riskCalculation.findMany({
    where: {
      userId,
      isPreset: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  // Convert Decimal to number for Client Component serialization
  return calculations.map((calc) => ({
    ...calc,
    capital: calc.capital.toNumber(),
    riskPercent: calc.riskPercent.toNumber(),
    entryPrice: calc.entryPrice.toNumber(),
    stopLoss: calc.stopLoss.toNumber(),
    riskAmount: calc.riskAmount.toNumber(),
    positionSize: calc.positionSize.toNumber(),
    contracts: calc.contracts.toNumber(),
    rrRatio: calc.rrRatio.toNumber(),
  }));
}

/**
 * Get User Risk Presets
 *
 * Fetches saved risk presets for a user.
 * Ordered by most recent first.
 *
 * @param userId - The user ID
 * @returns Array of risk preset calculations (serializable for Client Components)
 */
export async function getUserRiskPresets(
  userId: string,
): Promise<SerializableRiskCalculation[]> {
  const presets = await prisma.riskCalculation.findMany({
    where: {
      userId,
      isPreset: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Convert Decimal to number for Client Component serialization
  return presets.map((preset) => ({
    ...preset,
    capital: preset.capital.toNumber(),
    riskPercent: preset.riskPercent.toNumber(),
    entryPrice: preset.entryPrice.toNumber(),
    stopLoss: preset.stopLoss.toNumber(),
    riskAmount: preset.riskAmount.toNumber(),
    positionSize: preset.positionSize.toNumber(),
    contracts: preset.contracts.toNumber(),
    rrRatio: preset.rrRatio.toNumber(),
  }));
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
