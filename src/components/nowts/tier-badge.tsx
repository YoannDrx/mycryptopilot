import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TierLevel } from "@/generated/prisma";

type TierBadgeProps = {
  tier: TierLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

const getTierIcon = (tier: TierLevel) => {
  switch (tier) {
    case "BRONZE":
      return "🥉";
    case "SILVER":
      return "🥈";
    case "GOLD":
      return "🥇";
    case "DIAMOND":
      return "💎";
    default:
      return "🏆";
  }
};

const getTierColor = (tier: TierLevel) => {
  switch (tier) {
    case "BRONZE":
      return "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100";
    case "SILVER":
      return "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100";
    case "GOLD":
      return "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100";
    case "DIAMOND":
      return "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100";
    default:
      return "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100";
  }
};

const getSizeClasses = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return "text-xs px-2 py-0.5";
    case "md":
      return "text-sm px-2.5 py-1";
    case "lg":
      return "text-base px-3 py-1.5";
    default:
      return "text-sm px-2.5 py-1";
  }
};

export const TierBadge = ({
  tier,
  size = "md",
  showLabel = true,
  className,
}: TierBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-2 font-semibold",
        getTierColor(tier),
        getSizeClasses(size),
        className,
      )}
    >
      <span className="mr-1">{getTierIcon(tier)}</span>
      {showLabel && tier}
    </Badge>
  );
};
