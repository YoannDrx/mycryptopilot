/**
 * Trade History Table Component
 *
 * Displays a paginated table of trade history with filtering and sorting.
 */

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraderTrade } from "@/generated/prisma";

type TradeHistoryTableProps = {
  trades: TraderTrade[];
  className?: string;
  pageSize?: number;
};

export function TradeHistoryTable({
  trades,
  className,
  pageSize = 10,
}: TradeHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "pnl" | "symbol">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort trades
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = trade.symbol
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || trade.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort trades
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "date":
        comparison =
          new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
        break;
      case "pnl":
        comparison = Number(a.realizedPnl ?? 0) - Number(b.realizedPnl ?? 0);
        break;
      case "symbol":
        comparison = a.symbol.localeCompare(b.symbol);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedTrades.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTrades = sortedTrades.slice(startIndex, endIndex);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            <Clock className="mr-1 h-3 w-3" />
            Open
          </Badge>
        );
      case "CLOSED":
        return <Badge variant="secondary">Closed</Badge>;
      case "PARTIAL":
        return <Badge variant="outline">Partial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // PnL formatting
  const formatPnL = (pnl: number | null) => {
    if (pnl === null) return "-";

    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pnl);

    const isPositive = pnl > 0;
    const isNegative = pnl < 0;

    return (
      <div
        className={cn(
          "flex items-center font-medium",
          isPositive && "text-green-500",
          isNegative && "text-red-500",
        )}
      >
        {isPositive && <TrendingUp className="mr-1 h-4 w-4" />}
        {isNegative && <TrendingDown className="mr-1 h-4 w-4" />}
        {formatted}
      </div>
    );
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="pnl">PnL</SelectItem>
              <SelectItem value="symbol">Symbol</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="text-right">PnL</TableHead>
                <TableHead className="text-right">Fees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrades.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-muted-foreground text-center"
                  >
                    No trades found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(trade.openedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{trade.symbol}</div>
                      <div className="text-muted-foreground text-xs">
                        {trade.source}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trade.side === "BUY" ? "default" : "destructive"
                        }
                      >
                        {trade.side}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(trade.status)}</TableCell>
                    <TableCell className="text-right">
                      {Number(trade.totalQuantity).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(trade.averageEntry).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.averageExit
                        ? `$${Number(trade.averageExit).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPnL(
                        trade.realizedPnl ? Number(trade.realizedPnl) : null,
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      ${Number(trade.fees).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredTrades.length)} of{" "}
              {filteredTrades.length} trades
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
