/**
 * Unrealized PnL Hook
 *
 * Custom hook for fetching and managing unrealized PnL data.
 * Provides real-time PnL calculations with automatic caching.
 *
 * Features:
 * - Fetch PnL for single trade
 * - Fetch total PnL for trader profile
 * - Manual refresh with loading state
 * - Error handling
 * - Auto-refresh intervals (optional)
 *
 * @example
 * ```tsx
 * function TradePnLCard({ tradeId }) {
 *   const { pnl, loading, error, refresh } = useUnrealizedPnL({ tradeId });
 *
 *   if (loading) return <Skeleton />;
 *   if (error) return <Alert>Error loading PnL</Alert>;
 *
 *   return (
 *     <Card>
 *       <p>Unrealized PnL: ${pnl.unrealizedPnl.toFixed(2)}</p>
 *       <Button onClick={refresh}>Refresh</Button>
 *     </Card>
 *   );
 * }
 * ```
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { upfetch } from "@/lib/up-fetch";
import type { UnrealizedPnLResult } from "@/lib/trading/unrealized-pnl.service";

type UseSinglePnLOptions = {
  tradeId: string;
  autoRefresh?: number; // Refresh interval in milliseconds (e.g., 30000 = 30s)
  useCache?: boolean;
};

type UseTraderPnLOptions = {
  traderProfileId: string;
  autoRefresh?: number;
  useCache?: boolean;
};

type TotalPnLResult = {
  totalUnrealizedPnl: number;
  openPositionsCount: number;
  positivePnlCount: number;
  negativePnlCount: number;
  positions: UnrealizedPnLResult[];
};

/**
 * Hook for fetching unrealized PnL for a single trade
 */
export function useUnrealizedPnL({
  tradeId,
  autoRefresh,
  useCache = true,
}: UseSinglePnLOptions) {
  const [pnl, setPnl] = useState<UnrealizedPnLResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPnL = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await upfetch(
        `/api/trading/pnl/${tradeId}?useCache=${useCache}`,
        {
          method: "GET",
        },
      );

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setPnl(null);
      } else {
        setPnl(data as UnrealizedPnLResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch PnL");
      setPnl(null);
    } finally {
      setLoading(false);
    }
  }, [tradeId, useCache]);

  // Initial fetch
  useEffect(() => {
    void fetchPnL();
  }, [fetchPnL]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      void fetchPnL();
    }, autoRefresh);

    return () => clearInterval(intervalId);
  }, [autoRefresh, fetchPnL]);

  return {
    pnl,
    loading,
    error,
    refresh: fetchPnL,
  };
}

/**
 * Hook for fetching total unrealized PnL for a trader profile
 */
export function useTraderTotalPnL({
  traderProfileId,
  autoRefresh,
  useCache = true,
}: UseTraderPnLOptions) {
  const [data, setData] = useState<TotalPnLResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalPnL = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await upfetch(
        `/api/trading/pnl/trader/${traderProfileId}?useCache=${useCache}`,
        {
          method: "GET",
        },
      );

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result as TotalPnLResult);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch total PnL",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [traderProfileId, useCache]);

  // Initial fetch
  useEffect(() => {
    void fetchTotalPnL();
  }, [fetchTotalPnL]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      void fetchTotalPnL();
    }, autoRefresh);

    return () => clearInterval(intervalId);
  }, [autoRefresh, fetchTotalPnL]);

  return {
    data,
    loading,
    error,
    refresh: fetchTotalPnL,
  };
}

/**
 * Hook for manually refreshing PnL (bypasses cache)
 */
export function useRefreshPnL() {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPnL = useCallback(async (traderProfileId: string) => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await upfetch("/api/trading/pnl/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ traderProfileId }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error ?? "Failed to refresh PnL");
        return null;
      }

      return result as {
        success: true;
        positionsUpdated: number;
        totalPnl: number;
        positions: UnrealizedPnLResult[];
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh PnL";
      setError(errorMessage);
      return null;
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    refreshPnL,
    refreshing,
    error,
  };
}
