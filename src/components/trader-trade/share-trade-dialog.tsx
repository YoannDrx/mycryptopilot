"use client";

/**
 * Share Trade as Signal Dialog
 *
 * Allows traders to share their open trades as signals
 * with customizable parameters.
 */

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Share2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { shareTradeAsSignalAction } from "@/features/trader-trade/trader-trade.action";
import type { TraderTrade } from "@/generated/prisma";

// Schema for form validation
const ShareTradeSchema = z.object({
  ttlSec: z.number().min(300).max(86400), // 5min to 24h
  leverageBand: z.string(),
  risk: z.number().min(1).max(10),
  confidence: z.number().min(1).max(10),
  rationales: z.string(),
  regime: z.string(),
  managedBy: z.enum(["AI", "HUMAN"]),
});

type ShareTradeFormData = z.infer<typeof ShareTradeSchema>;

type ShareTradeDialogProps = {
  trade: TraderTrade;
  onSuccess?: () => void;
};

export function ShareTradeDialog({ trade, onSuccess }: ShareTradeDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<ShareTradeFormData>({
    resolver: zodResolver(ShareTradeSchema),
    defaultValues: {
      ttlSec: 3600, // 1 hour default
      leverageBand: "1-3x",
      risk: 5,
      confidence: 5,
      rationales: "",
      regime: "NEUTRAL",
      managedBy: "HUMAN",
    },
  });

  const { execute, isPending } = useAction(shareTradeAsSignalAction, {
    onSuccess: () => {
      toast.success("Trade shared as signal successfully!");
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.error.serverError ?? "Failed to share trade");
    },
  });

  const onSubmit = (data: ShareTradeFormData) => {
    // Convert rationales string to array (split by newline)
    const rationales = data.rationales
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (rationales.length === 0) {
      toast.error("Please provide at least one rationale");
      return;
    }

    execute({
      tradeId: trade.id,
      ...data,
      rationales,
    });
  };

  // Only allow sharing open trades
  if (trade.status !== "OPEN") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2Icon className="mr-2 h-4 w-4" />
          Share as Signal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Trade as Signal</DialogTitle>
          <DialogDescription>
            Share your {trade.symbol} {trade.side} position as a trading signal
            for your followers.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit}>
          <div className="space-y-4">
            {/* Time to Live */}
            <FormField
              control={form.control}
              name="ttlSec"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signal Duration</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="900">15 minutes</SelectItem>
                      <SelectItem value="1800">30 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="7200">2 hours</SelectItem>
                      <SelectItem value="14400">4 hours</SelectItem>
                      <SelectItem value="28800">8 hours</SelectItem>
                      <SelectItem value="43200">12 hours</SelectItem>
                      <SelectItem value="86400">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How long the signal will be active
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Leverage Band */}
            <FormField
              control={form.control}
              name="leverageBand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leverage Band</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1x">1x (Spot)</SelectItem>
                      <SelectItem value="1-3x">1-3x (Low)</SelectItem>
                      <SelectItem value="3-5x">3-5x (Medium)</SelectItem>
                      <SelectItem value="5-10x">5-10x (High)</SelectItem>
                      <SelectItem value="10-20x">10-20x (Very High)</SelectItem>
                      <SelectItem value="20x+">20x+ (Extreme)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Recommended leverage for this trade
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Risk Level */}
            <FormField
              control={form.control}
              name="risk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Level</FormLabel>
                  <Select
                    onValueChange={(value: string) =>
                      field.onChange(Number(value))
                    }
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Low Risk</SelectItem>
                      <SelectItem value="2">2 - Low Risk</SelectItem>
                      <SelectItem value="3">3 - Low Risk</SelectItem>
                      <SelectItem value="4">4 - Below Average Risk</SelectItem>
                      <SelectItem value="5">5 - Average Risk</SelectItem>
                      <SelectItem value="6">6 - Above Average Risk</SelectItem>
                      <SelectItem value="7">7 - High Risk</SelectItem>
                      <SelectItem value="8">8 - High Risk</SelectItem>
                      <SelectItem value="9">9 - Very High Risk</SelectItem>
                      <SelectItem value="10">10 - Extreme Risk</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Risk level for this trade</FormDescription>
                </FormItem>
              )}
            />

            {/* Confidence Level */}
            <FormField
              control={form.control}
              name="confidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confidence Level</FormLabel>
                  <Select
                    onValueChange={(value: string) =>
                      field.onChange(Number(value))
                    }
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Low</SelectItem>
                      <SelectItem value="4">4 - Below Average</SelectItem>
                      <SelectItem value="5">5 - Average</SelectItem>
                      <SelectItem value="6">6 - Above Average</SelectItem>
                      <SelectItem value="7">7 - High</SelectItem>
                      <SelectItem value="8">8 - High</SelectItem>
                      <SelectItem value="9">9 - Very High</SelectItem>
                      <SelectItem value="10">10 - Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your confidence in this trade setup
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Market Regime */}
            <FormField
              control={form.control}
              name="regime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Regime</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BULLISH">Bullish</SelectItem>
                      <SelectItem value="BEARISH">Bearish</SelectItem>
                      <SelectItem value="NEUTRAL">Neutral/Ranging</SelectItem>
                      <SelectItem value="VOLATILE">Volatile</SelectItem>
                      <SelectItem value="CHOPPY">Choppy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Current market conditions</FormDescription>
                </FormItem>
              )}
            />

            {/* Management Type */}
            <FormField
              control={form.control}
              name="managedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Managed By</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HUMAN">Human Trader</SelectItem>
                      <SelectItem value="AI">AI/Algorithm</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Rationales */}
            <FormField
              control={form.control}
              name="rationales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade Rationales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your reasons for this trade (one per line)&#10;e.g.:&#10;- Strong support level&#10;- Bullish market structure&#10;- Volume confirmation"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Why are you taking this trade? (one reason per line)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2Icon className="mr-2 h-4 w-4" />
                  Share as Signal
                </>
              )}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
