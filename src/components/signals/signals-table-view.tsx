"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SignalForTable = {
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

type SignalsTableViewProps = {
  signals: SignalForTable[];
};

export function SignalsTableView({ signals }: SignalsTableViewProps) {
  if (signals.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">No signals found</p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead>Bias</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Invalidation</TableHead>
              <TableHead>Take Profits</TableHead>
              <TableHead className="text-center">Risk</TableHead>
              <TableHead className="text-center">Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => {
              const payload = signal.payloadJson;
              const isExpired = signal.expiresAt < now;
              const isLong = payload.bias === "LONG";
              const timeLeft = signal.expiresAt.getTime() - now.getTime();
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              const traderDisplayName =
                signal.trader.traderProfile?.displayName ?? signal.trader.name;

              return (
                <TableRow
                  key={signal.id}
                  className={cn(isExpired && "opacity-50")}
                >
                  {/* Symbol */}
                  <TableCell className="font-medium">{signal.symbol}</TableCell>

                  {/* Trader */}
                  <TableCell>
                    <Link
                      href={`/traders/${signal.trader.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Avatar className="size-6">
                        <AvatarImage
                          src={signal.trader.image ?? undefined}
                          alt={traderDisplayName ?? "Trader"}
                        />
                        <AvatarFallback className="text-xs">
                          {traderDisplayName?.[0]?.toUpperCase() ?? "T"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{traderDisplayName}</span>
                      {signal.trader.traderProfile?.verified && (
                        <Badge
                          variant="outline"
                          className="ml-1 size-4 rounded-full p-0"
                        >
                          ✓
                        </Badge>
                      )}
                    </Link>
                  </TableCell>

                  {/* Bias */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1",
                        isLong
                          ? "border-green-500/50 text-green-500"
                          : "border-red-500/50 text-red-500",
                      )}
                    >
                      {isLong ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      {payload.bias}
                    </Badge>
                  </TableCell>

                  {/* Entry */}
                  <TableCell className="text-right font-mono text-sm">
                    ${payload.entry.toLocaleString()}
                  </TableCell>

                  {/* Invalidation */}
                  <TableCell className="text-destructive text-right font-mono text-sm">
                    ${payload.invalidation.toLocaleString()}
                  </TableCell>

                  {/* Take Profits (collapsed) */}
                  <TableCell>
                    <div className="flex gap-1">
                      {payload.tps.slice(0, 2).map((tp, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          TP{idx + 1}
                        </Badge>
                      ))}
                      {payload.tps.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{payload.tps.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Risk */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="text-muted-foreground size-3" />
                      <span className="text-sm font-medium">
                        {payload.risk}/5
                      </span>
                    </div>
                  </TableCell>

                  {/* Confidence */}
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {payload.confidence}%
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {isExpired ? (
                      <Badge variant="outline" className="text-destructive">
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600">
                        {hoursLeft}h left
                      </Badge>
                    )}
                  </TableCell>

                  {/* Created */}
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(signal.createdAt, {
                      addSuffix: true,
                    })}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="size-8 p-0"
                    >
                      <Link href={`/signals/${signal.id}`}>
                        <Target className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
