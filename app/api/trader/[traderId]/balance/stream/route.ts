/**
 * Real-time Balance Stream API
 *
 * Server-Sent Events (SSE) endpoint for real-time balance updates.
 * Listens to balanceCache events and streams updates to connected clients.
 *
 * Features:
 * - SSE streaming
 * - Authentication required
 * - Automatic reconnection support
 * - Heartbeat messages to keep connection alive
 * - Graceful disconnection handling
 *
 * @example
 * // Client-side usage
 * const eventSource = new EventSource('/api/trader/123/balance/stream');
 * eventSource.onmessage = (event) => {
 *   const balance = JSON.parse(event.data);
 *   console.log('Balance updated:', balance);
 * };
 */

import type { NextRequest } from "next/server";
import { balanceCache } from "@/lib/exchange/balance-cache";
import { logger } from "@/lib/logger";
import { getUser } from "@/lib/auth/auth-user";
import { subscribeToBalanceUpdates } from "@/lib/redis/redis-pubsub";
import type { BalanceSubscription } from "@/lib/redis/redis-pubsub";

export const dynamic = "force-dynamic";

// SSE headers
const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no", // Disable nginx buffering
};

/**
 * HEAD /api/trader/[traderId]/balance/stream
 *
 * Check if SSE is available for this trader
 * Returns 200 if balance is cached (worker is active)
 * Returns 404 if no balance available yet
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ traderId: string }> },
) {
  try {
    const { traderId } = await params;

    // Authentication check
    const user = await getUser();
    if (!user) {
      return new Response(null, { status: 401 });
    }

    // Authorization check
    if (user.id !== traderId && user.role !== "admin") {
      return new Response(null, { status: 403 });
    }

    // Check if balance is available
    const hasBalance = balanceCache.has(traderId);

    if (hasBalance) {
      return new Response(null, {
        status: 200,
        headers: {
          "X-Balance-Available": "true",
          "Cache-Control": "no-cache",
        },
      });
    }

    return new Response(null, {
      status: 404,
      headers: {
        "X-Balance-Available": "false",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    logger.error("Failed to check SSE availability", { error });
    return new Response(null, { status: 500 });
  }
}

/**
 * GET /api/trader/[traderId]/balance/stream
 *
 * Stream real-time balance updates via SSE
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ traderId: string }> },
) {
  try {
    const { traderId } = await params;

    // Authentication check
    const user = await getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Authorization check: user can only stream their own balance
    // OR admin can stream any trader's balance
    if (user.id !== traderId && user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    logger.info("SSE connection established", {
      traderId,
      userId: user.id,
    });

    // Create readable stream
    const encoder = new TextEncoder();
    let isConnectionClosed = false;
    let redisSubscription: BalanceSubscription | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial balance if available
        const initialBalance = balanceCache.get(traderId);
        if (initialBalance) {
          const data = `data: ${JSON.stringify({
            type: "balance",
            balance: initialBalance,
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Send initial connection message
        const connectMsg = `data: ${JSON.stringify({
          type: "connected",
          traderId,
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(connectMsg));

        // Subscribe to Redis pub/sub for real-time balance updates
        // This works across processes (Fly worker → Vercel serverless)
        try {
          redisSubscription = await subscribeToBalanceUpdates(
            traderId,
            (message) => {
              if (isConnectionClosed) {
                return;
              }

              try {
                const sseMessage = `data: ${JSON.stringify({
                  type: "balance",
                  balance: message.balance,
                  timestamp: message.timestamp,
                })}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));

                logger.debug("SSE balance update sent (via Redis)", {
                  traderId,
                  timestamp: message.timestamp,
                });
              } catch (error) {
                logger.error("Failed to send SSE message", { error });
              }
            },
          );

          logger.info("Redis subscription established for SSE", { traderId });
        } catch (error) {
          logger.error(
            "Failed to subscribe to Redis, falling back to local EventEmitter",
            {
              traderId,
              error,
            },
          );

          // Fallback to local EventEmitter if Redis fails
          const balanceUpdateHandler = (data: {
            traderId: string;
            balance: unknown;
            timestamp: Date;
          }) => {
            // Only send updates for this trader
            if (data.traderId !== traderId) {
              return;
            }

            if (isConnectionClosed) {
              return;
            }

            try {
              const message = `data: ${JSON.stringify({
                type: "balance",
                balance: data.balance,
                timestamp: data.timestamp.toISOString(),
              })}\n\n`;
              controller.enqueue(encoder.encode(message));

              logger.debug(
                "SSE balance update sent (via EventEmitter fallback)",
                {
                  traderId,
                  timestamp: data.timestamp,
                },
              );
            } catch (error) {
              logger.error("Failed to send SSE message", { error });
            }
          };

          // Subscribe to local EventEmitter as fallback
          balanceCache.on("balance:updated", balanceUpdateHandler);

          // Store handler for cleanup
          request.signal.addEventListener("abort", () => {
            balanceCache.off("balance:updated", balanceUpdateHandler);
          });
        }

        // Heartbeat to keep connection alive (every 30 seconds)
        const heartbeatInterval = setInterval(() => {
          if (isConnectionClosed) {
            clearInterval(heartbeatInterval);
            return;
          }

          try {
            const heartbeat = `: heartbeat ${Date.now()}\n\n`;
            controller.enqueue(encoder.encode(heartbeat));
          } catch (error) {
            logger.error("Failed to send heartbeat", { error });
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // Cleanup on connection close
        request.signal.addEventListener("abort", () => {
          logger.info("SSE connection closed", { traderId, userId: user.id });

          isConnectionClosed = true;
          clearInterval(heartbeatInterval);

          // Unsubscribe from Redis
          if (redisSubscription) {
            void redisSubscription.unsubscribe().catch((error) => {
              logger.error("Failed to unsubscribe from Redis", { error });
            });
          }

          try {
            controller.close();
          } catch {
            // Controller might already be closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: SSE_HEADERS,
    });
  } catch (error) {
    logger.error("Failed to establish SSE connection", { error });
    return new Response("Internal Server Error", { status: 500 });
  }
}
