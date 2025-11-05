"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import type { SerializableRiskCalculation } from "@/features/risk-console/risk-console-queries";
import { format } from "date-fns";
import { Trash2, ArrowRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { deleteRiskCalculationAction } from "@/features/risk-console/risk-console.action";
import { toast } from "sonner";

type Props = {
  calculations: SerializableRiskCalculation[];
};

export function RiskCalculationHistory({ calculations }: Props) {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [calculationToDelete, setCalculationToDelete] = useState<{
    id: string;
    symbol: string | null;
  } | null>(null);

  const handleReload = (calc: SerializableRiskCalculation) => {
    // Navigate to main risk console with query params
    const takeProfits = calc.takeProfits as {
      price: number;
      allocation: number;
      label?: string;
    }[];

    const queryParams = new URLSearchParams({
      capital: calc.capital.toString(),
      riskPercent: calc.riskPercent.toString(),
      entryPrice: calc.entryPrice.toString(),
      stopLoss: calc.stopLoss.toString(),
      positionType: calc.positionType,
      ...(calc.symbol ? { symbol: calc.symbol } : {}),
      // Encode take profits as JSON
      takeProfits: JSON.stringify(takeProfits),
    });

    router.push(`/orgs/${orgSlug}/risk-console?${queryParams.toString()}`);
  };

  const handleDeleteClick = (calculationId: string, symbol: string | null) => {
    setCalculationToDelete({ id: calculationId, symbol });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!calculationToDelete) return;

    setDeletingId(calculationToDelete.id);
    try {
      const result = await deleteRiskCalculationAction(calculationToDelete.id);

      if (result.success) {
        toast.success("Calculation deleted");
        setShowDeleteDialog(false);
        setCalculationToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete calculation");
      }
    } catch {
      toast.error("Failed to delete calculation");
    } finally {
      setDeletingId(null);
    }
  };

  const getRRBadgeVariant = (rrRatio: number) => {
    if (rrRatio >= 2) return "default";
    if (rrRatio >= 1) return "secondary";
    return "destructive";
  };

  if (calculations.length === 0) {
    return (
      <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground mb-4">
          No calculations saved yet. Start using the Risk Console to see your
          history here.
        </p>
        <Button onClick={() => router.push(`/orgs/${orgSlug}/risk-console`)}>
          Go to Risk Console
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Capital</TableHead>
            <TableHead>Risk %</TableHead>
            <TableHead>Position Size</TableHead>
            <TableHead>R/R Ratio</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calculations.map((calc) => (
            <TableRow key={calc.id}>
              <TableCell className="font-medium">
                {format(new Date(calc.createdAt), "MMM dd, HH:mm")}
              </TableCell>
              <TableCell>
                {calc.symbol ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    calc.positionType === "LONG" ? "default" : "destructive"
                  }
                >
                  {calc.positionType}
                </Badge>
              </TableCell>
              <TableCell>${Number(calc.capital).toFixed(2)}</TableCell>
              <TableCell>{Number(calc.riskPercent).toFixed(1)}%</TableCell>
              <TableCell>${Number(calc.positionSize).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={getRRBadgeVariant(Number(calc.rrRatio))}>
                  1:{Number(calc.rrRatio).toFixed(2)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReload(calc)}
                  >
                    <ArrowRight className="mr-1 size-4" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(calc.id, calc.symbol)}
                    disabled={deletingId === calc.id}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calculation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this calculation
              {calculationToDelete?.symbol
                ? ` for ${calculationToDelete.symbol}`
                : ""}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!!deletingId}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
