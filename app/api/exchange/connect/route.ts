/**
 * API Route: Connect Exchange (Binance, Bybit)
 *
 * POST /api/exchange/connect
 *
 * Connects a trader's exchange account via read-only API keys:
 * - Validates trader has a profile
 * - Checks plan limits (FREE=0, PRO=1, ULTRA=3)
 * - Validates exchange API keys (read-only enforcement)
 * - Encrypts keys with AES-256-GCM
 * - Stores connection in DB
 * - Returns connection details
 *
 * @see https://github.com/YoannDrx/mycryptopilot/issues/66
 */

import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { encryptApiKey } from "@/lib/crypto/encryption-service";
import { createExchangeService } from "@/lib/exchange/exchange-service-factory";
import {
  getExistingConnection,
  countTraderConnections,
} from "@/features/exchange/exchange-queries";
import {
  getExchangeConnectionLimit,
  calculateNextSyncAt,
} from "@/features/exchange/exchange-plan-limits";
import { ConnectExchangeSchema } from "@/features/exchange/exchange.schema";

export async function POST(request: Request) {
  try {
    const user = await getRequiredUser();

    // Parse request body
    const body = await request.json();
    const validation = ConnectExchangeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { exchange, apiKey, secretKey } = validation.data;

    logger.info("Exchange connection request", {
      userId: user.id,
      exchange,
    });

    // Check if user has a trader profile
    const traderProfile = await prisma.traderProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            planName: true,
          },
        },
      },
    });

    if (!traderProfile) {
      return NextResponse.json(
        {
          error:
            "You need a trader profile to connect an exchange. Create one first.",
        },
        { status: 403 },
      );
    }

    // Check plan limits
    const planName = traderProfile.user.planName;
    const connectionLimit = getExchangeConnectionLimit(planName);

    if (connectionLimit === 0) {
      return NextResponse.json(
        {
          error: "Exchange connections require a Pro or Ultra plan",
          upgrade: true,
          requiredPlan: "pro",
        },
        { status: 403 },
      );
    }

    // Check if already has connection for this exchange
    const existingConnection = await getExistingConnection(
      traderProfile.id,
      exchange,
    );

    if (existingConnection) {
      // If connection exists but is inactive, we'll reactivate it (instead of creating new one)
      if (!existingConnection.isActive) {
        logger.info("Reactivating inactive connection", {
          userId: user.id,
          connectionId: existingConnection.id,
          exchange,
        });
        // Will reactivate below after API validation
      } else {
        // Connection is still active - return error
        return NextResponse.json(
          {
            error: `You already have an active ${exchange} connection. Disconnect it first to reconnect with different keys.`,
          },
          { status: 409 },
        );
      }
    }

    // Check current connection count
    const currentConnections = await countTraderConnections(traderProfile.id);

    if (currentConnections >= connectionLimit) {
      const needsUpgrade = planName === "pro";
      return NextResponse.json(
        {
          error: `You have reached your plan limit (${connectionLimit} connection${connectionLimit > 1 ? "s" : ""})`,
          upgrade: needsUpgrade,
          requiredPlan: needsUpgrade ? "ultra" : null,
        },
        { status: 403 },
      );
    }

    // Validate exchange API keys
    logger.info(`Validating ${exchange} API keys`, {
      userId: user.id,
      traderProfileId: traderProfile.id,
      exchange,
    });

    const exchangeService = createExchangeService(exchange, apiKey, secretKey);

    let apiValidation;
    try {
      apiValidation = await exchangeService.validateApiKeys();
    } catch (error) {
      logger.error(`${exchange} API validation failed`, { error, exchange });
      return NextResponse.json(
        {
          error: `Failed to validate ${exchange} API keys. Please check your keys and try again.`,
        },
        { status: 400 },
      );
    } finally {
      await exchangeService.close();
    }

    if (!apiValidation.isValid) {
      return NextResponse.json(
        { error: apiValidation.errorMessage ?? "Invalid API keys" },
        { status: 400 },
      );
    }

    if (!apiValidation.isReadOnly) {
      return NextResponse.json(
        {
          error:
            "API keys must be read-only. Please create new keys with read-only permissions.",
        },
        { status: 400 },
      );
    }

    // Encrypt API keys
    logger.info("Encrypting API keys", {
      userId: user.id,
      traderProfileId: traderProfile.id,
    });

    const encryptedApiKey = encryptApiKey(apiKey);
    const encryptedSecretKey = encryptApiKey(secretKey);

    // Calculate next sync time based on plan
    const nextSyncAt = calculateNextSyncAt(planName);

    // Store connection in DB and mark trader as verified
    const connection = await prisma.$transaction(async (tx) => {
      let updatedConnection;

      if (existingConnection && !existingConnection.isActive) {
        // Reactivate existing inactive connection with new keys
        updatedConnection = await tx.exchangeConnection.update({
          where: { id: existingConnection.id },
          data: {
            encryptedApiKey: encryptedApiKey.encrypted,
            encryptedSecretKey: encryptedSecretKey.encrypted,
            keyIv: encryptedApiKey.iv,
            keyTag: encryptedApiKey.tag,
            isActive: true,
            nextSyncAt,
            lastSyncError: null, // Clear previous errors
            updatedAt: new Date(),
          },
        });

        logger.info("Connection reactivated with new keys", {
          userId: user.id,
          connectionId: existingConnection.id,
          exchange,
        });
      } else {
        // Create new connection
        updatedConnection = await tx.exchangeConnection.create({
          data: {
            traderProfileId: traderProfile.id,
            exchange,
            encryptedApiKey: encryptedApiKey.encrypted,
            encryptedSecretKey: encryptedSecretKey.encrypted,
            keyIv: encryptedApiKey.iv,
            keyTag: encryptedApiKey.tag,
            isActive: true,
            nextSyncAt,
          },
        });
      }

      // Mark trader as verified (has at least one active exchange connection)
      await tx.traderProfile.update({
        where: { id: traderProfile.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      });

      return updatedConnection;
    });

    const wasReactivated = existingConnection && !existingConnection.isActive;

    logger.info(
      wasReactivated
        ? "Exchange connection reactivated successfully"
        : "Exchange connection created successfully",
      {
        userId: user.id,
        traderProfileId: traderProfile.id,
        connectionId: connection.id,
        exchange,
        traderVerified: true,
        wasReactivated,
      },
    );

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        exchange: connection.exchange,
        createdAt: connection.createdAt,
        isActive: connection.isActive,
        nextSyncAt: connection.nextSyncAt,
      },
      message: wasReactivated
        ? `${exchange} reconnected successfully! Sync will start soon.`
        : `${exchange} connected successfully! First sync will start soon.`,
    });
  } catch (error) {
    logger.error("Exchange connection error", { error });
    return NextResponse.json(
      { error: "Failed to connect exchange. Please try again." },
      { status: 500 },
    );
  }
}
