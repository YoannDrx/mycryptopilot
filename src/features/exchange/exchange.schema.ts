import { z } from "zod";

/**
 * Public read-only exchange connection schema.
 * Bitget remains supported internally for legacy connections but is excluded
 * until its API scopes can be verified reliably.
 */
export const ConnectExchangeSchema = z.object({
  exchange: z.enum(["BINANCE", "BYBIT"]),
  apiKey: z.string().trim().min(1, "API Key is required"),
  secretKey: z.string().trim().min(1, "Secret Key is required"),
});

export type ConnectExchangeInput = z.infer<typeof ConnectExchangeSchema>;

/**
 * Schema for disconnecting an exchange
 */
export const DisconnectExchangeSchema = z.object({
  connectionId: z.string().cuid(),
});

export type DisconnectExchangeInput = z.infer<typeof DisconnectExchangeSchema>;

/**
 * Schema for manually syncing an exchange connection
 */
export const SyncExchangeSchema = z.object({
  connectionId: z.string().cuid(),
});

export type SyncExchangeInput = z.infer<typeof SyncExchangeSchema>;
