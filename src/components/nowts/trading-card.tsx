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
import Image from "next/image";
import { useState } from "react";
import { ChartImageViewer } from "./chart-image-viewer";

export type TradingCardProps = {
  symbol: string;
  payload: TradingCardPayloadType;
  traderId?: string;
  traderName?: string;
  createdAt?: Date;
  expiresAt?: Date;
  className?: string;
  compact?: boolean; // New prop to enable compact mode
};

export const TradingCard = ({
  symbol,
  payload,
  traderName,
  expiresAt,
  className,
  compact = false,
}: TradingCardProps) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const isLong = payload.bias === "LONG";
  const biasColor = isLong ? "text-green-500" : "text-red-500";

  // Calculate time to expiry
  const now = new Date();
  const timeLeft = expiresAt ? expiresAt.getTime() - now.getTime() : null;
  const hoursLeft = timeLeft ? Math.floor(timeLeft / (1000 * 60 * 60)) : null;
  const isExpired = timeLeft !== null && timeLeft <= 0;

  return (
    <div className={cn("group relative", className)}>
      {/* Subtle gradient border effect */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-600/40 via-purple-600/30 to-fuchsia-600/40 opacity-0 blur-[2px] transition-all duration-300 group-hover:opacity-100" />

      <Card
        className={cn(
          "relative overflow-hidden rounded-xl border border-slate-800/50 bg-slate-950/90 backdrop-blur-sm transition-all duration-300",
          "group-hover:border-slate-700/50 group-hover:shadow-md group-hover:shadow-violet-500/5",
          isExpired && "opacity-50",
        )}
      >
        {/* Subtle top gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-900/5 to-transparent" />

        {/* Minimal glass effect overlay on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

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
          {/* Logo + Brand at top center - only in expanded mode */}
          {!compact || isExpanded ? (
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-md" />
                <Image
                  src="/images/icon.png"
                  alt="MyCryptoPilot"
                  width={36}
                  height={36}
                  className="relative rounded-full ring-1 ring-violet-500/30"
                />
              </div>
              <span className="bg-gradient-to-r from-violet-400/90 via-purple-400/90 to-fuchsia-400/90 bg-clip-text text-base font-semibold text-transparent">
                MyCryptoPilot
              </span>
            </div>
          ) : null}

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
                  <span className="text-lg font-bold text-white">{symbol}</span>
                </div>
                <ChevronDown className="size-5 flex-shrink-0 text-violet-400 transition-transform duration-300" />
              </div>

              {/* Bottom row: Entry, Type, Leverage */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Entry:</span>
                  <span className="text-sm font-bold text-white">
                    ${Number(payload.entry).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
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
                <span className="text-xl font-bold text-white">{symbol}</span>
              </div>

              {/* Type & Leverage - badges */}
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant="outline"
                  className="border-violet-500/30 bg-violet-950/30 text-xs text-violet-300/90"
                >
                  {payload.instrumentType}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-purple-500/30 bg-purple-950/30 text-xs text-purple-300/90"
                >
                  {payload.leverageBand}
                </Badge>
              </div>
            </div>
          )}

          {/* Trader Info */}
          {traderName && (
            <div className="mt-3 text-sm text-gray-400">
              By{" "}
              <span className="font-medium text-violet-400">{traderName}</span>
            </div>
          )}
        </CardHeader>

        {(!compact || isExpanded) && (
          <CardContent className="relative z-10 pt-4 pb-6">
            {/* Entry & Invalidation */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-transparent p-3">
                <div className="mb-2 flex items-center gap-1 text-xs text-violet-300/80">
                  <ArrowUp className="size-3" />
                  <span className="font-medium">Entry</span>
                </div>
                <div className="text-xl font-bold text-white">
                  ${Number(payload.entry).toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-gradient-to-br from-red-950/30 to-transparent p-3">
                <div className="mb-2 flex items-center gap-1 text-xs text-red-300/80">
                  <ArrowDown className="size-3" />
                  <span className="font-medium">Invalidation</span>
                </div>
                <div className="text-xl font-bold text-red-400/90">
                  ${Number(payload.invalidation).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Take Profits */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-1 text-xs text-gray-400">
                <Target className="size-3" />
                <span className="font-medium">Take Profits</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {payload.tps.map((tp, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-green-500/50 bg-green-950/50 font-mono text-green-400"
                  >
                    TP{idx + 1}: ${Number(tp).toFixed(2)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Risk & Confidence */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-purple-500/15 bg-gradient-to-br from-purple-950/20 to-transparent p-3">
                <div className="mb-2 text-xs text-gray-400">Risk Level</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-all",
                        level <= payload.risk
                          ? "bg-gradient-to-r from-red-500/80 to-orange-500/80 shadow-sm shadow-red-500/20"
                          : "bg-gray-800/70",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-purple-500/15 bg-gradient-to-br from-purple-950/20 to-transparent p-3">
                <div className="mb-2 text-xs text-gray-400">Confidence</div>
                <div className="text-2xl font-bold text-violet-400/90">
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
            <div className="mb-6 rounded-lg border border-slate-700/30 bg-gradient-to-br from-slate-900/30 to-transparent p-4">
              <div className="mb-3 text-xs font-medium text-gray-400">
                Analysis
              </div>
              <ul className="space-y-2">
                {payload.rationales.map((rationale, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="font-bold text-violet-400/70">•</span>
                    <span>{rationale}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Regime & Metadata */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-700/30 pt-4">
              <Badge
                variant="outline"
                className="border-violet-500/30 bg-violet-950/30 text-violet-300/90"
              >
                {payload.regime}
              </Badge>
              <Badge
                variant="outline"
                className="border-purple-500/30 bg-purple-950/30 text-purple-300/90"
              >
                {payload.managedBy === "AI" ? "🤖 AI" : "👤 Human"}
              </Badge>
              {hoursLeft !== null && !isExpired && (
                <Badge
                  variant="outline"
                  className="border-orange-500/30 bg-orange-950/30 text-orange-300/90"
                >
                  ⏱ {hoursLeft}h left
                </Badge>
              )}
              {isExpired && (
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-950/30 text-red-300/90"
                >
                  ❌ Expired
                </Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
