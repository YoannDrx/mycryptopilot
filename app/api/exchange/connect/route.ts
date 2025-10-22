/**
 * API Route: Connect Exchange (Binance)
 *
 * POST /api/exchange/connect
 *
 * Connects a trader's Binance account via read-only API keys:
 * - Validates trader has a profile
 * - Checks plan limits (FREE=0, PRO=1, ULTRA=3)
 * - Validates Binance API keys (read-only enforcement)
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
import { BinanceService } from "@/lib/exchange/binance-service";
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
      return NextResponse.json(
        {
          error: `You already have a ${exchange} connection. Disconnect it first to reconnect.`,
        },
        { status: 409 },
      );
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

    // Validate Binance API keys
    logger.info("Validating Binance API keys", {
      userId: user.id,
      traderProfileId: traderProfile.id,
    });

    const binance = new BinanceService(apiKey, secretKey);

    let apiValidation;
    try {
      apiValidation = await binance.validateApiKeys();
    } catch (error) {
      logger.error("Binance API validation failed", { error });
      return NextResponse.json(
        {
          error:
            "Failed to validate API keys. Please check your keys and try again.",
        },
        { status: 400 },
      );
    } finally {
      await binance.close();
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

    // Store connection in DB
    const connection = await prisma.exchangeConnection.create({
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

    logger.info("Exchange connection created successfully", {
      userId: user.id,
      traderProfileId: traderProfile.id,
      connectionId: connection.id,
      exchange,
    });

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        exchange: connection.exchange,
        createdAt: connection.createdAt,
        isActive: connection.isActive,
        nextSyncAt: connection.nextSyncAt,
      },
      message: `${exchange} connected successfully! First sync will start soon.`,
    });
  } catch (error) {
    logger.error("Exchange connection error", { error });
    return NextResponse.json(
      { error: "Failed to connect exchange. Please try again." },
      { status: 500 },
    );
  }
}
