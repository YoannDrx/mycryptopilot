import { z } from "zod";

/**
 * Schema for connecting an exchange (Binance, Bybit, Bitget)
 */
export const ConnectExchangeSchema = z
  .object({
    exchange: z.enum(["BINANCE", "BYBIT", "BITGET"]),
    apiKey: z.string().min(1, "API Key is required"),
    secretKey: z.string().min(1, "Secret Key is required"),
    passphrase: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.exchange === "BITGET") {
      if (!data.passphrase || data.passphrase.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passphrase is required for Bitget",
          path: ["passphrase"],
        });
      }
    }
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
