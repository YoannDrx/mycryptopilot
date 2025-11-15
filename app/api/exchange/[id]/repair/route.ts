/**
 * API Route: Repair Exchange Connection
 *
 * POST /api/exchange/[id]/repair
 *
 * Re-encrypts existing API keys (useful when encryption format changes)
 * without forcing the user to disconnect/reconnect.
 */

import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  decryptApiKey,
  encryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
  serializeEncryptedPayload,
} from "@/lib/crypto/encryption-service";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { logger } from "@/lib/logger";
import {
  getExchangeConnectionById,
  type ExchangeConnectionWithTrader,
} from "@/features/exchange/exchange-queries";

const decryptSecrets = (connection: ExchangeConnectionWithTrader) => {
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

  return { apiKey, secretKey, passphrase };
};

export const POST = authRoute
  .params(z.object({ id: z.string().cuid() }))
  .handler(async (_req, { params, ctx }) => {
    const userId = ctx.user.id;
    const connection = await getExchangeConnectionById(params.id);

    if (!connection) {
      throw new ZodRouteError("Connection not found", 404);
    }

    if (connection.trader.userId !== userId) {
      logger.warn("Unauthorized repair attempt", {
        userId,
        connectionId: connection.id,
      });
      throw new ZodRouteError("Unauthorized", 403);
    }

    logger.info("Repairing exchange connection", {
      userId,
      connectionId: connection.id,
    });

    const { apiKey, secretKey, passphrase } = decryptSecrets(connection);
    const newApi = encryptApiKey(apiKey);
    const newSecret = encryptApiKey(secretKey);
    const newPassphrase =
      passphrase?.length ? encryptApiKey(passphrase) : null;

    await prisma.exchangeConnection.update({
      where: { id: connection.id },
      data: {
        encryptedApiKey: newApi.encrypted,
        encryptedSecretKey: serializeEncryptedPayload(newSecret),
        encryptedPassphrase: newPassphrase
          ? serializeEncryptedPayload(newPassphrase)
          : null,
        keyIv: newApi.iv,
        keyTag: newApi.tag,
        lastSyncError: null,
        nextSyncAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: "Connection keys rotated successfully.",
    };
  });
