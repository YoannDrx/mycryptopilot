"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock, Zap, Crown } from "lucide-react";
import type { NavLinkBadgeType } from "./navigation.type";
import { cn } from "@/lib/utils";

type NavigationBadgeProps = {
  badge: NavLinkBadgeType;
  className?: string;
};

/**
 * Navigation Badge Component
 *
 * Displays badges for navigation links to indicate:
 * - Plan requirements (PRO/ULTRA)
 * - Counts (e.g., "3 new signals")
 * - Status (NEW, TRADER)
 * - Custom labels
 */
export function NavigationBadge({ badge, className }: NavigationBadgeProps) {
  // Badge Plan (PRO/ULTRA/FREE)
  if (badge.type === "plan") {
    const isPro = badge.plan === "PRO";
    const isUltra = badge.plan === "ULTRA";
    const isFree = badge.plan === "FREE";

    const tooltipContent = isPro
      ? "Requires Pro plan ($49/month)"
      : isUltra
        ? "Requires Ultra plan ($99/month)"
        : "Available on Free plan";

    const handleClick = (e: React.MouseEvent) => {
      if (isPro || isUltra) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = "/pricing";
      }
    };

    const badgeContent = (
      <Badge
        variant="outline"
        className={cn(
          "ml-auto h-5 px-1.5 text-[10px] font-semibold",
          isPro &&
            "cursor-pointer border-blue-500/50 bg-blue-500/10 text-blue-500 hover:opacity-80",
          isUltra &&
            "cursor-pointer border-purple-500/50 bg-purple-500/10 text-purple-500 hover:opacity-80",
          isFree && "border-gray-500/50 bg-gray-500/10 text-gray-500",
          className,
        )}
        onClick={handleClick}
      >
        <Lock className="mr-1 h-2.5 w-2.5" />
        {badge.plan}
      </Badge>
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{badgeContent}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="font-medium">{tooltipContent}</p>
            {(isPro || isUltra) && (
              <p className="text-muted-foreground mt-1 text-xs">
                Click to view pricing
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge Count (ex: "3 new signals")
  if (badge.type === "count") {
    if (badge.count === 0) return null;

    const variant = badge.variant ?? "default";
    const variantStyles = {
      default: "bg-blue-500",
      success: "bg-green-500",
      warning: "bg-orange-500",
    };

    return (
      <Badge
        className={cn(
          "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white",
          variantStyles[variant],
          className,
        )}
      >
        {badge.count > 99 ? "99+" : badge.count}
      </Badge>
    );
  }

  // Badge "New"
  if (badge.type === "new") {
    return (
      <Badge
        className={cn(
          "ml-auto h-5 bg-gradient-to-r from-blue-500 to-purple-500 px-1.5 text-[10px] font-bold text-white",
          className,
        )}
      >
        <Zap className="mr-1 h-2.5 w-2.5" />
        NEW
      </Badge>
    );
  }

  // Badge "Trader"
  if (badge.type === "trader") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "ml-auto h-5 border-amber-500/50 bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-500",
          className,
        )}
      >
        <Crown className="mr-1 h-2.5 w-2.5" />
        TRADER
      </Badge>
    );
  }

  // Badge Custom
  return (
    <Badge
      variant="outline"
      className={cn("ml-auto h-5 px-1.5 text-[10px]", className)}
    >
      {badge.label}
    </Badge>
  );
}
