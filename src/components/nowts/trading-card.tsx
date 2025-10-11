import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TradingCardPayloadType } from "@/features/signal/signal.schema";
import {
  ArrowDown,
  ArrowUp,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TradingCardProps = {
  symbol: string;
  payload: TradingCardPayloadType;
  traderId?: string;
  traderName?: string;
  createdAt?: Date;
  expiresAt?: Date;
  className?: string;
};

export const TradingCard = ({
  symbol,
  payload,
  traderName,
  expiresAt,
  className,
}: TradingCardProps) => {
  const isLong = payload.bias === "LONG";
  const biasColor = isLong ? "text-green-600" : "text-red-600";
  const biasBgColor = isLong ? "bg-green-50" : "bg-red-50";
  const biasBorderColor = isLong ? "border-green-200" : "border-red-200";

  // Calculate time to expiry
  const now = new Date();
  const timeLeft = expiresAt ? expiresAt.getTime() - now.getTime() : null;
  const hoursLeft = timeLeft ? Math.floor(timeLeft / (1000 * 60 * 60)) : null;
  const isExpired = timeLeft !== null && timeLeft <= 0;

  return (
    <Card
      className={cn(
        "border-2 transition-all hover:shadow-lg",
        biasBorderColor,
        isExpired && "opacity-50",
        className,
      )}
    >
      <CardHeader className={cn("pb-3", biasBgColor)}>
        <div className="flex items-start justify-between">
          {/* Symbol & Bias */}
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1 font-bold", biasColor)}>
              {isLong ? (
                <TrendingUp className="size-5" />
              ) : (
                <TrendingDown className="size-5" />
              )}
              <span className="text-xl">{payload.bias}</span>
            </div>
            <span className="text-lg font-semibold">{symbol}</span>
          </div>

          {/* Type & Leverage */}
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs">
              {payload.instrumentType}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {payload.leverageBand}
            </Badge>
          </div>
        </div>

        {/* Trader Info */}
        {traderName && (
          <div className="text-muted-foreground mt-2 text-sm">
            By <span className="font-medium">{traderName}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {/* Entry & Invalidation */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <ArrowUp className="size-3" />
              <span>Entry</span>
            </div>
            <div className="mt-1 text-lg font-bold">
              ${payload.entry.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <ArrowDown className="size-3" />
              <span>Invalidation</span>
            </div>
            <div className="mt-1 text-lg font-bold text-red-600">
              ${payload.invalidation.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Take Profits */}
        <div className="mb-4">
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Target className="size-3" />
            <span>Take Profits</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {payload.tps.map((tp, idx) => (
              <Badge key={idx} variant="outline" className="text-green-600">
                TP{idx + 1}: ${tp.toFixed(2)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Risk & Confidence */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-muted-foreground text-xs">Risk Level</div>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "size-3 rounded-full",
                    level <= payload.risk ? "bg-red-500" : "bg-gray-200",
                  )}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Confidence</div>
            <div className="mt-1 text-lg font-semibold">
              {payload.confidence}%
            </div>
          </div>
        </div>

        {/* Rationales */}
        <div className="mb-4">
          <div className="text-muted-foreground text-xs">Rationales</div>
          <ul className="mt-2 space-y-1">
            {payload.rationales.map((rationale, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">•</span>
                <span>{rationale}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Regime & Metadata */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
          <Badge variant="secondary">{payload.regime}</Badge>
          <Badge variant="outline">
            {payload.managedBy === "AI" ? "🤖 AI" : "👤 Human"}
          </Badge>
          {hoursLeft !== null && !isExpired && (
            <Badge variant="outline" className="text-orange-600">
              {hoursLeft}h left
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="text-xs">
              Expired
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
