"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

type TestnetBadgeProps = {
  isTestnet?: boolean;
};

/**
 * TestnetBadge Component
 *
 * Displays a warning badge when the app is running in testnet mode.
 * Shows "TESTNET" badge with orange warning color.
 *
 * Only visible when isTestnet prop is true.
 */
export function TestnetBadge({ isTestnet = false }: TestnetBadgeProps) {
  if (!isTestnet) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
    >
      <AlertTriangle className="mr-1 size-3" />
      TESTNET MODE
    </Badge>
  );
}
