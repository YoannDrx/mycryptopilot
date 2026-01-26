/**
 * useRealtimeBalance Hook
 *
 * React hook for real-time balance updates via Server-Sent Events.
 *
 * Features:
 * - Automatic connection management
 * - Reconnection on error
 * - TypeScript types
 * - Loading and error states
 * - Cleanup on unmount
 *
 * @example
 * function TraderBalance({ traderId }: { traderId: string }) {
 *   const { balance, isLoading, error } = useRealtimeBalance(traderId);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!balance) return <div>No balance data</div>;
 *
 *   return (
 *     <div>
 *       <p>Total Equity: ${balance.totalEquityUsd.toFixed(2)}</p>
 *       <p>Last Updated: {new Date(balance.timestamp).toLocaleString()}</p>
 *     </div>
 *   );
 * }
 */

import { useState, useEffect, useCallback } from "react";
import type { ConsolidatedBalance } from "@/lib/exchange/types";

type RealtimeBalanceState = {
  balance: ConsolidatedBalance | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
};

type RealtimeBalanceHook = RealtimeBalanceState & {
  reconnect: () => void;
};

/**
 * Hook for real-time balance updates via SSE
 *
 * @param traderId - Trader ID to subscribe to
 * @param enabled - Whether to enable the connection (default: true)
 * @returns Balance state and control functions
 */
export function useRealtimeBalance(
  traderId: string,
  enabled = true,
): RealtimeBalanceHook {
  const [state, setState] = useState<RealtimeBalanceState>({
    balance: null,
    isLoading: true,
    error: null,
    isConnected: false,
    lastUpdate: null,
  });

  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const reconnect = useCallback(() => {
    setReconnectTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        // Create EventSource connection
        eventSource = new EventSource(`/api/trader/${traderId}/balance/stream`);

        eventSource.onopen = () => {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isConnected: true,
            error: null,
          }));
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as
              | {
                  type: "balance";
                  balance: ConsolidatedBalance;
                  timestamp: string;
                }
              | { type: "connected"; traderId: string; timestamp: string };

            if (data.type === "balance") {
              setState((prev) => ({
                ...prev,
                balance: data.balance,
                lastUpdate: new Date(data.timestamp),
                isLoading: false,
                error: null,
              }));
            }
            // "connected" type is handled in onopen
          } catch {
            // Silent error - SSE messages can be heartbeats or other types
          }
        };

        eventSource.onerror = () => {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            error: "Connection lost. Reconnecting...",
          }));

          // Close connection
          eventSource?.close();

          // Reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 5000);
        };
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isConnected: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to connect to balance stream",
        }));
      }
    };

    // Initial connection
    connect();

    // Cleanup
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [traderId, enabled, reconnectTrigger]);

  return {
    ...state,
    reconnect,
  };
}

/**
 * Hook for checking if real-time balance updates are available
 *
 * @param traderId - Trader ID to check
 * @returns Whether real-time updates are available
 */
export function useRealtimeBalanceAvailable(traderId: string): boolean {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if EventSource is supported
    if (typeof EventSource === "undefined") {
      setIsAvailable(false);
      return;
    }

    // Ping health check to see if worker is running
    fetch(`/api/trader/${traderId}/balance/stream`, {
      method: "HEAD",
    })
      .then((res) => {
        setIsAvailable(res.ok);
      })
      .catch(() => {
        setIsAvailable(false);
      });
  }, [traderId]);

  return isAvailable;
}
