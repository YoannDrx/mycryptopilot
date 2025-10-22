import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkAndUpgradeTier } from "@/lib/referral/tier-service";

/**
 * Tier Check Job
 *
 * Cron job quotidien qui vérifie et upgrade les tiers de tous les traders
 *
 * Responsabilités:
 * - Récupérer tous les traders avec un traderProfile
 * - Check et upgrade leur tier si nécessaire
 * - Logger les upgrades pour monitoring
 *
 * Execution:
 * - Daily à 3am via Vercel Cron
 * - Route: /api/cron/tier-check
 */

export async function runTierCheckJob(): Promise<{
  success: boolean;
  results: {
    checked: number;
    upgraded: number;
    errors: number;
  };
  error?: string;
}> {
  logger.info("🔄 Starting tier check job");

  const results = {
    checked: 0,
    upgraded: 0,
    errors: 0,
  };

  try {
    // 1. Récupérer tous les traders (users avec traderProfile)
    const traders = await prisma.user.findMany({
      where: {
        traderProfile: {
          isNot: null,
        },
      },
      select: {
        id: true,
        name: true,
        traderProfile: {
          select: {
            displayName: true,
          },
        },
      },
    });

    logger.info("Found traders to check", { count: traders.length });

    if (traders.length === 0) {
      return {
        success: true,
        results,
      };
    }

    // 2. Check et upgrade chaque trader
    for (const trader of traders) {
      results.checked++;

      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await checkAndUpgradeTier(trader.id);

        if (!result.success) {
          logger.error("Failed to check tier", {
            traderId: trader.id,
            error: result.error,
          });
          results.errors++;
          continue;
        }

        if (result.upgraded) {
          results.upgraded++;
          logger.info("✅ Tier upgraded", {
            traderId: trader.id,
            traderName: trader.traderProfile?.displayName ?? trader.name,
            previousTier: result.previousTier,
            newTier: result.newTier,
            activeInvitesCount: result.activeInvitesCount,
          });

          // TODO: Envoyer notification email/Discord au trader
          // TODO: Award tier upgrade rewards (badges, discounts, etc.)
        }
      } catch (error) {
        results.errors++;
        logger.error("Error checking trader tier", {
          traderId: trader.id,
          error,
        });
      }
    }

    logger.info("✅ Tier check job completed", { results });

    return {
      success: true,
      results,
    };
  } catch (error) {
    logger.error("❌ Tier check job failed", { error });
    return {
      success: false,
      results,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
