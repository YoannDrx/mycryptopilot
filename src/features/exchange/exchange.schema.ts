import { z } from "zod";

/**
 * Schema for connecting an exchange (Binance)
 */
export const ConnectExchangeSchema = z.object({
  exchange: z.enum(["BINANCE"]),
  apiKey: z.string().min(1, "API Key is required"),
  secretKey: z.string().min(1, "Secret Key is required"),
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
