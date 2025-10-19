"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type MarketplaceFiltersProps = {
  defaultSearch?: string;
  defaultFilter?: string;
  defaultSort?: string;
};

export function MarketplaceFilters({
  defaultSearch = "",
  defaultFilter = "all",
  defaultSort = "recent",
}: MarketplaceFiltersProps) {
  // Local state for immediate UI updates
  const [search, setSearch] = useState(defaultSearch);
  const [filter, setFilter] = useState(defaultFilter);
  const [sort, setSort] = useState(defaultSort);

  // Refs for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const filterTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Build and navigate to new URL with hard redirect (inspired by now.ts PR #75)
  // This ensures Server Component re-renders with new searchParams
  const navigateToFilters = useCallback(
    (newSearch: string, newFilter: string, newSort: string) => {
      const params = new URLSearchParams();

      if (newSearch) params.set("search", newSearch);
      if (newFilter !== "all") params.set("filter", newFilter);
      if (newSort !== "recent") params.set("sort", newSort);

      const queryString = params.toString();
      const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;

      // Hard redirect to force Server Component refresh
      window.location.href = newUrl;
    },
    [],
  );

  // Debounce search input (300ms)
  const handleSearchChange = (value: string) => {
    setSearch(value);

    clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      navigateToFilters(value, filter, sort);
    }, 300);
  };

  // Immediate navigation for filter/sort changes
  const handleFilterChange = (value: string) => {
    setFilter(value);

    clearTimeout(filterTimeoutRef.current);

    // Small delay to avoid double navigation if user changes multiple things quickly
    filterTimeoutRef.current = setTimeout(() => {
      navigateToFilters(search, value, sort);
    }, 100);
  };

  const handleSortChange = (value: string) => {
    setSort(value);

    clearTimeout(filterTimeoutRef.current);

    filterTimeoutRef.current = setTimeout(() => {
      navigateToFilters(search, filter, value);
    }, 100);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(searchTimeoutRef.current);
      clearTimeout(filterTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className="flex flex-col gap-4 md:flex-row md:items-center"
      suppressHydrationWarning
    >
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
        <Input
          placeholder="Search traders by name or bio..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Select */}
      <Select value={filter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter traders" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Traders</SelectItem>
          <SelectItem value="verified">Verified Only</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Select */}
      <Select value={sort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="winrate">Best Win Rate</SelectItem>
          <SelectItem value="followers">Most Followers</SelectItem>
          <SelectItem value="signals">Most Signals</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
