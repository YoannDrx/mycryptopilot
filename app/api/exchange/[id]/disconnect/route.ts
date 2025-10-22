/**
 * API Route: Disconnect Exchange
 *
 * POST /api/exchange/[id]/disconnect
 *
 * Disconnects an exchange connection (soft delete):
 * - Verifies ownership
 * - Sets isActive to false
 * - Keeps historical data (trades remain in DB)
 * - Stops automatic sync scheduling
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/66
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getExchangeConnectionById } from "@/features/exchange/exchange-queries";
import { ZodRouteError } from "@/lib/errors/zod-route-error";

export const POST = authRoute
  .params(
    z.object({
      id: z.string().cuid(),
    }),
  )
  .handler(async (req, { params, ctx }) => {
    const { id: connectionId } = params;
    const userId = ctx.user.id;

    logger.info("Disconnecting exchange connection", {
      userId,
      connectionId,
    });

    // Fetch connection with trader info
    const connection = await getExchangeConnectionById(connectionId);

    if (!connection) {
      throw new ZodRouteError("Connection not found", 404);
    }

    // Verify ownership
    if (connection.trader.userId !== userId) {
      logger.warn("Unauthorized disconnect attempt", {
        userId,
        connectionId,
        ownerId: connection.trader.userId,
      });
      throw new ZodRouteError("Unauthorized", 403);
    }

    // Check if already disconnected
    if (!connection.isActive) {
      return {
        success: true,
        message: `${connection.exchange} connection is already disconnected`,
      };
    }

    // Soft delete: set isActive to false
    await prisma.exchangeConnection.update({
      where: { id: connectionId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    logger.info("Exchange connection disconnected successfully", {
      userId,
      connectionId,
      exchange: connection.exchange,
    });

    return {
      success: true,
      message: `${connection.exchange} disconnected successfully. Historical data preserved.`,
      exchange: connection.exchange,
    };
  });
