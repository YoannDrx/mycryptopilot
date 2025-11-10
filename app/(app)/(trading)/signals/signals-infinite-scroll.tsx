"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import { SignalsFeedDisplay } from "./signals-feed-display";

type Signal = {
  id: string;
  symbol: string;
  payloadJson: TradingCardPayloadType;
  createdAt: Date;
  expiresAt: Date;
  trader: {
    id: string;
    name: string | null;
    image: string | null;
    traderProfile: {
      displayName: string;
      verified: boolean;
    } | null;
  };
};

type SignalsInfiniteScrollProps = {
  initialSignals: Signal[];
  initialCursor: string | null;
  hasMore: boolean;
  filters: {
    symbols?: string[];
    bias?: "LONG" | "SHORT";
    status?: "ACTIVE" | "EXPIRED";
    instrumentType?: "SPOT" | "PERP";
    traderName?: string;
    verifiedOnly?: boolean;
  };
};

/**
 * Client component qui gère l'infinite scroll des signaux
 * Charge automatiquement la page suivante quand l'utilisateur scroll en bas
 */
export function SignalsInfiniteScroll({
  initialSignals,
  initialCursor,
  hasMore: initialHasMore,
  filters,
}: SignalsInfiniteScrollProps) {
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Reset when filters change (initialSignals change)
  useEffect(() => {
    setSignals(initialSignals);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
  }, [initialSignals, initialCursor, initialHasMore]);

  // Load more when scrolling into view
  useEffect(() => {
    if (!inView || !hasMore || isLoading || !cursor) return;

    const loadMore = async () => {
      setIsLoading(true);

      try {
        // Build query params
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (filters.symbols?.length) {
          filters.symbols.forEach((s) => params.append("symbols", s));
        }
        if (filters.bias) params.set("bias", filters.bias);
        if (filters.status) params.set("status", filters.status);
        if (filters.instrumentType)
          params.set("instrumentType", filters.instrumentType);
        if (filters.traderName) params.set("traderName", filters.traderName);
        if (filters.verifiedOnly) params.set("verifiedOnly", "true");

        // Fetch next page via API
        const response = await fetch(`/api/signals/feed?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch signals");
        }

        const data = await response.json();

        // Convert date strings to Date objects (JSON serialization)
        const newSignals = data.items.map((signal: Signal) => ({
          ...signal,
          createdAt: new Date(signal.createdAt),
          expiresAt: new Date(signal.expiresAt),
        }));

        setSignals((prev) => [...prev, ...newSignals]);
        setCursor(data.nextCursor);
        setHasMore(data.hasNextPage);
      } catch {
        // Silently fail - user can refresh to retry
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMore();
  }, [inView, hasMore, isLoading, cursor, filters]);

  return (
    <div className="space-y-6">
      {/* Signals display */}
      <SignalsFeedDisplay signals={signals} />

      {/* Infinite scroll trigger + loading indicator */}
      {hasMore && (
        <div
          ref={ref}
          className="flex justify-center py-8"
          aria-label="Loading more signals"
        >
          {isLoading && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Loading more signals...</span>
            </div>
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasMore && signals.length > 0 && (
        <div className="text-muted-foreground flex justify-center py-8 text-center text-sm">
          You've reached the end of the signals feed
        </div>
      )}
    </div>
  );
}
