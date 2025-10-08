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
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const filterOptions = ["all", "verified"] as const;
const sortOptions = ["recent", "winrate", "followers", "signals"] as const;

const marketplaceSearchParams = {
  search: parseAsString.withDefault(""),
  filter: parseAsStringLiteral(filterOptions).withDefault("all"),
  sort: parseAsStringLiteral(sortOptions).withDefault("recent"),
};

type MarketplaceFiltersProps = {
  defaultSearch?: string;
  defaultFilter?: string;
  defaultSort?: string;
};

export function MarketplaceFilters({
  defaultSearch: _defaultSearch = "",
  defaultFilter: _defaultFilter = "all",
  defaultSort: _defaultSort = "recent",
}: MarketplaceFiltersProps) {
  const [filters, setFilters] = useQueryStates(marketplaceSearchParams, {
    shallow: false,
    throttleMs: 500,
  });

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
        <Input
          placeholder="Search traders by name or bio..."
          value={filters.search}
          onChange={(e) => {
            void setFilters({
              search: e.target.value,
            });
          }}
          className="pl-10"
        />
      </div>

      {/* Filter Select */}
      <Select
        value={filters.filter}
        onValueChange={(value) => {
          void setFilters({
            filter: value as (typeof filterOptions)[number],
          });
        }}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter traders" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Traders</SelectItem>
          <SelectItem value="verified">Verified Only</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Select */}
      <Select
        value={filters.sort}
        onValueChange={(value) => {
          void setFilters({
            sort: value as (typeof sortOptions)[number],
          });
        }}
      >
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
