import { prisma } from "@/lib/prisma";
import {
  decryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";
import { createExchangeService } from "./exchange-service-factory";
import { logger } from "@/lib/logger";
import type { Exchange } from "@/generated/prisma";
import { Prisma } from "@/generated/prisma";
import { mapNormalizedOrderTypeToPrisma } from "./order-type.utils";

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

  const existingSymbols = await prisma.exchangeTrade.findMany({
    where: { connectionId: connection.id },
    distinct: ["symbol"],
    select: { symbol: true },
  });
  const knownSymbols = existingSymbols.map((record) => record.symbol);

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

  const adapter = createExchangeService(
    connection.exchange,
    apiKey,
    secretKey,
    {
      passphrase,
      bitgetAccountMode: connection.bitgetAccountMode ?? undefined,
    },
  );

  try {
    logger.info("Fetching historical trades from exchange", {
      traderProfileId,
      exchange: connection.exchange,
      days,
    });

    const trades = await adapter.fetchRecentTrades(days, undefined, knownSymbols);

    logger.info("Trades fetched", {
      traderProfileId,
      total: trades.length,
    });

    let upserted = 0;

    if (!dryRun) {
      const upsertPayloads = trades
        .filter((trade) => Boolean(trade.externalOrderId))
        .map(async (trade) => {
          const realizedPnl =
            trade.realizedPnl === null
              ? null
              : new Prisma.Decimal(trade.realizedPnl);
          const orderType = mapNormalizedOrderTypeToPrisma(trade.type);
          const sharedFields = {
            symbol: trade.symbol,
            side: trade.side,
            type: orderType,
            quantity: new Prisma.Decimal(trade.quantity),
            price: new Prisma.Decimal(trade.price),
            quoteQuantity: new Prisma.Decimal(trade.quoteQuantity),
            fee: new Prisma.Decimal(trade.fee),
            feeAsset: trade.feeAsset,
            realizedPnl,
            executedAt: trade.executedAt,
          };

          return prisma.exchangeTrade.upsert({
            where: {
              externalOrderId: trade.externalOrderId,
            },
            update: sharedFields,
            create: {
              connectionId: connection.id,
              externalOrderId: trade.externalOrderId,
              ...sharedFields,
            },
          });
        });

      const results = await Promise.all(upsertPayloads);
      upserted = results.length;
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
