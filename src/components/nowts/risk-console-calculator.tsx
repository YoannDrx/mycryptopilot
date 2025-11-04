"use client";

import { type ReactNode, useEffect, useId, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/nowts/typography";
import { cn } from "@/lib/utils";
import { Plus, X, TrendingUp, Save, Bookmark, History } from "lucide-react";
import type { ExchangeBalance } from "@/features/exchange/exchange-queries";
import type { SerializableRiskCalculation } from "@/features/risk-console/risk-console-queries";
import {
  saveRiskCalculationAction,
  deleteRiskCalculationAction,
} from "@/features/risk-console/risk-console.action";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PositionType = "LONG" | "SHORT";

// Hardcoded risk presets
const HARDCODED_PRESETS = {
  conservative: { name: "Conservative (1%)", riskPercent: 1 },
  moderate: { name: "Moderate (2%)", riskPercent: 2 },
  aggressive: { name: "Aggressive (3%)", riskPercent: 3 },
} as const;

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
  defaultSymbol?: string;
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
  // Presets support
  userPresets?: SerializableRiskCalculation[];
  onPresetSaved?: () => void;
};

export function RiskConsoleCalculator({
  defaultCapital = 1000,
  defaultRiskPercent = 2,
  defaultEntryPrice = 42000,
  defaultStopLoss = 41000,
  defaultTakeProfit = 44000,
  defaultPositionType = "LONG",
  defaultSymbol = "",
  defaultTargets,
  heading = "Risk Console (2% Rule)",
  description,
  showHeader = true,
  className,
  onResultChange,
  userPresets = [],
  onPresetSaved,
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
  const [symbol, setSymbol] = useState(defaultSymbol);

  // Capital Source state (manual or exchange)
  const [capitalSource, setCapitalSource] = useState<string>("manual");
  const [exchangeBalances, setExchangeBalances] = useState<ExchangeBalance[]>(
    [],
  );
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Preset state
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showPresetDialog, setShowPresetDialog] = useState(false);

  // Save calculation handler (for history)
  const [isSavingCalculation, setIsSavingCalculation] = useState(false);

  const handleSaveCalculation = async () => {
    setIsSavingCalculation(true);
    try {
      const calculationResult = result;

      if (!calculationResult.isValidConfiguration) {
        toast.error("Cannot save invalid configuration");
        setIsSavingCalculation(false);
        return;
      }

      const takeProfitsData = targets
        .filter((t) => Number(t.allocation) > 0)
        .map((t) => ({
          price: Number(t.price),
          allocation: Number(t.allocation),
          label: t.label,
        }));

      const saveResult = await saveRiskCalculationAction({
        capital: Number(capital),
        riskPercent: Number(riskPercent),
        entryPrice: Number(entryPrice),
        stopLoss: Number(stopLoss),
        positionType,
        takeProfits: takeProfitsData,
        riskAmount: calculationResult.riskAmount,
        positionSize: calculationResult.positionSize,
        contracts: calculationResult.contracts,
        rrRatio: calculationResult.rrRatio,
        symbol: symbol.trim() || undefined,
        isPreset: false, // This is a calculation, not a preset
      });

      if (saveResult.success) {
        toast.success("Calculation saved to history");
      } else {
        toast.error(saveResult.error ?? "Failed to save calculation");
      }
    } catch {
      toast.error("Failed to save calculation");
    } finally {
      setIsSavingCalculation(false);
    }
  };

  // Fetch exchange balances on mount
  useEffect(() => {
    async function fetchBalances() {
      setIsLoadingBalances(true);
      try {
        const response = await fetch("/api/exchange/balances");
        const data = (await response.json()) as {
          success: boolean;
          balances?: ExchangeBalance[];
        };
        if (data.success && data.balances) {
          setExchangeBalances(data.balances);
        }
      } catch {
        // Silently fail - user can still use manual input
        setExchangeBalances([]);
      } finally {
        setIsLoadingBalances(false);
      }
    }
    void fetchBalances();
  }, []);

  // Load preset handler
  const handleLoadPreset = (presetId: string) => {
    // Check hardcoded presets first
    if (presetId in HARDCODED_PRESETS) {
      const preset =
        HARDCODED_PRESETS[presetId as keyof typeof HARDCODED_PRESETS];
      setRiskPercent(preset.riskPercent.toString());
      toast.success(`Loaded ${preset.name} preset`);
      return;
    }

    // Load user custom preset
    const userPreset = userPresets.find((p) => p.id === presetId);
    if (userPreset) {
      setCapital(userPreset.capital.toString());
      setRiskPercent(userPreset.riskPercent.toString());
      setEntryPrice(userPreset.entryPrice.toString());
      setStopLoss(userPreset.stopLoss.toString());
      setPositionType(userPreset.positionType as PositionType);

      // Load take profits
      const tps = userPreset.takeProfits as unknown as {
        price: number;
        allocation: number;
        label?: string;
      }[];
      if (Array.isArray(tps) && tps.length > 0) {
        setTargets(
          tps.map((tp, index) => ({
            id: `tp${index + 1}`,
            label: tp.label ?? `TP${index + 1}`,
            price: tp.price.toString(),
            allocation: tp.allocation.toString(),
          })),
        );
      }

      toast.success(`Loaded preset: ${userPreset.presetName ?? "Custom"}`);
    }
  };

  // Save preset handler
  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    setIsSavingPreset(true);
    try {
      const calculationResult = result;

      if (!calculationResult.isValidConfiguration) {
        toast.error("Cannot save invalid configuration as preset");
        setIsSavingPreset(false);
        return;
      }

      const takeProfitsData = targets
        .filter((t) => Number(t.allocation) > 0)
        .map((t) => ({
          price: Number(t.price),
          allocation: Number(t.allocation),
          label: t.label,
        }));

      const saveResult = await saveRiskCalculationAction({
        capital: Number(capital),
        riskPercent: Number(riskPercent),
        entryPrice: Number(entryPrice),
        stopLoss: Number(stopLoss),
        positionType,
        takeProfits: takeProfitsData,
        riskAmount: calculationResult.riskAmount,
        positionSize: calculationResult.positionSize,
        contracts: calculationResult.contracts,
        rrRatio: calculationResult.rrRatio,
        symbol: symbol.trim() || undefined,
        isPreset: true,
        presetName: presetName.trim(),
      });

      if (saveResult.success) {
        toast.success(`Preset "${presetName}" saved successfully`);
        setShowPresetDialog(false);
        setPresetName("");
        if (onPresetSaved) {
          onPresetSaved();
        }
      } else {
        toast.error(saveResult.error ?? "Failed to save preset");
      }
    } catch {
      toast.error("Failed to save preset");
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Delete preset handler
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<{
    id: string;
    name: string | null;
  } | null>(null);

  const handleDeletePreset = (presetId: string, presetName: string | null) => {
    setPresetToDelete({ id: presetId, name: presetName });
    setShowDeleteDialog(true);
  };

  const confirmDeletePreset = async () => {
    if (!presetToDelete) return;

    setDeletingPresetId(presetToDelete.id);
    try {
      const result = await deleteRiskCalculationAction(presetToDelete.id);

      if (result.success) {
        toast.success(
          `Preset "${presetToDelete.name ?? "Unnamed"}" deleted successfully`,
        );
        setShowDeleteDialog(false);
        setPresetToDelete(null);
        // Notify parent to refresh presets
        if (onPresetSaved) {
          onPresetSaved();
        }
      } else {
        toast.error(result.error ?? "Failed to delete preset");
      }
    } catch {
      toast.error("Failed to delete preset");
    } finally {
      setDeletingPresetId(null);
    }
  };

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

        {/* Risk Presets Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="risk-preset">Risk Presets & History</Label>
              <Typography variant="muted" className="text-xs">
                Load a preset or save your current configuration
              </Typography>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleSaveCalculation()}
                disabled={!result.isValidConfiguration || isSavingCalculation}
                className="gap-2"
              >
                <History className="size-4" />
                {isSavingCalculation ? "Saving..." : "Save to History"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPresetDialog(true)}
                disabled={!result.isValidConfiguration}
                className="gap-2"
              >
                <Save className="size-4" />
                Save as Preset
              </Button>
            </div>
          </div>
          <Select onValueChange={handleLoadPreset}>
            <SelectTrigger id="risk-preset">
              <SelectValue placeholder="Select a preset..." />
            </SelectTrigger>
            <SelectContent>
              {/* Hardcoded presets */}
              <SelectItem value="conservative">
                <span className="flex items-center gap-2">
                  <Bookmark className="size-4 text-green-500" />
                  {HARDCODED_PRESETS.conservative.name}
                </span>
              </SelectItem>
              <SelectItem value="moderate">
                <span className="flex items-center gap-2">
                  <Bookmark className="size-4 text-yellow-500" />
                  {HARDCODED_PRESETS.moderate.name}
                </span>
              </SelectItem>
              <SelectItem value="aggressive">
                <span className="flex items-center gap-2">
                  <Bookmark className="size-4 text-red-500" />
                  {HARDCODED_PRESETS.aggressive.name}
                </span>
              </SelectItem>
              {/* User custom presets */}
              {userPresets.length > 0 && (
                <>
                  <div className="border-border my-1 border-t" />
                  {userPresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <span className="flex items-center gap-2">
                        <Bookmark className="size-4 text-blue-500" />
                        {preset.presetName ?? "Unnamed"}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          {/* User Presets List with Delete */}
          {userPresets.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {userPresets.map((preset) => (
                <Badge
                  key={preset.id}
                  variant="outline"
                  className="group relative flex items-center gap-2 pr-1"
                >
                  <button
                    type="button"
                    onClick={() => handleLoadPreset(preset.id)}
                    className="flex items-center gap-1.5"
                  >
                    <Bookmark className="size-3 text-blue-500" />
                    <span>{preset.presetName ?? "Unnamed"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () =>
                      handleDeletePreset(preset.id, preset.presetName)
                    }
                    disabled={deletingPresetId === preset.id}
                    className="hover:bg-destructive/10 ml-1 rounded-full p-0.5 transition-colors disabled:opacity-50"
                    title="Delete preset"
                  >
                    <X className="text-muted-foreground hover:text-destructive size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Capital Source Selector */}
        {exchangeBalances.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="capital-source">Capital Source</Label>
            <Select
              value={capitalSource}
              onValueChange={(value) => {
                setCapitalSource(value);
                if (value !== "manual") {
                  // Auto-fill from exchange
                  const balance = exchangeBalances.find(
                    (b) => b.exchange === value,
                  );
                  if (balance?.isActive) {
                    setCapital(balance.available.toFixed(2));
                  }
                }
              }}
            >
              <SelectTrigger id="capital-source">
                <SelectValue placeholder="Select capital source..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  <span className="flex items-center gap-2">
                    ✏️ Manual Input
                  </span>
                </SelectItem>
                {exchangeBalances.map((balance) => (
                  <SelectItem key={balance.exchange} value={balance.exchange}>
                    <span className="flex items-center gap-2">
                      <span>
                        {balance.exchange === "BINANCE" ? "🟡" : "🔷"}{" "}
                        {balance.exchange}
                      </span>
                      {balance.isActive ? (
                        <Badge
                          variant="default"
                          className="ml-auto h-5 px-1.5 text-xs"
                        >
                          🟢 ${balance.available.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="ml-auto">
                          ❌ Error
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {capitalSource !== "manual" && (
              <Typography variant="muted" className="text-xs">
                <TrendingUp className="mr-1 inline size-3" />
                Live balance from {capitalSource}
                {exchangeBalances.find((b) => b.exchange === capitalSource)
                  ?.lastSync && (
                  <span className="ml-1">
                    (Updated:{" "}
                    {new Date(
                      exchangeBalances.find((b) => b.exchange === capitalSource)
                        ?.lastSync ?? "",
                    ).toLocaleTimeString()}
                    )
                  </span>
                )}
              </Typography>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="risk-console-capital">Total Capital (USD)</Label>
            <Input
              id="risk-console-capital"
              type="number"
              value={capital}
              onChange={(event) => setCapital(event.target.value)}
              placeholder="10000"
              disabled={capitalSource !== "manual" && !isLoadingBalances}
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

        {/* Symbol (optional) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="risk-console-symbol">
            Symbol <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="risk-console-symbol"
            type="text"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="BTC-USDT, ETH-USDT, etc."
          />
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

      {/* Save Preset Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Preset</DialogTitle>
            <DialogDescription>
              Save your current risk configuration as a preset for quick access
              later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., My Bitcoin Strategy"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSavingPreset) {
                    void handleSavePreset();
                  }
                }}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs">
              <Typography variant="muted">
                <strong>Current configuration:</strong>
                <br />• Capital: ${capital} | Risk: {riskPercent}%
                <br />• Entry: ${entryPrice} | SL: ${stopLoss}
                <br />• Position: {positionType}
                <br />• Take Profits:{" "}
                {targets.filter((t) => Number(t.allocation) > 0).length} targets
              </Typography>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPresetDialog(false);
                setPresetName("");
              }}
              disabled={isSavingPreset}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSavePreset()}
              disabled={isSavingPreset || !presetName.trim()}
            >
              {isSavingPreset ? "Saving..." : "Save Preset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Preset Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the preset &quot;
              {presetToDelete?.name ?? "Unnamed"}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingPresetId}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePreset}
              disabled={!!deletingPresetId}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deletingPresetId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
