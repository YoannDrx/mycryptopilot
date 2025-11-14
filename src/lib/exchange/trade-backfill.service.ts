import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto/encryption-service";
import { createExchangeService } from "./exchange-service-factory";
import { logger } from "@/lib/logger";
import type { Exchange } from "@/generated/prisma";
import { Prisma } from "@/generated/prisma";

export type BackfillOptions = {
  days?: number;
  dryRun?: boolean;
};

export type BackfillSummary = {
  traderProfileId: string;
  exchange: Exchange;
  tradesFetched: number;
  tradesUpserted: number;
  dryRun: boolean;
};

export async function backfillTraderTrades(
  traderProfileId: string,
  options: BackfillOptions = {},
): Promise<BackfillSummary> {
  const days = options.days ?? 365;
  const dryRun = options.dryRun ?? false;

  const connection = await prisma.exchangeConnection.findFirst({
    where: {
      traderProfileId,
      isActive: true,
    },
  });

  if (!connection) {
    throw new Error(
      `No active exchange connection found for trader ${traderProfileId}`,
    );
  }

  const apiKey = decryptApiKey(
    connection.encryptedApiKey,
    connection.keyIv,
    connection.keyTag,
  );

  const secretKey = decryptApiKey(
    connection.encryptedSecretKey,
    connection.keyIv,
    connection.keyTag,
  );

  const adapter = createExchangeService(connection.exchange, apiKey, secretKey);

  try {
    logger.info("Fetching historical trades from exchange", {
      traderProfileId,
      exchange: connection.exchange,
      days,
    });

    const trades = await adapter.fetchRecentTrades(days);

    logger.info("Trades fetched", {
      traderProfileId,
      total: trades.length,
    });

    let upserted = 0;

    if (!dryRun) {
      for (const trade of trades) {
        if (!trade.externalOrderId) {
          continue;
        }

        await prisma.exchangeTrade.upsert({
          where: {
            externalOrderId: trade.externalOrderId,
          },
          update: {
            symbol: trade.symbol,
            side: trade.side,
            type: trade.type,
            quantity: new Prisma.Decimal(trade.quantity ?? 0),
            price: new Prisma.Decimal(trade.price ?? 0),
            quoteQuantity: new Prisma.Decimal(trade.quoteQuantity ?? 0),
            fee: new Prisma.Decimal(trade.fee ?? 0),
            feeAsset: trade.feeAsset ?? "USDT",
            realizedPnl: trade.realizedPnl
              ? new Prisma.Decimal(trade.realizedPnl)
              : null,
            executedAt: trade.executedAt,
          },
          create: {
            connectionId: connection.id,
            externalOrderId: trade.externalOrderId,
            symbol: trade.symbol,
            side: trade.side,
            type: trade.type,
            quantity: new Prisma.Decimal(trade.quantity ?? 0),
            price: new Prisma.Decimal(trade.price ?? 0),
            quoteQuantity: new Prisma.Decimal(trade.quoteQuantity ?? 0),
            fee: new Prisma.Decimal(trade.fee ?? 0),
            feeAsset: trade.feeAsset ?? "USDT",
            realizedPnl: trade.realizedPnl
              ? new Prisma.Decimal(trade.realizedPnl)
              : null,
            executedAt: trade.executedAt,
          },
        });

        upserted++;
      }
    }

    return {
      traderProfileId,
      exchange: connection.exchange,
      tradesFetched: trades.length,
      tradesUpserted: dryRun ? 0 : upserted,
      dryRun,
    };
  } finally {
    await adapter.close();
  }
}
