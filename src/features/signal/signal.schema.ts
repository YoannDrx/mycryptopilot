import { z } from "zod";

/**
 * Schema pour le payload JSON d'une Trading Card
 *
 * Structure des signaux de trading MyCryptoPilot
 */
export const TradingCardPayloadSchema = z.object({
  // Type d'instrument
  instrumentType: z.enum(["SPOT", "PERP"]),

  // Direction du trade
  bias: z.enum(["LONG", "SHORT"]),

  // Prix d'entrée
  entry: z
    .number()
    .positive("Entry price must be positive")
    .finite("Entry price must be finite"),

  // Niveau d'invalidation
  invalidation: z
    .number()
    .positive("Invalidation level must be positive")
    .finite("Invalidation level must be finite"),

  // Take profits (array of numbers)
  tps: z
    .array(
      z
        .number()
        .positive("Take profit must be positive")
        .finite("Take profit must be finite"),
    )
    .min(1, "At least one take profit is required")
    .max(5, "Maximum 5 take profits allowed"),

  // Leverage band (e.g., "1-3x", "5-10x")
  leverageBand: z
    .string()
    .min(1, "Leverage band is required")
    .max(20, "Leverage band too long"),

  // Risk level (1-5)
  risk: z
    .number()
    .int("Risk must be an integer")
    .min(1, "Risk must be between 1 and 5")
    .max(5, "Risk must be between 1 and 5"),

  // Confidence (0-100%)
  confidence: z
    .number()
    .int("Confidence must be an integer")
    .min(0, "Confidence must be between 0 and 100")
    .max(100, "Confidence must be between 0 and 100"),

  // Rationales (array of strings)
  rationales: z
    .array(z.string().min(1, "Rationale cannot be empty").max(500))
    .min(1, "At least one rationale is required")
    .max(5, "Maximum 5 rationales allowed"),

  // Market regime (e.g., "Bull", "Bear", "Ranging", "Volatile")
  regime: z.string().min(1, "Regime is required").max(50, "Regime too long"),

  // Managed by AI or Human
  managedBy: z.enum(["AI", "HUMAN"]),

  // Version of the trading card format
  version: z
    .string()
    .default("1.0")
    .refine((v) => /^\d+\.\d+$/.test(v), {
      message: "Version must be in format X.Y",
    }),
});

export type TradingCardPayloadType = z.infer<typeof TradingCardPayloadSchema>;

/**
 * Schema pour la création d'un signal
 */
export const CreateSignalSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(20, "Symbol too long")
    .regex(/^[A-Z]+-[A-Z]+$/, {
      message: "Symbol must be in format XXX-YYY (e.g., BTC-USDT)",
    }),

  ttlSec: z
    .number()
    .int("TTL must be an integer")
    .min(3600, "TTL must be at least 1 hour (3600 seconds)")
    .max(604800, "TTL must be at most 7 days (604800 seconds)")
    .default(86400), // 24 hours by default

  payload: TradingCardPayloadSchema,
});

export type CreateSignalType = z.infer<typeof CreateSignalSchema>;

/**
 * Schema pour les filtres de recherche de signaux
 */
export const SignalFiltersSchema = z.object({
  traderId: z.string().optional(),
  traderName: z.string().optional(), // Search by trader display name
  symbol: z.string().optional(), // Single symbol filter
  symbols: z.array(z.string()).optional(), // Multiple symbols filter
  bias: z.enum(["LONG", "SHORT"]).optional(),
  status: z.enum(["ACTIVE", "EXPIRED"]).optional(),
  instrumentType: z.enum(["SPOT", "PERP"]).optional(),
  verifiedOnly: z.boolean().optional(), // Only verified traders
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(), // For cursor-based pagination
});

export type SignalFiltersType = z.infer<typeof SignalFiltersSchema>;
