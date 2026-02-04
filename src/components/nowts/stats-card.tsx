"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StatsCardProps = {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: LucideIcon;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export const StatsCard = ({
  label,
  value,
  trend,
  trendValue,
  icon: Icon,
  className,
  size = "md",
}: StatsCardProps) => {
  const trendColor =
    trend === "up"
      ? "text-[#00ffaa]"
      : trend === "down"
        ? "text-[#ff3366]"
        : "text-muted-foreground";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const sizeClasses = {
    sm: {
      container: "p-4",
      label: "text-xs",
      value: "text-xl",
      trend: "text-xs",
    },
    md: {
      container: "p-6",
      label: "text-sm",
      value: "text-3xl",
      trend: "text-sm",
    },
    lg: {
      container: "p-8",
      label: "text-base",
      value: "text-4xl",
      trend: "text-base",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl transition-all duration-200 hover:border-[var(--glass-border-hover)]",
        sizes.container,
        className,
      )}
    >
      {/* Subtle glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00ffaa]/5 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        {/* Header with icon */}
        <div className="flex items-center justify-between">
          <span
            className={cn("text-muted-foreground font-medium", sizes.label)}
          >
            {label}
          </span>
          {Icon && <Icon className="text-muted-foreground size-5" />}
        </div>

        {/* Value */}
        <div className={cn("font-extrabold tracking-tight", sizes.value)}>
          {value}
        </div>

        {/* Trend indicator */}
        {trend && trendValue && (
          <div
            className={cn("flex items-center gap-1", trendColor, sizes.trend)}
          >
            <TrendIcon className="size-4" />
            <span className="font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export type StatsGridProps = {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
};

export const StatsGrid = ({
  children,
  columns = 3,
  className,
}: StatsGridProps) => {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
};
