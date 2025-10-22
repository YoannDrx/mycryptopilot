import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  checkUserIsActive30Days,
  awardActiveBonus,
} from "@/lib/referral/invitation-tracking-service";

/**
 * Cron Job: Process Active Invitees
 *
 * Ce job doit être exécuté quotidiennement pour:
 * 1. Trouver toutes les invitations acceptées depuis 30+ jours
 * 2. Vérifier si l'invité est encore actif (connecté dans les 7 derniers jours)
 * 3. Award le bonus "active 30 days" au trader (+10 credits)
 * 4. Marquer l'invitation comme inviteeActive = true
 *
 * Recommandation: Exécuter à 2h00 UTC chaque jour via Vercel Cron
 *
 * @example
 * // Dans vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/active-invitees",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function runActiveInviteesJob(): Promise<{
  success: boolean;
  results: {
    checked: number;
    active: number;
    creditsAwarded: number;
    errors: number;
  };
  error?: string;
}> {
  logger.info("=== Starting active invitees cron job ===");

  const results = {
    checked: 0,
    active: 0,
    creditsAwarded: 0,
    errors: 0,
  };

  try {
    // 1. Trouver toutes les invitations acceptées il y a 30+ jours
    // qui n'ont pas encore reçu le bonus active
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const invitations = await prisma.traderInvitation.findMany({
      where: {
        status: "ACCEPTED",
        acceptedAt: {
          lte: thirtyDaysAgo, // Acceptée il y a 30+ jours
        },
        inviteeActive: false, // Bonus pas encore donné
      },
      select: {
        id: true,
        traderId: true,
        email: true,
        acceptedAt: true,
      },
    });

    logger.info(`Found ${invitations.length} invitations to process`);

    // 2. Pour chaque invitation, vérifier si l'invité est actif
    // Note: Sequential processing is intentional for cron job (avoid overload)
    for (const invitation of invitations) {
      results.checked++;

      try {
        // Trouver l'invité via l'email
        // eslint-disable-next-line no-await-in-loop
        const invitee = await prisma.user.findUnique({
          where: { email: invitation.email },
          select: { id: true },
        });

        if (!invitee) {
          logger.warn("Invitee user not found", {
            invitationId: invitation.id,
            email: invitation.email,
          });
          continue;
        }

        // Vérifier si l'invité est actif (30+ jours ET connecté récemment)
        // eslint-disable-next-line no-await-in-loop
        const isActive = await checkUserIsActive30Days(invitee.id);

        if (!isActive) {
          logger.info("Invitee not active yet", {
            invitationId: invitation.id,
            inviteeId: invitee.id,
          });
          continue;
        }

        // Invité actif! Award le bonus au trader
        // eslint-disable-next-line no-await-in-loop
        const bonusResult = await awardActiveBonus(invitation.id, invitee.id);

        if (bonusResult.success) {
          results.active++;
          results.creditsAwarded += bonusResult.creditsAwarded ?? 0;
          logger.info("Active bonus awarded", {
            invitationId: invitation.id,
            traderId: invitation.traderId,
            inviteeId: invitee.id,
            creditsAwarded: bonusResult.creditsAwarded,
          });
        } else {
          results.errors++;
          logger.error("Failed to award active bonus", {
            invitationId: invitation.id,
            error: bonusResult.error,
          });
        }
      } catch (error) {
        results.errors++;
        logger.error("Error processing invitation", {
          invitationId: invitation.id,
          error,
        });
      }
    }

    logger.info("✅ Active invitees job completed successfully", results);

    return {
      success: true,
      results,
    };
  } catch (error) {
    logger.error("❌ Active invitees job failed", { error });
    return {
      success: false,
      results,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
