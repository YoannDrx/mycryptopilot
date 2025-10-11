"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryStates, parseAsString } from "nuqs";
import { X } from "lucide-react";

type SignalsFiltersProps = {
  orgSlug: string;
};

export function SignalsFilters({ orgSlug: _orgSlug }: SignalsFiltersProps) {
  const [filters, setFilters] = useQueryStates({
    symbol: parseAsString,
    bias: parseAsString,
    status: parseAsString,
    trader: parseAsString,
  });

  const handleClearFilters = () => {
    void setFilters({
      symbol: null,
      bias: null,
      status: null,
      trader: null,
    });
  };

  const hasActiveFilters =
    filters.symbol ?? filters.bias ?? filters.status ?? filters.trader;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Symbol Filter */}
        <div className="space-y-2">
          <Label htmlFor="symbol">Asset</Label>
          <Input
            id="symbol"
            placeholder="e.g., BTC-USDT"
            value={filters.symbol ?? ""}
            onChange={(e) =>
              void setFilters({ symbol: e.target.value || null })
            }
          />
        </div>

        {/* Bias Filter */}
        <div className="space-y-2">
          <Label htmlFor="bias">Direction</Label>
          <Select
            value={filters.bias ?? "all"}
            onValueChange={(value) =>
              void setFilters({ bias: value === "all" ? null : value })
            }
          >
            <SelectTrigger id="bias">
              <SelectValue placeholder="All directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All directions</SelectItem>
              <SelectItem value="LONG">Long only</SelectItem>
              <SelectItem value="SHORT">Short only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status ?? "ACTIVE"}
            onValueChange={(value) =>
              void setFilters({ status: value === "all" ? null : value })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Active signals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All signals</SelectItem>
              <SelectItem value="ACTIVE">Active only</SelectItem>
              <SelectItem value="EXPIRED">Expired only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trader Filter */}
        <div className="space-y-2">
          <Label htmlFor="trader">Trader ID</Label>
          <Input
            id="trader"
            placeholder="Filter by trader..."
            value={filters.trader ?? ""}
            onChange={(e) =>
              void setFilters({ trader: e.target.value || null })
            }
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="size-4" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
