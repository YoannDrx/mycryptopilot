/**
 * Metric Card Component
 *
 * Displays a single metric with label, value, and optional change indicator.
 */

import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  format?: "number" | "currency" | "percentage";
  trend?: "positive" | "negative" | "neutral";
  className?: string;
  icon?: React.ReactNode;
};

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  format = "number",
  trend,
  className,
  icon,
}: MetricCardProps) {
  // Format the value based on type
  const formattedValue = (() => {
    if (typeof value === "string") return value;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      case "percentage":
        return `${value.toFixed(2)}%`;
      default:
        return new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value);
    }
  })();

  // Determine trend if not provided
  const actualTrend =
    trend ??
    (change
      ? change > 0
        ? "positive"
        : change < 0
          ? "negative"
          : "neutral"
      : undefined);

  // Get trend icon
  const TrendIcon =
    actualTrend === "positive"
      ? ArrowUpIcon
      : actualTrend === "negative"
        ? ArrowDownIcon
        : MinusIcon;

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <p className="text-muted-foreground text-sm font-medium">{label}</p>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold">{formattedValue}</p>
            {change !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                <TrendIcon
                  className={cn(
                    "h-4 w-4",
                    actualTrend === "positive" && "text-green-500",
                    actualTrend === "negative" && "text-red-500",
                    actualTrend === "neutral" && "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    actualTrend === "positive" && "text-green-500",
                    actualTrend === "negative" && "text-red-500",
                    actualTrend === "neutral" && "text-muted-foreground",
                  )}
                >
                  {Math.abs(change).toFixed(2)}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground text-sm">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Metric Card Grid
 *
 * Layout component for displaying multiple metric cards in a grid
 */
type MetricCardGridProps = {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
};

export function MetricCardGrid({
  children,
  columns = 4,
  className,
}: MetricCardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
