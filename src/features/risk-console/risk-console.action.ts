"use server";

import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

/**
 * Schema for saving risk calculation
 */
const SaveRiskCalculationSchema = z.object({
  // Inputs
  capital: z.number().positive(),
  riskPercent: z.number().min(0.5).max(5),
  entryPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  positionType: z.enum(["LONG", "SHORT"]),
  takeProfits: z.array(
    z.object({
      price: z.number().positive(),
      allocation: z.number().min(0).max(100),
      label: z.string().optional(),
    }),
  ),

  // Outputs
  riskAmount: z.number(),
  positionSize: z.number(),
  contracts: z.number(),
  rrRatio: z.number(),

  // Metadata
  symbol: z.string().optional(),
  notes: z.string().optional(),
  isPreset: z.boolean().default(false),
  presetName: z.string().optional(),
});

export type SaveRiskCalculationType = z.infer<typeof SaveRiskCalculationSchema>;

/**
 * Save Risk Calculation Action
 *
 * Saves a risk calculation to the database for history/presets.
 * Used by Risk Console to track past calculations.
 *
 * @param input - Calculation data to save
 * @returns Saved calculation or error
 */
export async function saveRiskCalculationAction(
  input: SaveRiskCalculationType,
) {
  try {
    const user = await getRequiredUser();

    // Validate input
    const validation = SaveRiskCalculationSchema.safeParse(input);
    if (!validation.success) {
      logger.error("Invalid risk calculation input", {
        userId: user.id,
        errors: validation.error.issues,
      });
      return {
        success: false,
        error: "Invalid calculation data",
      };
    }

    const data = validation.data;

    // Save calculation
    const calculation = await prisma.riskCalculation.create({
      data: {
        userId: user.id,
        capital: data.capital,
        riskPercent: data.riskPercent,
        entryPrice: data.entryPrice,
        stopLoss: data.stopLoss,
        positionType: data.positionType,
        takeProfits: data.takeProfits,
        riskAmount: data.riskAmount,
        positionSize: data.positionSize,
        contracts: data.contracts,
        rrRatio: data.rrRatio,
        symbol: data.symbol,
        notes: data.notes,
        isPreset: data.isPreset,
        presetName: data.presetName,
      },
    });

    logger.info("Risk calculation saved", {
      userId: user.id,
      calculationId: calculation.id,
      isPreset: data.isPreset,
      symbol: data.symbol,
    });

    return {
      success: true,
      calculation: {
        id: calculation.id,
        createdAt: calculation.createdAt,
        isPreset: calculation.isPreset,
        presetName: calculation.presetName,
      },
    };
  } catch (error) {
    logger.error("Failed to save risk calculation", { error });
    return {
      success: false,
      error: "Failed to save calculation",
    };
  }
}

/**
 * Delete Risk Calculation Action
 *
 * Deletes a risk calculation from the database.
 *
 * @param calculationId - ID of calculation to delete
 * @returns Success status or error
 */
export async function deleteRiskCalculationAction(calculationId: string) {
  try {
    const user = await getRequiredUser();

    // Verify ownership
    const calculation = await prisma.riskCalculation.findUnique({
      where: { id: calculationId },
      select: { userId: true },
    });

    if (!calculation) {
      return {
        success: false,
        error: "Calculation not found",
      };
    }

    if (calculation.userId !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Delete calculation
    await prisma.riskCalculation.delete({
      where: { id: calculationId },
    });

    logger.info("Risk calculation deleted", {
      userId: user.id,
      calculationId,
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Failed to delete risk calculation", { error });
    return {
      success: false,
      error: "Failed to delete calculation",
    };
  }
}
