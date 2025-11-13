import { z } from "zod";

/**
 * Helpers de validation via Zod pour garantir qu'un adaptateur échange
 * renvoie toujours des données normalisées avant ingestion.
 */

const zAssetBalance = z.object({
  asset: z.string(),
  free: z.number(),
  locked: z.number(),
  total: z.number(),
  usdValue: z.number().optional(),
});

const zBalanceSection = z.object({
  totalUsd: z.number(),
  assets: z.record(z.string(), zAssetBalance),
  raw: z.unknown().optional(),
});

const zFuturesBalanceSection = zBalanceSection.extend({
  marginUsed: z.number(),
  marginAvailable: z.number(),
  unrealizedPnl: z.number(),
  leverage: z.number().nullable().optional(),
});

const zMarginBalanceSection = zBalanceSection.extend({
  borrowed: z.number(),
  interest: z.number().optional(),
});

export const zConsolidatedBalance = z.object({
  timestamp: z.date(),
  spot: zBalanceSection,
  futures: zFuturesBalanceSection.optional(),
  margin: zMarginBalanceSection.optional(),
  totalEquityUsd: z.number(),
});

export type AssetBalance = z.infer<typeof zAssetBalance>;
export type BalanceSection = z.infer<typeof zBalanceSection>;
export type FuturesBalanceSection = z.infer<typeof zFuturesBalanceSection>;
export type MarginBalanceSection = z.infer<typeof zMarginBalanceSection>;
export type ConsolidatedBalance = z.infer<typeof zConsolidatedBalance>;

export const zPositionSnapshot = z.object({
  symbol: z.string(),
  side: z.enum(["LONG", "SHORT"]),
  quantity: z.number(),
  entryPrice: z.number(),
  markPrice: z.number(),
  leverage: z.number().nullable(),
  margin: z.number(),
  unrealizedPnl: z.number(),
  liquidationPrice: z.number().nullable(),
  type: z.enum([
    "SPOT",
    "MARGIN_CROSS",
    "MARGIN_ISOLATED",
    "FUTURES_USDT",
    "FUTURES_COIN",
  ]),
  openedAt: z.date(),
  lastUpdatedAt: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  raw: z.unknown().optional(),
});

export type PositionSnapshot = z.infer<typeof zPositionSnapshot>;

export const zNormalizedTrade = z.object({
  id: z.string(),
  orderId: z.string(),
  symbol: z.string(),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum([
    "MARKET",
    "LIMIT",
    "STOP",
    "STOP_MARKET",
    "STOP_LIMIT",
    "TAKE_PROFIT",
    "TAKE_PROFIT_MARKET",
    "TRAILING_STOP",
  ]),
  quantity: z.number(),
  price: z.number(),
  quoteQuantity: z.number(),
  fee: z.number(),
  feeCurrency: z.string(),
  executedAt: z.date(),
  instrumentType: z.enum(["SPOT", "FUTURES_USDT", "FUTURES_COIN", "MARGIN"]),
  realizedPnl: z.number().nullable(),
  positionSide: z.enum(["LONG", "SHORT", "BOTH"]).nullable(),
  raw: z.unknown().optional(),
});

export type NormalizedTrade = z.infer<typeof zNormalizedTrade>;

export const zPaginationCursor = z.object({
  nextId: z.string().nullable(),
  nextTimestamp: z.number().nullable(),
  hasMore: z.boolean(),
});

export type PaginationCursor = z.infer<typeof zPaginationCursor>;

export const zConnectionStatus = z.object({
  isValid: z.boolean(),
  isReadOnly: z.boolean(),
  hasSpotEnabled: z.boolean(),
  hasFuturesEnabled: z.boolean(),
  canTrade: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  errorMessage: z.string().optional(),
});

export type ConnectionStatus = z.infer<typeof zConnectionStatus>;

export const zRateLimitInfo = z.object({
  used: z.number(),
  limit: z.number(),
  percentage: z.number(),
  resetsAt: z.date().nullable(),
  scope: z.enum(["GLOBAL", "ORDER", "WEIGHT"]).default("GLOBAL"),
});

export type RateLimitInfo = z.infer<typeof zRateLimitInfo>;

export const zInstrumentType = z.enum([
  "SPOT",
  "MARGIN",
  "FUTURES_USDT",
  "FUTURES_COIN",
]);

export type InstrumentType = z.infer<typeof zInstrumentType>;

const zBaseOrderParams = z.object({
  symbol: z.string(),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum([
    "MARKET",
    "LIMIT",
    "STOP_LOSS",
    "STOP_LOSS_LIMIT",
    "TAKE_PROFIT",
    "TAKE_PROFIT_LIMIT",
  ]),
  quantity: z.number(),
  price: z.number().optional(),
  timeInForce: z.enum(["GTC", "IOC", "FOK"]).optional(),
  clientOrderId: z.string().optional(),
});

export const zCreateOrderParams = zBaseOrderParams.extend({
  instrumentType: zInstrumentType,
  positionSide: z.enum(["LONG", "SHORT", "BOTH"]).optional(),
  reduceOnly: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateOrderParams = z.infer<typeof zCreateOrderParams>;

export const zOrderFill = z.object({
  price: z.number(),
  quantity: z.number(),
  fee: z.number(),
  feeCurrency: z.string(),
});

export type OrderFill = z.infer<typeof zOrderFill>;

export const zOrderResult = z.object({
  orderId: z.string(),
  clientOrderId: z.string().nullable(),
  symbol: z.string(),
  status: z.enum(["NEW", "PARTIALLY_FILLED", "FILLED", "CANCELED", "REJECTED"]),
  executedQty: z.number(),
  executedPrice: z.number(),
  cummulativeQuoteQty: z.number(),
  fills: z.array(zOrderFill),
  transactTime: z.date(),
  raw: z.unknown().optional(),
});

export type OrderResult = z.infer<typeof zOrderResult>;

export const zCancelOrderParams = z.object({
  symbol: z.string(),
  orderId: z.string().optional(),
  clientOrderId: z.string().optional(),
});

export type CancelOrderParams = z.infer<typeof zCancelOrderParams>;

export const zOrderStatus = z.object({
  orderId: z.string(),
  status: z.enum(["NEW", "PARTIALLY_FILLED", "FILLED", "CANCELED", "REJECTED"]),
  executedQty: z.number(),
  price: z.number(),
  stopPrice: z.number().nullable(),
  updatedAt: z.date(),
  raw: z.unknown().optional(),
});

export type OrderStatus = z.infer<typeof zOrderStatus>;

/**
 * Fonctions utilitaires pour parser/valider rapidement depuis les adapters.
 */
export const validateConsolidatedBalance = (data: unknown) =>
  zConsolidatedBalance.parse(data);

export const validatePositionSnapshot = (data: unknown) =>
  zPositionSnapshot.parse(data);

export const validateNormalizedTrade = (data: unknown) =>
  zNormalizedTrade.parse(data);

export const validateOrderResult = (data: unknown) => zOrderResult.parse(data);
