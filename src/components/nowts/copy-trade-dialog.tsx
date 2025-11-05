"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createTradeFromSignalAction } from "@/features/copy-trade/create-from-signal.action";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const copyTradeSchema = z
  .object({
    mode: z.enum(["MANUAL", "AUTO"]),
    copyRatio: z.number().min(0.01).max(1).optional(),
    maxAmount: z.number().positive().optional(),
    manualEntry: z.number().positive().optional(),
  })
  .refine(
    (data) => {
      // If mode is MANUAL, manualEntry is required
      if (data.mode === "MANUAL" && !data.manualEntry) {
        return false;
      }
      return true;
    },
    {
      message: "Manual entry price is required for MANUAL mode",
      path: ["manualEntry"],
    },
  );

type CopyTradeFormValues = z.infer<typeof copyTradeSchema>;

type CopyTradeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  signalId: string;
  symbol: string;
  traderName: string;
  entryPrice: number;
  userPlan: string | null;
  hasCopyAccess: boolean;
};

/**
 * Copy Trade Dialog Component
 *
 * Modal dialog for creating a copy trade with options for:
 * - MANUAL mode: Track trade manually in journal
 * - AUTO mode: Execute automatically via exchange (requires ULTRA)
 * - Copy ratio: Percentage of original trade size
 * - Max amount: Maximum USD to risk
 */
export function CopyTradeDialog({
  isOpen,
  onClose,
  signalId,
  symbol,
  traderName,
  entryPrice,
  userPlan,
  hasCopyAccess,
}: CopyTradeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useZodForm({
    schema: copyTradeSchema,
    defaultValues: {
      mode: "MANUAL",
      copyRatio: 1,
      maxAmount: undefined,
      manualEntry: entryPrice,
    },
  });

  const mode = form.watch("mode");
  const maxAmount = form.watch("maxAmount");

  // For signals, we don't have totalQuantity yet (it's just a signal/alert)
  // We'll calculate based on a standard position size or let user define it
  const estimatedValue = maxAmount ?? 100; // Default to $100 if no max amount
  const estimatedQuantity = estimatedValue / entryPrice;

  const onSubmit = async (values: CopyTradeFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await createTradeFromSignalAction({
        signalId,
        mode: values.mode,
        copyRatio: values.copyRatio,
        maxAmount: values.maxAmount,
        manualEntry: values.manualEntry,
      });

      if (result.serverError) {
        toast.error("Failed to create copy trade", {
          description: result.serverError,
        });
        return;
      }

      toast.success("Copy trade created!", {
        description: `${values.mode === "MANUAL" ? "Added to your journal" : "Queued for execution"}`,
        icon: <CheckCircle2 className="size-4" />,
      });

      onClose();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show upgrade prompt if user doesn't have access
  if (!hasCopyAccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Required</DialogTitle>
            <DialogDescription>
              Copy trading is available for PRO and ULTRA subscribers.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              Upgrade to PRO to unlock copy trading and track trades in your
              journal. ULTRA subscribers get automatic execution via exchange
              API.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => router.push("/pricing")} className="flex-1">
              View Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="size-5" />
            Copy Trade: {symbol}
          </DialogTitle>
          <DialogDescription>
            Copying {traderName}'s {symbol} trade
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit} className="space-y-6">
          {/* Mode Selection */}
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Copy Mode</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="MANUAL"
                        id="manual"
                        className="peer sr-only"
                      />
                      <label
                        htmlFor="manual"
                        className="border-muted hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 bg-transparent p-4"
                      >
                        <div className="mb-2 text-center">
                          <div className="mb-1 font-semibold">Manual</div>
                          <div className="text-muted-foreground text-xs">
                            Track in journal
                          </div>
                        </div>
                        <Badge variant="secondary">PRO</Badge>
                      </label>
                    </div>

                    <div>
                      <RadioGroupItem
                        value="AUTO"
                        id="auto"
                        className="peer sr-only"
                        disabled={userPlan !== "ULTRA"}
                      />
                      <label
                        htmlFor="auto"
                        className={
                          userPlan !== "ULTRA"
                            ? "border-muted flex cursor-not-allowed flex-col items-center justify-between rounded-md border-2 bg-transparent p-4 opacity-50"
                            : "border-muted hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-md border-2 bg-transparent p-4"
                        }
                      >
                        <div className="mb-2 text-center">
                          <div className="mb-1 font-semibold">Auto</div>
                          <div className="text-muted-foreground text-xs">
                            Execute on exchange
                          </div>
                        </div>
                        <Badge variant="default">ULTRA</Badge>
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  {mode === "MANUAL"
                    ? "Add this trade to your journal for manual tracking."
                    : "Automatically execute this trade on your connected exchange."}
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Manual Entry Price (only for MANUAL mode) */}
          {mode === "MANUAL" && (
            <FormField
              control={form.control}
              name="manualEntry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Entry Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={entryPrice.toFixed(2)}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The price at which you entered this trade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Copy Ratio */}
          <FormField
            control={form.control}
            name="copyRatio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Copy Ratio (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1"
                    placeholder="1.0"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Percentage of original trade size (0.01 to 1.0). Default: 1.0
                  (100%)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max Amount */}
          <FormField
            control={form.control}
            name="maxAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Amount (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="No limit"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Maximum USD amount to risk on this trade
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preview */}
          <div className="border-border bg-muted/50 rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">Preview</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signal Entry:</span>
                <span className="font-mono">${entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Entry:</span>
                <span className="font-mono font-semibold">
                  ${(form.watch("manualEntry") ?? entryPrice).toFixed(2)}
                </span>
              </div>
              {maxAmount && (
                <div className="border-border flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Max Position:</span>
                  <span className="font-mono font-bold">
                    ${estimatedValue.toFixed(2)} ({estimatedQuantity.toFixed(4)}{" "}
                    {symbol.split("/")[0]})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" />
                  {mode === "MANUAL" ? "Add to Journal" : "Execute Trade"}
                </>
              )}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
