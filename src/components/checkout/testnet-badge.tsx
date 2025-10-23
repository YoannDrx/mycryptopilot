"use client";

import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";
import { AlertTriangle } from "lucide-react";

/**
 * TestnetBadge Component
 *
 * Displays a warning badge when the app is running in testnet mode.
 * Shows "TESTNET" badge with orange warning color.
 *
 * Only visible when CRYPTO_NETWORK=testnet in environment variables.
 */
export function TestnetBadge() {
  const isTestnet = env.CRYPTO_NETWORK === "testnet";

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
