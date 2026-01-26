/**
 * API Route: Exchange Snapshot Preview
 *
 * GET /api/exchange/[id]/preview
 *
 * Returns a quick test snapshot for a connection:
 * - Live consolidated balance fetched from the exchange
 * - Full trade history stored in exchange_trade (ordered desc)
 *
 * Security: verifies authenticated user owns the connection.
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { getExchangeConnectionById } from "@/features/exchange/exchange-queries";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import {
  decryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";
import { createExchangeService } from "@/lib/exchange/exchange-service-factory";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const serializeBalance = (balance: Awaited<
  ReturnType<
    ReturnType<typeof createExchangeService>["fetchConsolidatedBalance"]
  >
>) => {
  return {
    timestamp: balance.timestamp.toISOString(),
    totalEquityUsd: balance.totalEquityUsd,
    spot: {
      totalUsd: balance.spot.totalUsd,
      assets: Object.values(balance.spot.assets),
    },
    futures: balance.futures
      ? {
          totalUsd: balance.futures.totalUsd,
          marginUsed: balance.futures.marginUsed,
          marginAvailable: balance.futures.marginAvailable,
          unrealizedPnl: balance.futures.unrealizedPnl,
          assets: Object.values(balance.futures.assets),
        }
      : null,
    margin: balance.margin
      ? {
          totalUsd: balance.margin.totalUsd,
          borrowed: balance.margin.borrowed,
          interest: balance.margin.interest,
          assets: Object.values(balance.margin.assets),
        }
      : null,
  };
};

export const GET = authRoute
  .params(
    z.object({
      id: z.string().cuid(),
    }),
  )
  .handler(async (_req, { params, ctx }) => {
    const userId = ctx.user.id;
    const connectionId = params.id;

    const connection = await getExchangeConnectionById(connectionId);
    if (!connection) {
      throw new ZodRouteError("Connection not found", 404);
    }

    if (connection.trader.userId !== userId) {
      logger.warn("Unauthorized snapshot request", {
        userId,
        connectionId,
      });
      throw new ZodRouteError("Unauthorized", 403);
    }

    logger.info("Fetching exchange snapshot", {
      userId,
      connectionId,
      exchange: connection.exchange,
    });

    const apiKey = decryptApiKey(
      connection.encryptedApiKey,
      connection.keyIv,
      connection.keyTag,
    );

    const secretKey = decryptSerializedPayload(
      connection.encryptedSecretKey,
      connection.keyIv,
      connection.keyTag,
    );

    const passphrase = decryptOptionalSerializedPayload(
      connection.encryptedPassphrase,
      connection.keyIv,
      connection.keyTag,
    );

    const exchangeService = createExchangeService(
      connection.exchange,
      apiKey,
      secretKey,
      {
        passphrase,
        bitgetAccountMode: connection.bitgetAccountMode ?? undefined,
      },
    );

    try {
      const balance = await exchangeService.fetchConsolidatedBalance();
      const trades = await prisma.exchangeTrade.findMany({
        where: { connectionId },
        orderBy: { executedAt: "desc" },
      });

      return {
        balance: serializeBalance(balance),
        trades: trades.map((trade) => ({
          id: trade.id,
          symbol: trade.symbol,
          side: trade.side,
          type: trade.type,
          quantity: Number(trade.quantity),
          price: Number(trade.price),
          quoteQuantity: Number(trade.quoteQuantity),
          fee: Number(trade.fee),
          feeAsset: trade.feeAsset,
          realizedPnl: trade.realizedPnl ? Number(trade.realizedPnl) : null,
          executedAt: trade.executedAt.toISOString(),
        })),
        tradeCount: trades.length,
      };
    } catch (error) {
      logger.error("Failed to build exchange snapshot", {
        connectionId,
        error,
      });
      throw new ZodRouteError(
        error instanceof Error ? error.message : "Failed to fetch exchange data",
        500,
      );
    } finally {
      await exchangeService.close();
    }
  });
