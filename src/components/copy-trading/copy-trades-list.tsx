/**
 * Copy Trades List Component
 *
 * Displays a list of user's copy trades with status and management options.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopyTrade, TraderTrade } from "@/generated/prisma";

type CopyTradeWithRelations = CopyTrade & {
  originalTrade: TraderTrade;
};

type CopyTradesListProps = {
  copyTrades: CopyTradeWithRelations[];
  onCancel?: (copyTradeId: string) => void;
  onExecute?: (copyTradeId: string) => void;
  className?: string;
};

export function CopyTradesList({
  copyTrades,
  onCancel,
  onExecute,
  className,
}: CopyTradesListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter trades
  const filteredTrades = copyTrades.filter((trade) => {
    const matchesStatus =
      statusFilter === "ALL" || trade.status === statusFilter;
    const matchesMode = modeFilter === "ALL" || trade.mode === modeFilter;
    return matchesStatus && matchesMode;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  // Group trades by status
  const pendingTrades = copyTrades.filter((t) => t.status === "PENDING");
  const executedTrades = copyTrades.filter((t) => t.status === "EXECUTED");
  const failedTrades = copyTrades.filter((t) => t.status === "FAILED");

  // Calculate metrics
  const totalVolume = executedTrades.reduce(
    (sum, trade) =>
      sum +
      (trade.executedQuantity && trade.executedPrice
        ? Number(trade.executedQuantity) * Number(trade.executedPrice)
        : 0),
    0,
  );

  const avgSlippage =
    executedTrades.length > 0
      ? executedTrades.reduce(
          (sum, trade) => sum + Number(trade.slippage ?? 0),
          0,
        ) / executedTrades.length
      : 0;

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "EXECUTED":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Executed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="secondary">
            <X className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Mode badge
  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "MANUAL":
        return (
          <Badge variant="outline">
            <Copy className="mr-1 h-3 w-3" />
            Manual
          </Badge>
        );
      case "AUTO":
        return (
          <Badge variant="default">
            <CheckCircle className="mr-1 h-3 w-3" />
            Auto
          </Badge>
        );
      default:
        return <Badge>{mode}</Badge>;
    }
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Format slippage
  const formatSlippage = (slippage: number | null) => {
    if (slippage === null) return "-";
    const isPositive = slippage > 0;
    const isNegative = slippage < 0;

    return (
      <div
        className={cn(
          "flex items-center text-sm font-medium",
          isPositive && "text-red-500",
          isNegative && "text-green-500",
        )}
      >
        {isPositive && <TrendingUp className="mr-1 h-3 w-3" />}
        {isNegative && <TrendingDown className="mr-1 h-3 w-3" />}
        {Math.abs(slippage).toFixed(2)}%
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Copy Trades</CardTitle>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="text-xl font-bold">{copyTrades.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Pending</p>
            <p className="text-xl font-bold text-blue-500">
              {pendingTrades.length}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Volume</p>
            <p className="text-xl font-bold">${totalVolume.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Avg Slippage</p>
            <p className="text-xl font-bold">{avgSlippage.toFixed(2)}%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingTrades.length})
            </TabsTrigger>
            <TabsTrigger value="executed">
              Executed ({executedTrades.length})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({failedTrades.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {/* Filters */}
            <div className="mb-4 flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="EXECUTED">Executed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Modes</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="AUTO">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Slippage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTrades.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-muted-foreground text-center"
                      >
                        No copy trades found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(trade.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {trade.originalTrade.symbol}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {trade.originalTrade.side}
                          </div>
                        </TableCell>
                        <TableCell>{getModeBadge(trade.mode)}</TableCell>
                        <TableCell>{getStatusBadge(trade.status)}</TableCell>
                        <TableCell className="text-right">
                          {trade.executedQuantity
                            ? Number(trade.executedQuantity).toFixed(4)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {trade.executedPrice
                            ? `$${Number(trade.executedPrice).toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatSlippage(
                            trade.slippage ? Number(trade.slippage) : null,
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {trade.status === "PENDING" && (
                            <div className="flex justify-end gap-1">
                              {onExecute && trade.mode === "AUTO" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onExecute(trade.id)}
                                >
                                  Execute
                                </Button>
                              )}
                              {onCancel && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onCancel(trade.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          )}
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
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <CopyTradesTable
              trades={pendingTrades}
              onCancel={onCancel}
              onExecute={onExecute}
            />
          </TabsContent>

          <TabsContent value="executed" className="mt-4">
            <CopyTradesTable trades={executedTrades} />
          </TabsContent>

          <TabsContent value="failed" className="mt-4">
            <CopyTradesTable trades={failedTrades} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Simple table component for tab content
function CopyTradesTable({
  trades,
  onCancel,
  onExecute,
}: {
  trades: CopyTradeWithRelations[];
  onCancel?: (id: string) => void;
  onExecute?: (id: string) => void;
}) {
  if (trades.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No trades in this category
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{trade.originalTrade.symbol}</TableCell>
              <TableCell>
                {new Date(trade.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge
                  variant={trade.mode === "MANUAL" ? "outline" : "default"}
                >
                  {trade.mode}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {trade.status === "PENDING" && (
                  <div className="flex justify-end gap-1">
                    {onExecute && trade.mode === "AUTO" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExecute(trade.id)}
                      >
                        Execute
                      </Button>
                    )}
                    {onCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancel(trade.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
