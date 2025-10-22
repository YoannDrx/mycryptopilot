import type {
  CryptoNetwork,
  FollowStatus,
  PaymentStatus,
  UserRole,
} from "@/generated/prisma";

/**
 * Trading Card Payload
 * Complete structure of a trading signal
 */
export type TradingCardPayload = {
  symbol: string; // e.g., "BTC-USDT", "SOL-USDT"
  instrumentType: "spot" | "perp";
  bias: "bull" | "bear" | "neutral";

  entry: {
    zone: [number, number]; // [min, max] price range
    type: "limit" | "market" | "market-on-trigger";
  };

  invalidation: number; // Stop loss price
  tps: number[]; // Take profit targets (multiple levels)
  leverageBand?: [number, number]; // Optional for perps: [min, max] leverage

  risk: {
    Rpct: number; // Risk percentage per trade (e.g., 0.75 = 0.75% of equity)
    maxPortfolioExpPct: number; // Max portfolio exposure percentage
  };

  confidence: number; // 0-100 score
  rationales: string[]; // Array of reasons for this trade
  regime: string; // Market regime (e.g., "trend_up_choppy", "mean_revert", etc.)
  managedBy: "system" | `trader:${string}`; // Who created this signal
  ttlSec: number; // Time-to-live in seconds
  createdAt: string; // ISO timestamp
  version: string; // Signal format version (e.g., "1.0.0")
};

/**
 * Trader Statistics
 * Calculated periodically from signals and user journals
 */
export type TraderStats = {
  winrate: number; // Percentage of winning trades (0-1)
  payoff: number; // Average win / average loss ratio
  maxDD: number; // Maximum drawdown percentage
  nTrades: number; // Total number of trades
  expectancy: number; // Expected value per trade
  lastUpdated?: string; // ISO timestamp
};

/**
 * Crypto Network Configuration
 */
export type CryptoNetworkConfig = {
  name: string;
  currency: string;
  confirmations: number;
  explorerUrl: string;
};

/**
 * Follow relationship with status
 */
export type FollowRelationship = {
  id: string;
  userId: string;
  traderId: string;
  traderName: string;
  traderDisplayName: string;
  status: FollowStatus;
  startedAt: Date;
  expiresAt?: Date | null;
};

/**
 * Crypto Payment with network info
 */
export type CryptoPaymentWithDetails = {
  id: string;
  txHash: string;
  network: CryptoNetwork;
  amountToken: number;
  amountUSD: number;
  currency: string;
  confirmations: number;
  status: PaymentStatus;
  confirmedAt?: Date | null;
  plan: string;
  daysGranted: number;
  createdAt: Date;
};

/**
 * Signal with trader info
 */
export type SignalWithTrader = {
  id: string;
  traderId: string;
  traderName: string;
  traderDisplayName: string;
  traderVerified: boolean;
  symbol: string;
  payload: TradingCardPayload;
  hash: string;
  createdAt: Date;
  expiresAt: Date;
  isExpired: boolean;
};

/**
 * Trader Profile with stats
 */
export type TraderProfileWithStats = {
  id: string;
  userId: string;
  displayName: string;
  bio?: string | null;
  stats?: TraderStats | null;
  verified: boolean;
  verifiedAt?: Date | null;
  followersCount: number;
  signalsCount: number;
  createdAt: Date;
};

/**
 * User with role info
 */
export type UserWithRole = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  userRole: UserRole;
  isTrader: boolean;
  traderProfile?: TraderProfileWithStats | null;
};
