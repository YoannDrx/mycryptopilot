"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";
import { CopyTradeDialog } from "./copy-trade-dialog";

type CopyTradeButtonProps = {
  /** Signal ID to copy (for now, we copy signals, not TraderTrades) */
  signalId: string;

  /** Symbol of the signal */
  symbol: string;

  /** Trader display name */
  traderName: string;

  /** Entry price */
  entryPrice: number;

  /** User's current plan */
  userPlan: string | null;

  /** Whether user is already copying this signal */
  isAlreadyCopying?: boolean;
};

/**
 * Copy Trade Button Component
 *
 * Displays a "Copy Trade" button that opens a dialog for users to:
 * - Choose MANUAL (journal tracking) or AUTO (exchange execution) mode
 * - Configure copy ratio and max amount
 * - Preview the copy trade details
 *
 * Requires PRO or ULTRA subscription for copy trading.
 */
export function CopyTradeButton({
  signalId,
  symbol,
  traderName,
  entryPrice,
  userPlan,
  isAlreadyCopying = false,
}: CopyTradeButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if user has access to copy trading (PRO or ULTRA)
  const hasCopyAccess = userPlan === "PRO" || userPlan === "ULTRA";

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        size="sm"
        variant={isAlreadyCopying ? "outline" : "default"}
        disabled={isAlreadyCopying}
        className="w-full"
      >
        <Copy className="mr-2 size-4" />
        {isAlreadyCopying ? "Already Copied" : "Copy Trade"}
      </Button>

      {isDialogOpen && (
        <CopyTradeDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          signalId={signalId}
          symbol={symbol}
          traderName={traderName}
          entryPrice={entryPrice}
          userPlan={userPlan}
          hasCopyAccess={hasCopyAccess}
        />
      )}
    </>
  );
}
