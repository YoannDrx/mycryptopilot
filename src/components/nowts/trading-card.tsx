"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import {
  ArrowDown,
  ArrowUp,
  Target,
  TrendingDown,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChartImageViewer } from "./chart-image-viewer";
import { CopyTradeButton } from "./copy-trade-button";

export type TradingCardProps = {
  symbol: string;
  payload: TradingCardPayloadType;
  traderId?: string;
  traderName?: string;
  createdAt?: Date;
  expiresAt?: Date;
  className?: string;
  compact?: boolean; // New prop to enable compact mode
  /** Signal ID for copy trading functionality */
  signalId?: string;
  /** User's current plan for copy trading access check */
  userPlan?: string | null;
  /** Whether to show copy trade button */
  showCopyButton?: boolean;
};

export const TradingCard = ({
  symbol,
  payload,
  traderName,
  expiresAt,
  className,
  compact = false,
  signalId,
  userPlan,
  showCopyButton = false,
}: TradingCardProps) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const isLong = payload.bias === "LONG";
  const biasColor = isLong ? "text-[#00ffaa]" : "text-[#ff3366]";

  // Calculate time to expiry
  const now = new Date();
  const timeLeft = expiresAt ? expiresAt.getTime() - now.getTime() : null;
  const hoursLeft = timeLeft ? Math.floor(timeLeft / (1000 * 60 * 60)) : null;
  const isExpired = timeLeft !== null && timeLeft <= 0;

  return (
    <div className={cn("relative", className)} data-testid="trading-card">
      <Card
        variant="hyper"
        className={cn(
          "relative overflow-hidden rounded-xl transition-all duration-200",
          isLong
            ? "border-[#00ffaa]/40 shadow-[0_0_20px_rgba(0,255,170,0.1)] hover:border-[#00ffaa]/60 hover:shadow-[0_0_30px_rgba(0,255,170,0.15)]"
            : "border-[#ff3366]/40 shadow-[0_0_20px_rgba(255,51,102,0.1)] hover:border-[#ff3366]/60 hover:shadow-[0_0_30px_rgba(255,51,102,0.15)]",
          isExpired && "opacity-50",
        )}
      >
        <CardHeader
          className={cn(
            "relative z-10",
            compact ? "pt-4 pb-3" : "pt-6 pb-4",
            compact && "cursor-pointer",
          )}
          onClick={(e) => {
            if (compact) {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          {/* Content layout - different for compact vs expanded */}
          {compact && !isExpanded ? (
            // Compact mode - optimized layout
            <div className="space-y-3">
              {/* Top row: Symbol, Bias, Chevron */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 font-bold",
                      biasColor,
                    )}
                  >
                    {isLong ? (
                      <TrendingUp className="size-5" />
                    ) : (
                      <TrendingDown className="size-5" />
                    )}
                    <span className="text-xl tracking-tight">
                      {payload.bias}
                    </span>
                  </div>
                  <span className="text-lg font-bold">{symbol}</span>
                </div>
                <ChevronDown className="size-5 flex-shrink-0 transition-transform duration-300" />
              </div>

              {/* Bottom row: Entry, Type, Leverage */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-xs">Entry:</span>
                  <span className="text-sm font-bold">
                    ${Number(payload.entry).toFixed(2)}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>{payload.instrumentType}</span>
                  <span>•</span>
                  <span>{payload.leverageBand}</span>
                </div>
              </div>
            </div>
          ) : (
            // Expanded mode - original layout
            <div className="flex items-start justify-between">
              {/* Symbol & Bias */}
              <div className="flex items-center gap-3">
                <div
                  className={cn("flex items-center gap-2 font-bold", biasColor)}
                >
                  {isLong ? (
                    <TrendingUp className="size-6" />
                  ) : (
                    <TrendingDown className="size-6" />
                  )}
                  <span className="text-2xl tracking-tight">
                    {payload.bias}
                  </span>
                </div>
                <span className="text-xl font-bold">{symbol}</span>
              </div>

              {/* Type & Leverage - badges */}
              <div className="flex flex-col items-end gap-2">
                <Badge variant="glass" className="text-xs">
                  {payload.instrumentType}
                </Badge>
                <Badge variant="glass" className="text-xs">
                  {payload.leverageBand}
                </Badge>
              </div>
            </div>
          )}

          {/* Trader Info */}
          {traderName && (
            <div className="text-muted-foreground mt-3 text-sm">
              By <span className="font-medium">{traderName}</span>
            </div>
          )}
        </CardHeader>

        {(!compact || isExpanded) && (
          <CardContent className="relative z-10 pt-4 pb-6">
            {/* Entry & Invalidation */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-3">
                <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                  <ArrowUp className="size-3" />
                  <span className="font-medium">Entry</span>
                </div>
                <div className="text-xl font-bold">
                  ${Number(payload.entry).toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-3">
                <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                  <ArrowDown className="size-3" />
                  <span className="font-medium">Invalidation</span>
                </div>
                <div className="text-xl font-bold text-[#ff3366]">
                  ${Number(payload.invalidation).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Take Profits */}
            <div className="mb-6">
              <div className="text-muted-foreground mb-3 flex items-center gap-1 text-xs">
                <Target className="size-3" />
                <span className="font-medium">Take Profits</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {payload.tps.map((tp, idx) => (
                  <Badge key={idx} variant="emerald" className="font-mono">
                    TP{idx + 1}: ${Number(tp).toFixed(2)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Risk & Confidence */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-3">
                <div className="text-muted-foreground mb-2 text-xs">
                  Risk Level
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "h-2 flex-1 rounded-full",
                        level <= payload.risk
                          ? "bg-[#ff3366]"
                          : "bg-[var(--bg-slate)]",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-3">
                <div className="text-muted-foreground mb-2 text-xs">
                  Confidence
                </div>
                <div className="text-2xl font-bold text-[#00ffaa]">
                  {payload.confidence}%
                </div>
              </div>
            </div>

            {/* Chart Image */}
            {payload.chartImage && (
              <ChartImageViewer
                src={payload.chartImage}
                alt="Market Chart Analysis"
              />
            )}

            {/* Rationales */}
            <div className="mb-6 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-graphite)] p-4">
              <div className="text-muted-foreground mb-3 text-xs font-medium">
                Analysis
              </div>
              <ul className="space-y-2">
                {payload.rationales.map((rationale, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-[#00ffaa]">•</span>
                    <span>{rationale}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Regime & Metadata */}
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--glass-border)] pt-4">
              <Badge variant="glass">{payload.regime}</Badge>
              <Badge variant="glass">
                {payload.managedBy === "AI" ? "🤖 AI" : "👤 Human"}
              </Badge>
              {hoursLeft !== null && !isExpired && (
                <Badge variant="glass">⏱ {hoursLeft}h left</Badge>
              )}
              {isExpired && <Badge variant="crimson">❌ Expired</Badge>}
            </div>

            {/* Copy Trade Button */}
            {showCopyButton && signalId && traderName && !isExpired && (
              <div className="mt-4 border-t pt-4">
                <CopyTradeButton
                  signalId={signalId}
                  symbol={symbol}
                  traderName={traderName}
                  entryPrice={payload.entry}
                  userPlan={userPlan ?? null}
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
