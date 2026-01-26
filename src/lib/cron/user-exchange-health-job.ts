import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  decryptApiKey,
  decryptOptionalSerializedPayload,
  decryptSerializedPayload,
} from "@/lib/crypto/encryption-service";
import { createExchangeService } from "@/lib/exchange/exchange-service-factory";
import { persistBalanceSnapshot } from "@/lib/exchange/balance-snapshot.service";
import type { Exchange } from "@/generated/prisma";

type HealthCheckSummary = {
  success: boolean;
  checked: number;
  healthy: number;
  unhealthy: number;
  durationMs: number;
  errors: { connectionId: string; userId: string; message: string }[];
};

type HealthCheckResult = {
  ok: boolean;
  connectionId: string;
  userId: string;
  message?: string;
};

const HEALTH_CHECK_BATCH_SIZE = 5;
const SNAPSHOT_RETENTION_DAYS = 30;

export async function runUserExchangeHealthJob(): Promise<HealthCheckSummary> {
  logger.info("=== Starting user exchange health job ===");
  const startedAt = Date.now();

  const connections = await prisma.userExchangeConnection.findMany({
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      exchange: true,
      encryptedApiKey: true,
      encryptedSecretKey: true,
      encryptedPassphrase: true,
      keyIv: true,
      keyTag: true,
      bitgetAccountMode: true,
    },
  });

  if (connections.length === 0) {
    return {
      success: true,
      checked: 0,
      healthy: 0,
      unhealthy: 0,
      durationMs: Date.now() - startedAt,
      errors: [],
    };
  }

  let healthy = 0;
  let unhealthy = 0;
  const errors: HealthCheckSummary["errors"] = [];

  const processBatch = async (offset: number): Promise<void> => {
    if (offset >= connections.length) {
      return;
    }

    const batch = connections.slice(offset, offset + HEALTH_CHECK_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (connection) => validateUserConnection(connection)),
    );

    for (const result of results) {
      if (result.ok) {
        healthy += 1;
      } else {
        unhealthy += 1;
        errors.push({
          connectionId: result.connectionId,
          userId: result.userId,
          message: result.message ?? "Unknown health error",
        });
      }
    }

    await processBatch(offset + HEALTH_CHECK_BATCH_SIZE);
  };

  await processBatch(0);

  await pruneOldSnapshots();

  const summary: HealthCheckSummary = {
    success: unhealthy === 0,
    checked: connections.length,
    healthy,
    unhealthy,
    durationMs: Date.now() - startedAt,
    errors,
  };

  logger.info("=== User exchange health job completed ===", summary);
  return summary;
}

async function pruneOldSnapshots(): Promise<void> {
  const cutoff = new Date(Date.now() - SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await prisma.userExchangeBalanceSnapshot.deleteMany({
    where: { capturedAt: { lt: cutoff } },
  });

  if (deleted.count > 0) {
    logger.info("Pruned stale user exchange balance snapshots", {
      deleted: deleted.count,
      retentionDays: SNAPSHOT_RETENTION_DAYS,
    });
  }
}

async function validateUserConnection(connection: {
  id: string;
  userId: string;
  exchange: Exchange;
  encryptedApiKey: string;
  encryptedSecretKey: string;
  encryptedPassphrase: string | null;
  keyIv: string;
  keyTag: string;
  bitgetAccountMode: "UTA" | "CLASSIC" | null;
}): Promise<HealthCheckResult> {
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
    const balance = await adapter.fetchConsolidatedBalance();
    await persistBalanceSnapshot({
      connectionId: connection.id,
      userId: connection.userId,
      exchange: connection.exchange,
      balance,
    });

    await prisma.userExchangeConnection.update({
      where: { id: connection.id },
      data: {
        lastError: null,
        lastHealthCheckAt: new Date(),
      },
    });

    return {
      ok: true,
      connectionId: connection.id,
      userId: connection.userId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown health error";
    logger.warn("User exchange health check failed", {
      connectionId: connection.id,
      userId: connection.userId,
      exchange: connection.exchange,
      error,
    });

    await prisma.userExchangeConnection.update({
      where: { id: connection.id },
      data: {
        lastError: message,
        lastHealthCheckAt: new Date(),
      },
    });

    return {
      ok: false,
      connectionId: connection.id,
      userId: connection.userId,
      message,
    };
  } finally {
    await adapter.close();
  }
}
