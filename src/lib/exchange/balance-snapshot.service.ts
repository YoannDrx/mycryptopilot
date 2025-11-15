import { prisma } from "@/lib/prisma";
import {
  Prisma,
  type Exchange,
  type UserExchangeBalanceSnapshot,
} from "@/generated/prisma";
import type { AssetBalance, ConsolidatedBalance } from "@/lib/exchange/types";

const SNAPSHOT_TTL_MS = 60_000; // 1 minute cache for risk console + sizing

type SnapshotRecord = UserExchangeBalanceSnapshot;

type SpotSection = Omit<ConsolidatedBalance["spot"], "raw">;
type FuturesSection = Omit<
  NonNullable<ConsolidatedBalance["futures"]>,
  "raw"
>;
type MarginSection = Omit<
  NonNullable<ConsolidatedBalance["margin"]>,
  "raw"
>;

type StoredBalancePayload = Omit<
  ConsolidatedBalance,
  "timestamp" | "spot" | "futures" | "margin"
> & {
  timestamp: string | Date;
  spot: SpotSection;
  futures?: FuturesSection;
  margin?: MarginSection;
};

/**
 * Build a minimal ConsolidatedBalance from spot-only totals.
 * Used when ccxt balance data is available but no structured payload.
 */
export function buildSpotOnlyBalanceFromTotals(input: {
  total: number;
  available: number;
  locked: number;
}): ConsolidatedBalance {
  const { total, available, locked } = input;
  const timestamp = new Date();
  const asset: AssetBalance = {
    asset: "USDT",
    free: available,
    locked,
    total,
    usdValue: total,
  };

  return {
    timestamp,
    spot: {
      totalUsd: total,
      assets: {
        USDT: asset,
      },
      raw: null,
    },
    futures: undefined,
    margin: undefined,
    totalEquityUsd: total,
  };
}

function normalizeStoredBalance(payload: StoredBalancePayload): ConsolidatedBalance {
  const { timestamp, ...rest } = payload;
  return {
    ...(rest as Omit<ConsolidatedBalance, "timestamp">),
    timestamp:
      timestamp instanceof Date ? timestamp : new Date(timestamp),
  };
}

function serializeBalanceForJson(
  balance: ConsolidatedBalance,
): StoredBalancePayload {
  const { spot, futures, margin, ...rest } = balance;
  const { raw: _spotRaw, ...spotSection } = spot;
  const futuresSection = futures
    ? (({ raw: _raw, ...restSection }) => restSection)(futures)
    : undefined;
  const marginSection = margin
    ? (({ raw: _raw, ...restSection }) => restSection)(margin)
    : undefined;

  const sanitized: StoredBalancePayload = {
    ...rest,
    timestamp: balance.timestamp.toISOString(),
    spot: spotSection,
    futures: futuresSection,
    margin: marginSection,
  };

  return JSON.parse(JSON.stringify(sanitized)) as StoredBalancePayload;
}

function extractUsdBreakdown(balance: ConsolidatedBalance): {
  spotUsd: number;
  futuresUsd: number | null;
  marginUsd: number | null;
  availableUsd: number;
  lockedUsd: number;
} {
  const spotAsset =
    "USDT" in balance.spot.assets ? balance.spot.assets.USDT : null;
  const availableUsd = spotAsset ? spotAsset.free : balance.spot.totalUsd;
  const lockedUsd = spotAsset ? spotAsset.locked : 0;
  const spotUsd = balance.spot.totalUsd;
  const futuresUsd = balance.futures ? balance.futures.totalUsd : null;
  const marginUsd = balance.margin ? balance.margin.totalUsd : null;

  return {
    spotUsd,
    futuresUsd,
    marginUsd,
    availableUsd,
    lockedUsd,
  };
}

export function snapshotToConsolidatedBalance(
  snapshot: SnapshotRecord,
): ConsolidatedBalance {
  if (snapshot.payloadJson) {
    const payload = snapshot.payloadJson as StoredBalancePayload;
    return normalizeStoredBalance(payload);
  }

  return buildSpotOnlyBalanceFromTotals({
    total: Number(snapshot.totalEquityUsd),
    available: Number(snapshot.availableUsd),
    locked: Number(snapshot.lockedUsd),
  });
}

export function isSnapshotFresh(
  snapshot: SnapshotRecord,
  ttlMs = SNAPSHOT_TTL_MS,
): boolean {
  return Date.now() - snapshot.capturedAt.getTime() <= ttlMs;
}

export async function getLatestSnapshotsMap(
  connectionIds: string[],
): Promise<Map<string, SnapshotRecord>> {
  if (connectionIds.length === 0) {
    return new Map();
  }

  const snapshots = await prisma.userExchangeBalanceSnapshot.findMany({
    where: { connectionId: { in: connectionIds } },
    orderBy: { capturedAt: "desc" },
  });

  const map = new Map<string, SnapshotRecord>();
  for (const snapshot of snapshots) {
    if (!map.has(snapshot.connectionId)) {
      map.set(snapshot.connectionId, snapshot);
    }
  }
  return map;
}

export async function getFreshSnapshotForConnection(
  connectionId: string,
  ttlMs = SNAPSHOT_TTL_MS,
): Promise<{ snapshot: SnapshotRecord; balance: ConsolidatedBalance } | null> {
  const snapshot = await prisma.userExchangeBalanceSnapshot.findFirst({
    where: { connectionId },
    orderBy: { capturedAt: "desc" },
  });

  if (!snapshot) {
    return null;
  }

  if (!isSnapshotFresh(snapshot, ttlMs)) {
    return null;
  }

  return {
    snapshot,
    balance: snapshotToConsolidatedBalance(snapshot),
  };
}

export async function persistBalanceSnapshot(params: {
  connectionId: string;
  userId: string;
  exchange: Exchange;
  balance: ConsolidatedBalance;
}): Promise<void> {
  const { connectionId, userId, exchange, balance } = params;
  const breakdown = extractUsdBreakdown(balance);

  await prisma.userExchangeBalanceSnapshot.create({
    data: {
      connectionId,
      userId,
      exchange,
      totalEquityUsd: new Prisma.Decimal(balance.totalEquityUsd),
      availableUsd: new Prisma.Decimal(breakdown.availableUsd),
      lockedUsd: new Prisma.Decimal(breakdown.lockedUsd),
      spotEquityUsd: new Prisma.Decimal(breakdown.spotUsd),
      futuresEquityUsd:
        breakdown.futuresUsd !== null
          ? new Prisma.Decimal(breakdown.futuresUsd)
          : undefined,
      marginEquityUsd:
        breakdown.marginUsd !== null
          ? new Prisma.Decimal(breakdown.marginUsd)
          : undefined,
      payloadJson: serializeBalanceForJson(balance) as Prisma.JsonObject,
      capturedAt: new Date(),
    },
  });
}

export function balanceToExchangeMetrics(balance: ConsolidatedBalance): {
  totalUSDT: number;
  availableUSDT: number;
  lockedUSDT: number;
  capturedAt: Date;
} {
  const breakdown = extractUsdBreakdown(balance);
  return {
    totalUSDT: balance.totalEquityUsd,
    availableUSDT: breakdown.availableUsd,
    lockedUSDT: breakdown.lockedUsd,
    capturedAt: balance.timestamp,
  };
}
