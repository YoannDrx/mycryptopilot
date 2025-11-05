/**
 * Unrealized PnL Card Component
 *
 * Displays real-time unrealized PnL for a trader's open positions.
 * Uses Redis caching with automatic refresh intervals.
 *
 * Features:
 * - Real-time PnL display with auto-refresh (every 30s)
 * - Manual refresh button
 * - Loading states and error handling
 * - Positive/negative color indicators
 * - Position breakdown (winning vs losing trades)
 * - Cache indicator badge
 *
 * @example
 * ```tsx
 * <UnrealizedPnLCard traderProfileId="profile_123" />
 * ```
 */

"use client";

import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useTraderTotalPnL, useRefreshPnL } from "@/hooks/use-unrealized-pnl";

type UnrealizedPnLCardProps = {
  traderProfileId: string;
  autoRefresh?: boolean; // Enable auto-refresh every 30s
  className?: string;
};

export function UnrealizedPnLCard({
  traderProfileId,
  autoRefresh = true,
  className,
}: UnrealizedPnLCardProps) {
  const { data, loading, error, refresh } = useTraderTotalPnL({
    traderProfileId,
    autoRefresh: autoRefresh ? 30000 : undefined, // 30 seconds
    useCache: true,
  });

  const { refreshPnL, refreshing } = useRefreshPnL();

  const handleRefresh = async () => {
    const result = await refreshPnL(traderProfileId);
    if (result) {
      // Trigger hook refresh to update UI
      await refresh();
    }
  };

  // Loading state
  if (loading && !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Unrealized PnL</span>
            <Skeleton className="h-6 w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Unrealized PnL</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {error ?? "Failed to load PnL data"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isProfitable = data.totalUnrealizedPnl > 0;
  const isBreakEven = data.totalUnrealizedPnl === 0;

  // Check if data is from cache
  const fromCache = data.positions.some((pos) => pos.fromCache);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Unrealized PnL</span>
          <div className="flex items-center gap-2">
            {fromCache && (
              <Badge variant="outline" className="text-xs">
                Cached
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="h-8 w-8"
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total PnL Display */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Total Unrealized</p>
            <div className="flex items-center gap-2">
              {isProfitable ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : isBreakEven ? null : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <p
                className={cn(
                  "text-2xl font-bold",
                  isProfitable && "text-green-500",
                  !isProfitable && !isBreakEven && "text-red-500",
                )}
              >
                ${data.totalUnrealizedPnl.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-muted-foreground text-sm">Open Positions</p>
            <p className="text-2xl font-bold">{data.openPositionsCount}</p>
          </div>
        </div>

        {/* Position Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-green-500/5 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-600">Winning</p>
              <Badge variant="secondary" className="bg-green-500/10">
                {data.positivePnlCount}
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border bg-red-500/5 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">Losing</p>
              <Badge variant="secondary" className="bg-red-500/10">
                {data.negativePnlCount}
              </Badge>
            </div>
          </div>
        </div>

        {/* Top Positions Preview (optional) */}
        {data.positions.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">
              Top Positions
            </p>
            <div className="space-y-2">
              {data.positions
                .slice(0, 3)
                .sort(
                  (a, b) =>
                    Math.abs(b.unrealizedPnl) - Math.abs(a.unrealizedPnl),
                )
                .map((position) => (
                  <div
                    key={position.tradeId}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{position.symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        {position.side}
                      </Badge>
                    </div>
                    <span
                      className={cn(
                        "font-medium",
                        position.unrealizedPnl > 0 && "text-green-500",
                        position.unrealizedPnl < 0 && "text-red-500",
                      )}
                    >
                      ${position.unrealizedPnl.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        {autoRefresh && (
          <p className="text-muted-foreground text-center text-xs">
            Auto-refreshing every 30 seconds
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Single Trade PnL Badge
 *
 * Compact display for single trade unrealized PnL
 */
export function TradePnLBadge({
  tradeId,
  className,
}: {
  tradeId: string;
  className?: string;
}) {
  const { data, loading, error } = useTraderTotalPnL({
    traderProfileId: tradeId,
    useCache: true,
  });

  if (loading || error || !data) {
    return <Badge variant="outline">--</Badge>;
  }

  const isProfitable = data.totalUnrealizedPnl > 0;

  return (
    <Badge
      variant="outline"
      className={cn(
        className,
        isProfitable && "border-green-500/50 bg-green-500/10 text-green-600",
        !isProfitable && "border-red-500/50 bg-red-500/10 text-red-600",
      )}
    >
      {isProfitable ? "+" : ""}${data.totalUnrealizedPnl.toFixed(2)}
    </Badge>
  );
}
