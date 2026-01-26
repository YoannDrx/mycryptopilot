/**
 * TraderTrade Serialization Helpers
 *
 * Normalizes Prisma Decimal fields so they can be safely passed to Client Components.
 * Also adjusts basic metadata (status normalization) to align with UI expectations.
 */

import type { TraderTrade } from "@/generated/prisma";

type DecimalLike =
  | number
  | string
  | bigint
  | null
  | undefined
  | {
      toNumber?: () => number;
    };

type FillLike = {
  quantity: DecimalLike;
  price: DecimalLike;
  fee: DecimalLike;
} & Record<string, unknown>;

type TraderTradeWithOptionalFills = TraderTrade & {
  fills?: FillLike[];
};

const hasToNumber = (
  value: DecimalLike,
): value is { toNumber: () => number } => {
  return Boolean(
    value &&
      typeof value === "object" &&
      "toNumber" in value &&
      typeof value.toNumber === "function",
  );
};

const decimalToNumber = (value: DecimalLike): number => {
  if (hasToNumber(value)) {
    return value.toNumber();
  }

  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
};

const decimalToNullableNumber = (value: DecimalLike): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return decimalToNumber(value);
};

export type SerializableTraderTrade<
  TTrade extends TraderTradeWithOptionalFills = TraderTradeWithOptionalFills,
> = Omit<
  TTrade,
  | "totalQuantity"
  | "entryQuantity"
  | "exitQuantity"
  | "netQuantity"
  | "averageEntry"
  | "averageExit"
  | "stopLoss"
  | "realizedPnl"
  | "fees"
  | "fills"
> & {
  totalQuantity: number;
  entryQuantity: number;
  exitQuantity: number;
  netQuantity: number;
  averageEntry: number;
  averageExit: number | null;
  stopLoss: number | null;
  realizedPnl: number | null;
  fees: number;
  fills?: FillLike[];
};

/**
 * Converts Prisma Decimal fields to primitive numbers and normalizes status metadata.
 */
export function serializeTraderTrade<
  TTrade extends TraderTradeWithOptionalFills,
>(trade: TTrade): SerializableTraderTrade<TTrade> {
  const entryQuantity = decimalToNumber(trade.entryQuantity);
  const exitQuantity = decimalToNumber(trade.exitQuantity);
  const netQuantity = decimalToNumber(trade.netQuantity);

  let normalizedStatus = trade.status;

  if (normalizedStatus === "OPEN") {
    if (exitQuantity > 0) {
      normalizedStatus = netQuantity === 0 ? "CLOSED" : "PARTIAL";
    } else if (
      trade.instrumentType === "SPOT" &&
      trade.side === "SELL" &&
      entryQuantity > 0
    ) {
      normalizedStatus = "CLOSED";
    }
  }

  const serialized = {
    ...trade,
    status: normalizedStatus,
    totalQuantity: decimalToNumber(trade.totalQuantity),
    entryQuantity,
    exitQuantity,
    netQuantity,
    averageEntry: decimalToNumber(trade.averageEntry),
    averageExit: decimalToNullableNumber(trade.averageExit),
    stopLoss: decimalToNullableNumber(trade.stopLoss),
    realizedPnl: decimalToNullableNumber(trade.realizedPnl),
    fees: decimalToNumber(trade.fees),
  };

  if (trade.fills) {
    serialized.fills = trade.fills.map((fill) => ({
      ...fill,
      quantity: decimalToNumber(fill.quantity),
      price: decimalToNumber(fill.price),
      fee: decimalToNumber(fill.fee),
    }));
  }

  return serialized as SerializableTraderTrade<TTrade>;
}
