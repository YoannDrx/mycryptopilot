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
import { Badge } from "@/components/ui/badge";
import { useQueryStates, parseAsString, parseAsArrayOf } from "nuqs";
import { X, Filter } from "lucide-react";
import { useState } from "react";

type SignalsFiltersProps = {
  totalSignals?: number;
};

const POPULAR_SYMBOLS = [
  "BTC-USDT",
  "ETH-USDT",
  "SOL-USDT",
  "BNB-USDT",
  "XRP-USDT",
  "ADA-USDT",
  "AVAX-USDT",
  "DOT-USDT",
];

export function SignalsFilters({ totalSignals }: SignalsFiltersProps) {
  const [filters, setFilters] = useQueryStates(
    {
      symbols: parseAsArrayOf(parseAsString),
      bias: parseAsString,
      status: parseAsString,
      traderName: parseAsString,
      instrumentType: parseAsString,
      verifiedOnly: parseAsString,
    },
    {
      // Force server-side re-fetch on filter changes (not shallow navigation)
      shallow: false,
    },
  );

  const [symbolInput, setSymbolInput] = useState("");

  // Add symbol to filters
  const addSymbol = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    if (!upperSymbol) return;

    const currentSymbols = filters.symbols ?? [];
    if (!currentSymbols.includes(upperSymbol)) {
      void setFilters({ symbols: [...currentSymbols, upperSymbol] });
    }
    setSymbolInput("");
  };

  // Remove symbol from filters
  const removeSymbol = (symbol: string) => {
    const currentSymbols = filters.symbols ?? [];
    void setFilters({
      symbols: currentSymbols.filter((s) => s !== symbol),
    });
  };

  // Clear all filters
  const clearFilters = () => {
    void setFilters({
      symbols: null,
      bias: null,
      status: null,
      traderName: null,
      instrumentType: null,
      verifiedOnly: null,
    });
    setSymbolInput("");
  };

  // Count active filters
  const activeFiltersCount = [
    filters.symbols?.length,
    filters.bias,
    filters.status,
    filters.traderName,
    filters.instrumentType,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground size-4" />
          <h3 className="font-semibold">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <SelectItem value="LONG">Long</SelectItem>
              <SelectItem value="SHORT">Short</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) =>
              void setFilters({ status: value === "all" ? null : value })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Instrument Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="instrumentType">Instrument</Label>
          <Select
            value={filters.instrumentType ?? "all"}
            onValueChange={(value) =>
              void setFilters({
                instrumentType: value === "all" ? null : value,
              })
            }
          >
            <SelectTrigger id="instrumentType">
              <SelectValue placeholder="All instruments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All instruments</SelectItem>
              <SelectItem value="SPOT">Spot</SelectItem>
              <SelectItem value="PERP">Perpetual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trader Name Search */}
        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <Label htmlFor="traderName">Trader</Label>
          <Input
            id="traderName"
            placeholder="Search by trader name..."
            value={filters.traderName ?? ""}
            onChange={(e) =>
              void setFilters({ traderName: e.target.value || null })
            }
          />
        </div>

        {/* Verified Only Filter */}
        <div className="space-y-2">
          <Label htmlFor="verifiedOnly">Verified traders only</Label>
          <Select
            value={filters.verifiedOnly ?? "false"}
            onValueChange={(value) =>
              void setFilters({
                verifiedOnly: value === "true" ? "true" : null,
              })
            }
          >
            <SelectTrigger id="verifiedOnly">
              <SelectValue placeholder="All traders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">All traders</SelectItem>
              <SelectItem value="true">Verified only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Symbols Filter */}
      <div className="space-y-2">
        <Label htmlFor="symbolInput">Assets</Label>
        <div className="flex gap-2">
          <Input
            id="symbolInput"
            placeholder="Add asset (e.g., BTC-USDT)"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSymbol(symbolInput);
              }
            }}
          />
          <Button onClick={() => addSymbol(symbolInput)} size="sm">
            Add
          </Button>
        </div>

        {/* Popular symbols */}
        <div className="flex flex-wrap gap-2">
          {POPULAR_SYMBOLS.map((symbol) => (
            <Button
              key={symbol}
              variant="outline"
              size="sm"
              onClick={() => addSymbol(symbol)}
              className="h-7"
            >
              {symbol}
            </Button>
          ))}
        </div>

        {/* Selected symbols */}
        {filters.symbols && filters.symbols.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.symbols.map((symbol) => (
              <Badge key={symbol} variant="secondary" className="gap-1">
                {symbol}
                <button
                  onClick={() => removeSymbol(symbol)}
                  className="hover:bg-muted-foreground/20 ml-1 rounded-full"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {totalSignals !== undefined && (
        <div className="text-muted-foreground border-t pt-3 text-sm">
          {totalSignals} signal{totalSignals !== 1 ? "s" : ""} found
        </div>
      )}
    </div>
  );
}
