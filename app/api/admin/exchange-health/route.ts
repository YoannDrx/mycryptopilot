import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import {
  decryptApiKey,
  decryptSerializedPayload,
  decryptOptionalSerializedPayload,
} from "@/lib/crypto/encryption-service";
import { BinanceService } from "@/lib/exchange/binance-service";
import { BybitService } from "@/lib/exchange/bybit-service";
import { createExchangeService } from "@/lib/exchange/exchange-service-factory";
import { logger } from "@/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Admin Exchange Health Check API
 *
 * GET /api/admin/exchange-health?traderId=xxx
 *
 * Tests exchange connection for a trader and returns health status.
 *
 * Security:
 * - Admin-only endpoint (checks user role)
 * - Does NOT return API keys in response
 * - Only returns connection status and metadata
 *
 * Response:
 * {
 *   success: boolean;
 *   trader: { id, displayName, exchange };
 *   connection: {
 *     status: 'OK' | 'ERROR';
 *     canTrade: boolean;
 *     permissions: string[];
 *     lastSynced: string;
 *   };
 *   rateLimit?: {
 *     used: number;
 *     max: number;
 *     percentage: number;
 *   };
 *   error?: string;
 * }
 */

type HealthCheckResponse = {
  success: boolean;
  trader?: {
    id: string;
    displayName: string;
    exchange: string;
  };
  connection?: {
    status: "OK" | "ERROR";
    isValid: boolean;
    isReadOnly: boolean;
    hasSpotEnabled: boolean;
    hasFuturesEnabled: boolean;
    lastSynced: string | null;
    lastSyncError: string | null;
  };
  rateLimit?: {
    info: string;
    warning?: string;
  };
  error?: string;
};

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const user = await getRequiredUser();

    // Check if user is admin (you might have a different role check)
    // For now, we'll check if user has a specific role or is part of admin group
    // Adjust this based on your actual auth implementation
    const isAdmin =
      user.role === "ADMIN" || user.email === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      logger.warn("Non-admin user attempted to access exchange health", {
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // 2. Get trader ID from query params
    const { searchParams } = new URL(request.url);
    const traderId = searchParams.get("traderId");

    if (!traderId) {
      return NextResponse.json(
        { success: false, error: "Missing traderId parameter" },
        { status: 400 },
      );
    }

    // 3. Get trader connection
    const connection = await prisma.exchangeConnection.findFirst({
      where: {
        traderProfileId: traderId,
        isActive: true,
      },
      include: {
        trader: {
          select: {
            id: true,
            displayName: true,
            userId: true,
          },
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: `No active exchange connection found for trader ${traderId}`,
        },
        { status: 404 },
      );
    }

    logger.info("Admin checking exchange health", {
      adminUserId: user.id,
      traderId,
      exchange: connection.exchange,
    });

    // 4. Decrypt API keys
    let apiKey: string;
    let secretKey: string;
    let passphrase: string | null = null;

    try {
      apiKey = decryptApiKey(
        connection.encryptedApiKey,
        connection.keyIv,
        connection.keyTag,
      );

      secretKey = decryptSerializedPayload(
        connection.encryptedSecretKey,
        connection.keyIv,
        connection.keyTag,
      );
      passphrase = decryptOptionalSerializedPayload(
        connection.encryptedPassphrase,
        connection.keyIv,
        connection.keyTag,
      );
    } catch (error) {
      logger.error("Failed to decrypt API keys for health check", {
        traderId,
        error,
      });

      return NextResponse.json(
        {
          success: false,
          trader: {
            id: connection.trader.id,
            displayName: connection.trader.displayName,
            exchange: connection.exchange,
          },
          connection: {
            status: "ERROR" as const,
            isValid: false,
            isReadOnly: false,
            hasSpotEnabled: false,
            hasFuturesEnabled: false,
            lastSynced: connection.lastSyncedAt?.toISOString() ?? null,
            lastSyncError: connection.lastSyncError ?? null,
          },
          error: "Failed to decrypt API keys",
        },
        { status: 200 }, // Return 200 even on connection error
      );
    }

    // 5. Test connection based on exchange
    let validationResult;

    try {
      if (connection.exchange === "BINANCE") {
        const service = new BinanceService(apiKey, secretKey);
        validationResult = await service.validateApiKeys();
        await service.close();
      } else if (connection.exchange === "BYBIT") {
        // BYBIT
        const service = new BybitService(apiKey, secretKey);
        validationResult = await service.validateApiKeys();
        await service.close();
      } else {
        const service = createExchangeService(
          connection.exchange,
          apiKey,
          secretKey,
          {
            passphrase,
            bitgetAccountMode: connection.bitgetAccountMode ?? undefined,
          },
        );
        validationResult = await service.testConnection();
        await service.close();
      }
    } catch (error) {
      logger.error("Failed to validate exchange connection", {
        traderId,
        exchange: connection.exchange,
        error,
      });

      return NextResponse.json(
        {
          success: false,
          trader: {
            id: connection.trader.id,
            displayName: connection.trader.displayName,
            exchange: connection.exchange,
          },
          connection: {
            status: "ERROR" as const,
            isValid: false,
            isReadOnly: false,
            hasSpotEnabled: false,
            hasFuturesEnabled: false,
            lastSynced: connection.lastSyncedAt?.toISOString() ?? null,
            lastSyncError: connection.lastSyncError ?? null,
          },
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 200 },
      );
    }

    // 6. Build response
    const response: HealthCheckResponse = {
      success: true,
      trader: {
        id: connection.trader.id,
        displayName: connection.trader.displayName,
        exchange: connection.exchange,
      },
      connection: {
        status: validationResult.isValid ? "OK" : "ERROR",
        isValid: validationResult.isValid,
        isReadOnly: validationResult.isReadOnly,
        hasSpotEnabled: validationResult.hasSpotEnabled,
        hasFuturesEnabled: validationResult.hasFuturesEnabled,
        lastSynced: connection.lastSyncedAt?.toISOString() ?? null,
        lastSyncError: connection.lastSyncError ?? null,
      },
      rateLimit: {
        info: "Rate limit managed by ccxt (automatic throttling)",
        warning:
          connection.exchange === "BINANCE"
            ? "Detailed rate limit will be available after SDK migration"
            : "Bybit: 100 req/s (standard), will upgrade to 400 req/s with SDK migration",
      },
    };

    if (!validationResult.isValid) {
      response.error = validationResult.errorMessage;
    }

    logger.info("Exchange health check completed", {
      traderId,
      status: response.connection?.status,
      isValid: validationResult.isValid,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error("Exchange health check failed", { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
