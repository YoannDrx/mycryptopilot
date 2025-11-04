"use client";

import { type ReactNode, useEffect, useId, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Typography } from "@/components/nowts/typography";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

type PositionType = "LONG" | "SHORT";

type TakeProfitConfig = {
  id: string;
  label: string;
  price: string;
  allocation: string;
};

type CalculatedTarget = {
  id: string;
  label: string;
  price: number;
  allocation: number;
  weight: number;
  hasAllocation: boolean;
  isPriceValid: boolean;
};

export type RiskConsoleCalculatorResult = {
  riskAmount: number;
  priceRisk: number;
  priceRiskPercent: number;
  positionSize: number;
  contracts: number;
  rrRatio: number;
  reward: number;
  isValidConfiguration: boolean;
  positionType: PositionType;
  isStopLossValid: boolean;
  hasAllocatedTargets: boolean;
  allocationTotal: number;
  averageTakeProfit: number;
  targets: CalculatedTarget[];
  invalidReason: string | null;
};

const ALLOCATION_TOLERANCE = 0.01;

export type RiskConsoleCalculatorProps = {
  defaultCapital?: number;
  defaultRiskPercent?: number;
  defaultEntryPrice?: number;
  defaultStopLoss?: number;
  defaultTakeProfit?: number;
  defaultPositionType?: PositionType;
  defaultTargets?: {
    price: number;
    allocation: number;
    label?: string;
  }[];
  heading?: ReactNode;
  description?: ReactNode;
  showHeader?: boolean;
  className?: string;
  onResultChange?: (result: RiskConsoleCalculatorResult) => void;
};

export function RiskConsoleCalculator({
  defaultCapital = 1000,
  defaultRiskPercent = 2,
  defaultEntryPrice = 42000,
  defaultStopLoss = 41000,
  defaultTakeProfit = 44000,
  defaultPositionType = "LONG",
  defaultTargets,
  heading = "Risk Console (2% Rule)",
  description,
  showHeader = true,
  className,
  onResultChange,
}: RiskConsoleCalculatorProps) {
  const [capital, setCapital] = useState(() => defaultCapital.toString());
  const [riskPercent, setRiskPercent] = useState(() =>
    defaultRiskPercent.toString(),
  );
  const [entryPrice, setEntryPrice] = useState(() =>
    defaultEntryPrice.toString(),
  );
  const [stopLoss, setStopLoss] = useState(() => defaultStopLoss.toString());
  const [positionType, setPositionType] =
    useState<PositionType>(defaultPositionType);

  const initialTargets = () => {
    if (defaultTargets && defaultTargets.length > 0) {
      return Array.from(
        { length: Math.max(defaultTargets.length, 1) },
        (_, index) => {
          const preset = defaultTargets[index];
          const label = preset.label ?? `TP${index + 1}`;
          const priceValue = preset.price;
          const allocationValue = preset.allocation;

          if (
            typeof priceValue === "number" &&
            Number.isFinite(priceValue) &&
            priceValue > 0
          ) {
            return {
              id: `tp${index + 1}`,
              label,
              price: priceValue.toString(),
              allocation:
                typeof allocationValue === "number" &&
                Number.isFinite(allocationValue)
                  ? allocationValue.toString()
                  : index === 0
                    ? "100"
                    : "0",
            } satisfies TakeProfitConfig;
          }

          return {
            id: `tp${index + 1}`,
            label,
            price: "",
            allocation: "0",
          } satisfies TakeProfitConfig;
        },
      );
    }

    const basePrice =
      Number.isFinite(defaultTakeProfit) && defaultTakeProfit > 0
        ? defaultTakeProfit.toString()
        : "";

    return [
      {
        id: "tp1",
        label: "TP1",
        price: basePrice,
        allocation: basePrice ? "100" : "0",
      },
      { id: "tp2", label: "TP2", price: "", allocation: "0" },
      { id: "tp3", label: "TP3", price: "", allocation: "0" },
    ] satisfies TakeProfitConfig[];
  };

  const [targets, setTargets] = useState<TakeProfitConfig[]>(initialTargets);

  const positionToggleId = useId();
  const quickAllocationPresets = [0, 25, 33, 50, 67, 75, 100];

  const handleTargetChange = (
    index: number,
    key: "price" | "allocation",
    value: string,
  ) => {
    setTargets((prev) =>
      prev.map((target, targetIndex) =>
        targetIndex === index ? { ...target, [key]: value } : target,
      ),
    );
  };

  const applyAllocationPreset = (index: number, value: number) => {
    setTargets((prev) => {
      const othersTotal = prev.reduce((sum, target, targetIndex) => {
        if (targetIndex === index) return sum;
        return sum + (Number(target.allocation) || 0);
      }, 0);
      const available = Math.max(0, 100 - othersTotal);
      const nextValue = Math.min(value, available);

      return prev.map((target, targetIndex) =>
        targetIndex === index
          ? {
              ...target,
              allocation: nextValue.toString(),
            }
          : target,
      );
    });
  };

  const addTarget = () => {
    setTargets((prev) => {
      const othersTotal = prev.reduce(
        (sum, target) => sum + (Number(target.allocation) || 0),
        0,
      );
      const remainder = Math.max(0, 100 - othersTotal);
      const nextIndex = prev.length + 1;

      const nextTarget: TakeProfitConfig = {
        id: `tp${nextIndex}`,
        label: `TP${nextIndex}`,
        price: "",
        allocation: remainder > 0 ? remainder.toString() : "0",
      };

      return [...prev, nextTarget];
    });
  };

  const removeTarget = (index: number) => {
    setTargets((prev) => {
      if (prev.length <= 1) return prev;

      const next = prev.filter((_, targetIndex) => targetIndex !== index);

      const totalAfterRemoval = next.reduce(
        (sum, target) => sum + (Number(target.allocation) || 0),
        0,
      );

      if (next.length > 0 && totalAfterRemoval < 100) {
        const remainder = 100 - totalAfterRemoval;
        next[0] = {
          ...next[0],
          allocation: (
            (Number(next[0].allocation) || 0) + remainder
          ).toString(),
        };
      }

      return next.map((target, targetIndex) => ({
        ...target,
        id: `tp${targetIndex + 1}`,
        label: `TP${targetIndex + 1}`,
      }));
    });
  };

  const result = useMemo(() => {
    const capitalNum = Number(capital) || 0;
    const riskPercentNum = Number(riskPercent) || 0;
    const entryPriceNum = Number(entryPrice) || 0;
    const stopLossNum = Number(stopLoss) || 0;

    const riskAmount = capitalNum * (riskPercentNum / 100);
    const priceRisk = Math.abs(entryPriceNum - stopLossNum);
    const priceRiskPercent =
      entryPriceNum > 0 ? (priceRisk / entryPriceNum) * 100 : 0;
    const priceRiskFraction = entryPriceNum > 0 ? priceRisk / entryPriceNum : 0;
    const positionSize =
      priceRiskFraction > 0 ? riskAmount / priceRiskFraction : 0;
    const contracts = entryPriceNum > 0 ? positionSize / entryPriceNum : 0;

    const parsedTargets: CalculatedTarget[] = targets.map((target) => {
      const priceNum = Number(target.price) || 0;
      const allocationNum = Number(target.allocation) || 0;
      const hasAllocation = allocationNum > 0;
      const isPriceValid = hasAllocation
        ? positionType === "LONG"
          ? priceNum > entryPriceNum
          : priceNum < entryPriceNum
        : true;

      return {
        id: target.id,
        label: target.label,
        price: priceNum,
        allocation: allocationNum,
        hasAllocation,
        isPriceValid,
        weight: 0,
      } satisfies CalculatedTarget;
    });

    const allocationTotalRaw = parsedTargets.reduce(
      (sum, target) => sum + (target.hasAllocation ? target.allocation : 0),
      0,
    );

    const hasAllocatedTargets = parsedTargets.some(
      (target) => target.hasAllocation,
    );

    const allAllocatedHavePrice = parsedTargets.every((target) => {
      if (!target.hasAllocation) return true;
      return target.price > 0 && target.isPriceValid;
    });

    const normalizedTargets =
      allocationTotalRaw > 0
        ? parsedTargets.map((target) => ({
            ...target,
            weight: target.hasAllocation
              ? target.allocation / allocationTotalRaw
              : 0,
          }))
        : parsedTargets;

    const averageTakeProfit =
      hasAllocatedTargets && allocationTotalRaw > 0
        ? normalizedTargets.reduce(
            (sum, target) => sum + target.weight * target.price,
            0,
          )
        : 0;

    const rewardDistance =
      hasAllocatedTargets && allocationTotalRaw > 0
        ? normalizedTargets.reduce(
            (sum, target) =>
              sum + target.weight * Math.abs(target.price - entryPriceNum),
            0,
          )
        : 0;

    const isNeutral = stopLossNum === entryPriceNum;
    const isStopLossValid = !isNeutral
      ? positionType === "LONG"
        ? stopLossNum < entryPriceNum
        : stopLossNum > entryPriceNum
      : false;

    const allocationTotal = Math.round(allocationTotalRaw * 100) / 100;
    const allocationsBalanced =
      Math.abs(allocationTotal - 100) <= ALLOCATION_TOLERANCE;

    const isValidConfiguration =
      !isNeutral &&
      isStopLossValid &&
      hasAllocatedTargets &&
      allAllocatedHavePrice &&
      allocationsBalanced;

    let invalidReason: string | null = null;

    if (isNeutral) {
      invalidReason = "Stop Loss must be different from Entry Price.";
    } else if (!isStopLossValid) {
      invalidReason =
        positionType === "LONG"
          ? "For a LONG position, Stop Loss must be below the Entry Price."
          : "For a SHORT position, Stop Loss must be above the Entry Price.";
    } else if (!hasAllocatedTargets) {
      invalidReason = "Allocate at least one take profit target.";
    } else if (!allAllocatedHavePrice) {
      const firstInvalid = normalizedTargets.find(
        (target) =>
          target.hasAllocation && (!target.isPriceValid || target.price <= 0),
      );
      if (firstInvalid) {
        invalidReason =
          positionType === "LONG"
            ? `${firstInvalid.label} must be above the Entry Price.`
            : `${firstInvalid.label} must be below the Entry Price.`;
      } else {
        invalidReason = "Invalid take profit configuration.";
      }
    } else if (!allocationsBalanced) {
      invalidReason = `Take profit allocations must total 100% (current ${allocationTotal.toFixed(2)}%).`;
    }

    const reward = isValidConfiguration ? rewardDistance : 0;
    const rrRatio =
      isValidConfiguration && priceRisk > 0 ? reward / priceRisk : 0;

    return {
      riskAmount,
      priceRisk,
      priceRiskPercent,
      positionSize,
      contracts,
      rrRatio,
      reward,
      isValidConfiguration,
      positionType,
      isStopLossValid,
      hasAllocatedTargets,
      allocationTotal,
      averageTakeProfit,
      targets: normalizedTargets,
      invalidReason,
    } satisfies RiskConsoleCalculatorResult;
  }, [capital, riskPercent, entryPrice, stopLoss, targets, positionType]);

  useEffect(() => {
    if (onResultChange) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  const {
    rrRatio,
    isValidConfiguration,
    invalidReason,
    allocationTotal,
    targets: calculatedTargets,
    averageTakeProfit,
  } = result;

  const allocationsBalanced =
    Math.abs(allocationTotal - 100) <= ALLOCATION_TOLERANCE;

  const badgeVariant = !isValidConfiguration
    ? "destructive"
    : rrRatio >= 2
      ? "default"
      : rrRatio >= 1
        ? "secondary"
        : "destructive";

  const badgeLabel = !isValidConfiguration
    ? invalidReason
      ? invalidReason
          .replace(/Stop Loss/gi, "SL")
          .replace(/Take Profit/gi, "TP")
          .replace(/Entry Price/gi, "Entry")
      : "Invalid"
    : rrRatio >= 2
      ? "Excellent"
      : rrRatio >= 1
        ? "OK"
        : "Poor";

  return (
    <Card className={cn("bg-card", className)}>
      {showHeader ? (
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
          {description ? (
            <Typography variant="muted" className="text-sm">
              {description}
            </Typography>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${positionToggleId}-long`}>Position Type</Label>
          <RadioGroup
            value={positionType}
            onValueChange={(value) => setPositionType(value as PositionType)}
            className="grid grid-cols-2 gap-3 sm:w-fit"
          >
            <div>
              <RadioGroupItem
                value="LONG"
                id={`${positionToggleId}-long`}
                className="peer sr-only"
              />
              <label
                htmlFor={`${positionToggleId}-long`}
                className="border-input hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer items-center justify-center rounded-md border-2 px-4 py-2 text-sm font-semibold"
              >
                Long
              </label>
            </div>
            <div>
              <RadioGroupItem
                value="SHORT"
                id={`${positionToggleId}-short`}
                className="peer sr-only"
              />
              <label
                htmlFor={`${positionToggleId}-short`}
                className="border-input hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer items-center justify-center rounded-md border-2 px-4 py-2 text-sm font-semibold"
              >
                Short
              </label>
            </div>
          </RadioGroup>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="risk-console-capital">Total Capital (USD)</Label>
            <Input
              id="risk-console-capital"
              type="number"
              value={capital}
              onChange={(event) => setCapital(event.target.value)}
              placeholder="10000"
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="risk-console-risk">Risk Per Trade (%)</Label>
            <Input
              id="risk-console-risk"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={riskPercent}
              onChange={(event) => setRiskPercent(event.target.value)}
              placeholder="2"
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <Typography variant="muted" className="text-xs">
              Recommended: 1-2% for conservative, 2-3% for moderate risk
            </Typography>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="risk-console-entry">Entry Price (USD)</Label>
            <Input
              id="risk-console-entry"
              type="number"
              value={entryPrice}
              onChange={(event) => setEntryPrice(event.target.value)}
              placeholder="42000"
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="risk-console-stop-loss">Stop Loss (USD)</Label>
            <Input
              id="risk-console-stop-loss"
              type="number"
              value={stopLoss}
              onChange={(event) => setStopLoss(event.target.value)}
              placeholder="41000"
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Take Profit Targets</Label>
            <span
              className={cn(
                "text-xs",
                allocationsBalanced
                  ? "text-muted-foreground"
                  : "text-destructive",
              )}
            >
              Total allocation: {allocationTotal.toFixed(2)}%
            </span>
          </div>
          <div className="grid gap-4">
            {targets.map((target, index) => {
              const allocationValue = Number(target.allocation) || 0;
              const othersTotal = targets.reduce(
                (sum, current, currentIndex) => {
                  if (currentIndex === index) return sum;
                  return sum + (Number(current.allocation) || 0);
                },
                0,
              );
              const availableForPresets = Math.max(0, 100 - othersTotal);
              const isRemovable =
                index === targets.length - 1 && targets.length > 1;

              return (
                <div
                  key={target.id}
                  className="border-border/60 relative rounded-md border p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`${target.id}-price`}>
                        {target.label} Price (USD)
                      </Label>
                      <Input
                        id={`${target.id}-price`}
                        type="number"
                        value={target.price}
                        onChange={(event) =>
                          handleTargetChange(index, "price", event.target.value)
                        }
                        placeholder={index === 0 ? "44000" : ""}
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`${target.id}-allocation`}>
                        {target.label} Allocation (%)
                      </Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id={`${target.id}-allocation`}
                            type="number"
                            value={target.allocation}
                            onChange={(event) =>
                              handleTargetChange(
                                index,
                                "allocation",
                                event.target.value,
                              )
                            }
                            placeholder={index === 0 ? "100" : "0"}
                            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <span className="text-muted-foreground text-sm">
                            %
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {quickAllocationPresets.map((preset) => {
                            const presetValue = Math.min(
                              preset,
                              availableForPresets,
                            );
                            const isActive =
                              Math.abs(allocationValue - presetValue) <=
                              ALLOCATION_TOLERANCE;

                            return (
                              <Button
                                key={`${target.id}-preset-${preset}`}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  applyAllocationPreset(index, preset)
                                }
                                className={cn(
                                  "h-7 px-2 text-xs",
                                  isActive
                                    ? "border-primary text-primary"
                                    : undefined,
                                )}
                              >
                                {preset}%
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  {isRemovable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20 absolute top-1 right-1 size-7 rounded-full"
                      onClick={() => removeTarget(index)}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Remove {target.label}</span>
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={addTarget}
            >
              <Plus className="size-4" />
              Add take profit
            </Button>
          </div>
        </div>

        <div className="bg-primary/10 flex flex-col gap-3 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Typography variant="small" className="text-muted-foreground">
              Risk Amount:
            </Typography>
            <Typography variant="large" className="text-primary font-semibold">
              ${result.riskAmount.toFixed(2)}
            </Typography>
          </div>
          <div className="flex items-center justify-between">
            <Typography variant="small" className="text-muted-foreground">
              Price Risk:
            </Typography>
            <Typography variant="large" className="font-semibold">
              {result.priceRiskPercent.toFixed(2)}%
            </Typography>
          </div>
          <div className="border-border border-t pt-3">
            <div className="flex items-center justify-between">
              <Typography variant="small" className="font-semibold">
                Recommended Position:
              </Typography>
              <Typography variant="h3" className="text-primary">
                ${result.positionSize.toFixed(2)}
              </Typography>
            </div>
            <Typography variant="muted" className="mt-1 text-xs">
              ≈ {result.contracts.toFixed(4)} contracts
            </Typography>
          </div>
          <div className="border-border border-t pt-3">
            <div className="flex items-center justify-between">
              <Typography variant="small" className="font-semibold">
                Risk / Reward Ratio:
              </Typography>
              <div className="flex items-center gap-2">
                <Typography variant="large" className="font-semibold">
                  {isValidConfiguration
                    ? `1:${result.rrRatio.toFixed(2)}`
                    : "N/A"}
                </Typography>
                <Badge variant={badgeVariant}>{badgeLabel}</Badge>
              </div>
            </div>
          </div>
        </div>

        {!isValidConfiguration ? (
          <Typography
            variant="muted"
            className="text-destructive text-center text-xs"
          >
            ⚠️ Invalid configuration:
            {` ${invalidReason ?? "Please review your inputs."}`}
          </Typography>
        ) : (
          <div className="space-y-2 text-center text-xs">
            <Typography variant="muted">
              💡 This calculation protects you from risking more than{" "}
              <span className="text-primary font-semibold">
                ${result.riskAmount.toFixed(2)}
              </span>{" "}
              if your stop loss is hit. With a{" "}
              <span className="text-primary font-semibold">
                1:{result.rrRatio.toFixed(2)}
              </span>{" "}
              RR and an average exit price of{" "}
              <span className="text-primary font-semibold">
                ${averageTakeProfit.toFixed(2)}
              </span>
              , you could capture{" "}
              <span className="text-primary font-semibold">
                ${(result.riskAmount * result.rrRatio).toFixed(2)}
              </span>{" "}
              if all take profits are reached.
            </Typography>
            <div className="text-muted-foreground mx-auto flex max-w-md flex-col gap-1 text-[11px] tracking-wide uppercase">
              {calculatedTargets
                .filter((target) => target.hasAllocation && target.price > 0)
                .map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between"
                  >
                    <span>{target.label}</span>
                    <span>
                      {target.allocation}% @ ${target.price.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
