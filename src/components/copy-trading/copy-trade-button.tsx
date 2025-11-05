/**
 * Copy Trade Button Component
 *
 * Button to initiate copy trading for a specific trade.
 * Handles both MANUAL and AUTO modes with proper validation.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCopyTradeAction } from "@/features/copy-trade/copy-trade.action";
import type { TraderTrade } from "@/generated/prisma";

type CopyTradeButtonProps = {
  trade: TraderTrade;
  className?: string;
  size?: "default" | "sm" | "lg";
};

export function CopyTradeButton({
  trade,
  className,
  size = "default",
}: CopyTradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [mode, setMode] = useState<"MANUAL" | "AUTO">("MANUAL");
  const [copyRatio, setCopyRatio] = useState("1");
  const [maxAmount, setMaxAmount] = useState("");
  const [manualEntry, setManualEntry] = useState("");

  // Check user plan - for now using hardcoded until plan system is integrated
  // TODO: Get plan from user subscription
  const userPlan = "PRO" as "FREE" | "PRO" | "ULTRA"; // Default to PRO for testing
  const canCopy = userPlan === "PRO" || userPlan === "ULTRA";
  const canAutoCopy = userPlan === "ULTRA";

  const handleCopyTrade = async () => {
    if (!canCopy) {
      toast.error("Copy trading requires PRO or ULTRA subscription");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCopyTradeAction({
        originalTradeId: trade.id,
        mode,
        copyRatio: Number(copyRatio),
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        manualEntry:
          mode === "MANUAL" && manualEntry ? Number(manualEntry) : undefined,
      });

      if (result.data) {
        toast.success(
          mode === "MANUAL"
            ? "Trade copied to your journal"
            : "Copy trade created - pending execution",
        );
        setIsOpen(false);
        // Reset form
        setMode("MANUAL");
        setCopyRatio("1");
        setMaxAmount("");
        setManualEntry("");
      } else {
        toast.error("Failed to copy trade");
      }
    } catch {
      toast.error("An error occurred while copying the trade");
    } finally {
      setIsLoading(false);
    }
  };

  if (trade.status !== "OPEN") {
    return null; // Can only copy open trades
  }

  return (
    <>
      <Button
        size={size}
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={className}
        disabled={!canCopy}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy Trade
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Copy Trade</DialogTitle>
            <DialogDescription>
              Copy this trade to your portfolio. Choose between manual tracking
              or automatic execution.
            </DialogDescription>
          </DialogHeader>

          {/* Trade Info */}
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{trade.symbol}</p>
                <p className="text-muted-foreground text-xs">
                  {trade.side} • Entry: ${Number(trade.averageEntry).toFixed(2)}
                </p>
              </div>
              <Badge variant={trade.side === "BUY" ? "default" : "destructive"}>
                {trade.side}
              </Badge>
            </div>
          </div>

          {/* Copy Settings */}
          <div className="space-y-4">
            {/* Mode Selection */}
            <div>
              <Label htmlFor="mode">Copy Mode</Label>
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as "MANUAL" | "AUTO")}
              >
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">
                    <div>
                      <p className="font-medium">Manual Tracking</p>
                      <p className="text-muted-foreground text-xs">
                        Track in your journal only
                      </p>
                    </div>
                  </SelectItem>
                  <SelectItem value="AUTO" disabled={!canAutoCopy}>
                    <div>
                      <p className="font-medium">
                        Automatic Execution {!canAutoCopy && "(ULTRA only)"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Execute on your exchange
                      </p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Copy Ratio */}
            <div>
              <Label htmlFor="ratio">Copy Ratio</Label>
              <Select value={copyRatio} onValueChange={setCopyRatio}>
                <SelectTrigger id="ratio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">10%</SelectItem>
                  <SelectItem value="0.25">25%</SelectItem>
                  <SelectItem value="0.5">50%</SelectItem>
                  <SelectItem value="0.75">75%</SelectItem>
                  <SelectItem value="1">100%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1 text-xs">
                Copy {(Number(copyRatio) * 100).toFixed(0)}% of the original
                position size
              </p>
            </div>

            {/* Max Amount */}
            <div>
              <Label htmlFor="maxAmount">Max Amount (USD)</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="Optional: Maximum USD to risk"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                min="0"
                step="100"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Optional limit on position size
              </p>
            </div>

            {/* Manual Entry Price (for MANUAL mode) */}
            {mode === "MANUAL" && (
              <div>
                <Label htmlFor="manualEntry">Your Entry Price</Label>
                <Input
                  id="manualEntry"
                  type="number"
                  placeholder={`Suggested: ${trade.averageEntry}`}
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                  min="0"
                  step="0.00000001"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  The price at which you entered the trade
                </p>
              </div>
            )}

            {/* Warning for AUTO mode */}
            {mode === "AUTO" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Automatic execution will place a real order on your connected
                  exchange. Ensure you have sufficient balance and understand
                  the risks.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCopyTrade} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "MANUAL" ? "Copy to Journal" : "Execute Copy Trade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
