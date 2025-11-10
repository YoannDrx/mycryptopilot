"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";

type Trader = {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  verified: boolean;
  statsJson: unknown;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

type TradersInfiniteScrollProps = {
  initialTraders: Trader[];
  initialCursor: string | null;
  hasMore: boolean;
  filters: {
    search?: string;
    verified?: boolean;
    sort?: string;
  };
  renderTraders: (traders: Trader[]) => React.ReactNode;
};

/**
 * Client component qui gère l'infinite scroll des traders
 * Charge automatiquement la page suivante quand l'utilisateur scroll en bas
 */
export function TradersInfiniteScroll({
  initialTraders,
  initialCursor,
  hasMore: initialHasMore,
  filters,
  renderTraders,
}: TradersInfiniteScrollProps) {
  const [traders, setTraders] = useState<Trader[]>(initialTraders);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Reset when filters change (initialTraders change)
  useEffect(() => {
    setTraders(initialTraders);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
  }, [initialTraders, initialCursor, initialHasMore]);

  // Load more when scrolling into view
  useEffect(() => {
    if (!inView || !hasMore || isLoading || !cursor) return;

    const loadMore = async () => {
      setIsLoading(true);

      try {
        // Build query params
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (filters.search) params.set("search", filters.search);
        if (filters.verified !== undefined)
          params.set("verified", String(filters.verified));
        if (filters.sort) params.set("sort", filters.sort);

        // Fetch next page via API
        const response = await fetch(
          `/api/traders/search?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch traders");
        }

        const data = await response.json();

        // Deduplicate traders by userId to prevent duplicate key warnings
        setTraders((prev) => {
          const existingIds = new Set(prev.map((t) => t.userId));
          const newTraders = data.items.filter(
            (t: Trader) => !existingIds.has(t.userId),
          );
          return [...prev, ...newTraders];
        });
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
      {/* Traders display */}
      {renderTraders(traders)}

      {/* Infinite scroll trigger + loading indicator */}
      {hasMore && (
        <div
          ref={ref}
          className="flex justify-center py-8"
          aria-label="Loading more traders"
        >
          {isLoading && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Loading more traders...</span>
            </div>
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasMore && traders.length > 0 && (
        <div className="text-muted-foreground flex justify-center py-8 text-center text-sm">
          You've reached the end of the traders list
        </div>
      )}
    </div>
  );
}
