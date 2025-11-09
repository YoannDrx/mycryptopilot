"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TradingCard } from "@/components/nowts/trading-card";
import { LoadingButton } from "@/features/form/submit-button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateTradingCard } from "@/features/signal/trading-card-utils";
import { ImageFormItem } from "@/features/images/image-form-item";
import { createSignalAction } from "@/features/signal/signal.action";
import {
  CreateSignalSchema,
  type CreateSignalType,
  type TradingCardPayloadType,
} from "@/features/signal/signal.schema";
import { isActionSuccessful } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const CRYPTO_SYMBOLS = [
  "BTC-USDT",
  "ETH-USDT",
  "SOL-USDT",
  "BNB-USDT",
  "XRP-USDT",
  "ADA-USDT",
  "DOGE-USDT",
  "AVAX-USDT",
  "DOT-USDT",
  "MATIC-USDT",
];

const REGIMES = [
  "Bull",
  "Bear",
  "Ranging",
  "Volatile",
  "Breakout",
  "Consolidation",
];

export const CreateSignalForm = ({ traderName }: { traderName: string }) => {
  const router = useRouter();

  const [tpInputs, setTpInputs] = useState<number[]>([0]);
  const [rationaleInputs, setRationaleInputs] = useState<string[]>([""]);

  const form = useZodForm({
    schema: CreateSignalSchema,
    defaultValues: {
      symbol: "BTC-USDT",
      ttlSec: 86400, // 24 hours
      payload: {
        instrumentType: "PERP",
        bias: "LONG",
        entry: 0,
        invalidation: 0,
        tps: [0],
        leverageBand: "1-3x",
        risk: 3,
        confidence: 70,
        rationales: [""],
        regime: "Bull",
        managedBy: "HUMAN",
        version: "1.0",
        chartImage: undefined,
      },
    },
  });

  const createSignalMutation = useMutation({
    mutationFn: async (values: CreateSignalType) => {
      const result = await createSignalAction(values);

      if (!isActionSuccessful(result)) {
        throw new Error(result.serverError ?? "Failed to create signal");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Signal created successfully!");
      router.push("/signals");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addTp = () => {
    const currentTps = form.getValues("payload.tps");
    if (currentTps.length < 5) {
      setTpInputs([...tpInputs, 0]);
      form.setValue("payload.tps", [...currentTps, 0]);
    }
  };

  const removeTp = (index: number) => {
    if (tpInputs.length > 1) {
      const newTps = tpInputs.filter((_, i) => i !== index);
      setTpInputs(newTps);
      const currentTps = form.getValues("payload.tps");
      form.setValue(
        "payload.tps",
        currentTps.filter((_, i) => i !== index),
      );
    }
  };

  const addRationale = () => {
    const currentRationales = form.getValues("payload.rationales");
    if (currentRationales.length < 5) {
      setRationaleInputs([...rationaleInputs, ""]);
      form.setValue("payload.rationales", [...currentRationales, ""]);
    }
  };

  const removeRationale = (index: number) => {
    if (rationaleInputs.length > 1) {
      const newRationales = rationaleInputs.filter((_, i) => i !== index);
      setRationaleInputs(newRationales);
      const currentRationales = form.getValues("payload.rationales");
      form.setValue(
        "payload.rationales",
        currentRationales.filter((_, i) => i !== index),
      );
    }
  };

  // Preview payload
  const previewPayload: TradingCardPayloadType | null = form.watch("payload");
  const previewSymbol = form.watch("symbol");

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Form */}
      <div>
        <Form
          form={form}
          onSubmit={async (values) => createSignalMutation.mutateAsync(values)}
          disabled={createSignalMutation.isPending}
        >
          <div className="flex flex-col gap-6">
            {/* Symbol */}
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a crypto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CRYPTO_SYMBOLS.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instrument Type */}
            <FormField
              control={form.control}
              name="payload.instrumentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrument Type *</FormLabel>
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
                      <SelectItem value="SPOT">SPOT</SelectItem>
                      <SelectItem value="PERP">PERP (Perpetual)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bias */}
            <FormField
              control={form.control}
              name="payload.bias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bias (Direction) *</FormLabel>
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
                      <SelectItem value="LONG">LONG</SelectItem>
                      <SelectItem value="SHORT">SHORT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entry Price */}
            <FormField
              control={form.control}
              name="payload.entry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Price *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 42500"
                      {...field}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    The price at which to enter the trade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Invalidation */}
            <FormField
              control={form.control}
              name="payload.invalidation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invalidation Level *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 40000"
                      {...field}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Stop loss / invalidation price
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Take Profits */}
            <div className="space-y-2">
              <FormLabel>Take Profits * (1-5)</FormLabel>
              {tpInputs.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`payload.tps.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={`TP${index + 1}`}
                            {...field}
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {tpInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTp(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {tpInputs.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTp}
                >
                  <Plus className="mr-2 size-4" />
                  Add TP
                </Button>
              )}
            </div>

            {/* Leverage Band */}
            <FormField
              control={form.control}
              name="payload.leverageBand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leverage Band *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 1-3x, 5-10x"
                      {...field}
                      value={field.value}
                    />
                  </FormControl>
                  <FormDescription>Recommended leverage range</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Risk Level */}
            <FormField
              control={form.control}
              name="payload.risk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Level * (1-5)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    1 = Low risk, 5 = Very high risk
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confidence */}
            <FormField
              control={form.control}
              name="payload.confidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confidence * (0-100%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Your confidence in this signal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rationales */}
            <div className="space-y-2">
              <FormLabel>Rationales * (1-5)</FormLabel>
              <FormDescription>Why this trade makes sense</FormDescription>
              {rationaleInputs.map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`payload.rationales.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            placeholder={`Rationale ${index + 1}`}
                            {...field}
                            value={field.value}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {rationaleInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRationale(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {rationaleInputs.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRationale}
                >
                  <Plus className="mr-2 size-4" />
                  Add Rationale
                </Button>
              )}
            </div>

            {/* Chart Image Upload */}
            <FormField
              control={form.control}
              name="payload.chartImage"
              render={() => (
                <FormItem>
                  <FormLabel>Chart Image (optional)</FormLabel>
                  <FormControl>
                    <ImageFormItem
                      className="aspect-video w-full"
                      onChange={(url) =>
                        form.setValue("payload.chartImage", url)
                      }
                      onRemove={() =>
                        form.setValue("payload.chartImage", undefined)
                      }
                      imageUrl={form.watch("payload.chartImage")}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a chart screenshot to show your market analysis (PNG,
                    JPG - max 1MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Regime */}
            <FormField
              control={form.control}
              name="payload.regime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Regime *</FormLabel>
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
                      {REGIMES.map((regime) => (
                        <SelectItem key={regime} value={regime}>
                          {regime}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Managed By */}
            <FormField
              control={form.control}
              name="payload.managedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Managed By *</FormLabel>
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
                      <SelectItem value="HUMAN">Human</SelectItem>
                      <SelectItem value="AI">AI</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TTL */}
            <FormField
              control={form.control}
              name="ttlSec"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time to Live (hours) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      {...field}
                      value={field.value / 3600}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) * 3600)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Signal will expire after this duration (1-168 hours)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Risk Analysis Card */}
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  💡 Quick Risk Check
                </h3>
                <p className="text-muted-foreground mb-4 text-xs">
                  Validate your position sizing before publishing this signal
                </p>

                {(() => {
                  // Construire payload temporaire depuis form.watch()
                  const entry = form.watch("payload.entry") || 0;
                  const invalidation = form.watch("payload.invalidation") || 0;
                  const tps = form.watch("payload.tps").filter((tp) => tp > 0);
                  const bias = form.watch("payload.bias");

                  // Calculer les métriques avec validateTradingCard
                  const formPayload = {
                    instrumentType: form.watch("payload.instrumentType"),
                    bias,
                    entry,
                    invalidation,
                    tps,
                    leverageBand: form.watch("payload.leverageBand"),
                    risk: form.watch("payload.risk"),
                    confidence: form.watch("payload.confidence"),
                    rationales: form.watch("payload.rationales"),
                    regime: form.watch("payload.regime"),
                    managedBy: form.watch("payload.managedBy"),
                    version: form.watch("payload.version"),
                  };

                  const validation = validateTradingCard(formPayload);
                  const {
                    riskRewardRatio,
                    riskPercentage,
                    averageTPPercentage,
                  } = validation.metrics;

                  // Calculs additionnels avec protection contre NaN
                  const defaultCapital = 1000; // Capital par défaut
                  const safeRiskPercentage = Number.isFinite(riskPercentage)
                    ? riskPercentage
                    : 0;
                  const riskAmount =
                    defaultCapital * (safeRiskPercentage / 100);
                  const priceRisk = Math.abs(entry - invalidation);
                  const priceRiskFraction = entry > 0 ? priceRisk / entry : 0;
                  const positionSize =
                    priceRiskFraction > 0 && Number.isFinite(riskAmount)
                      ? riskAmount / priceRiskFraction
                      : 0;
                  const contracts =
                    entry > 0 && Number.isFinite(positionSize)
                      ? positionSize / entry
                      : 0;

                  // Valider que les métriques sont valides
                  const hasValidMetrics =
                    Number.isFinite(riskRewardRatio) &&
                    Number.isFinite(riskPercentage) &&
                    Number.isFinite(averageTPPercentage) &&
                    riskRewardRatio > 0;

                  const isValid =
                    entry > 0 &&
                    invalidation > 0 &&
                    tps.length > 0 &&
                    hasValidMetrics;

                  // Helper pour formater les nombres avec protection NaN
                  const formatNumber = (value: number, decimals: number) => {
                    return Number.isFinite(value)
                      ? value.toFixed(decimals)
                      : "0.00";
                  };

                  return (
                    <Card className="bg-muted/30">
                      <CardContent className="space-y-4 py-4">
                        {isValid ? (
                          <>
                            {/* Grid de métriques */}
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs">
                                  Risk Amount
                                </p>
                                <p className="text-xl font-semibold">
                                  ${formatNumber(riskAmount, 2)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs">
                                  Price Risk
                                </p>
                                <p className="text-xl font-semibold">
                                  {formatNumber(riskPercentage, 2)}%
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs">
                                  Position Size
                                </p>
                                <p className="text-xl font-semibold">
                                  ${formatNumber(positionSize, 2)}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  ≈ {formatNumber(contracts, 4)} contracts
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-muted-foreground text-xs">
                                  R/R Ratio
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xl font-semibold">
                                    1:{formatNumber(riskRewardRatio, 2)}
                                  </p>
                                  <Badge
                                    variant={
                                      riskRewardRatio >= 2
                                        ? "default"
                                        : riskRewardRatio >= 1.5
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {riskRewardRatio >= 2
                                      ? "Excellent"
                                      : riskRewardRatio >= 1.5
                                        ? "OK"
                                        : "Poor"}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Message explicatif */}
                            <div className="text-muted-foreground text-xs">
                              💡 This calculation protects you from risking more
                              than{" "}
                              <span className="text-primary font-semibold">
                                ${formatNumber(riskAmount, 2)}
                              </span>{" "}
                              if your stop loss is hit. With a{" "}
                              <span className="text-primary font-semibold">
                                1:{formatNumber(riskRewardRatio, 2)}
                              </span>{" "}
                              RR and average target at{" "}
                              <span className="text-primary font-semibold">
                                +{formatNumber(averageTPPercentage, 1)}%
                              </span>
                              , you could capture{" "}
                              <span className="text-primary font-semibold">
                                ${formatNumber(riskAmount * riskRewardRatio, 2)}
                              </span>{" "}
                              if all take profits are reached.
                            </div>

                            {/* Liste des TPs */}
                            {tps.length > 0 && (
                              <div className="text-muted-foreground flex flex-col gap-1 text-xs">
                                {tps.map((tp, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between"
                                  >
                                    <span>TP{idx + 1}</span>
                                    <span>
                                      {formatNumber(100 / tps.length, 0)}% @ $
                                      {formatNumber(tp, 2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-muted-foreground py-8 text-center text-sm">
                            Fill in Entry Price, Invalidation Level, and Take
                            Profits to see risk analysis
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            </div>

            <LoadingButton
              loading={createSignalMutation.isPending}
              type="submit"
            >
              Create Signal
            </LoadingButton>
          </div>
        </Form>
      </div>

      {/* Preview */}
      <div className="sticky top-4 h-fit">
        <h3 className="mb-4 text-lg font-semibold">Preview</h3>
        <TradingCard
          symbol={previewSymbol}
          payload={previewPayload}
          traderName={traderName}
          expiresAt={new Date(Date.now() + form.watch("ttlSec") * 1000)}
        />
      </div>
    </div>
  );
};
