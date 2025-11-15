"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TraderProfile } from "@/generated/prisma";
import {
  CheckCircle,
  History,
  MoreHorizontal,
  Trash,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  verifyTraderAction,
  rejectTraderAction,
  deleteTraderAction,
  backfillTraderTradesAction,
} from "../../_actions/trader-admin.actions";
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

type TraderActionsProps = {
  trader: TraderProfile;
};

export function TraderActions({ trader }: TraderActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (trader.verified) {
      toast.info("This trader is already verified");
      return;
    }

    setIsLoading(true);
    try {
      await verifyTraderAction({ traderId: trader.id });
      toast.success("Trader verified successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        `Failed to verify trader: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!trader.verified) {
      toast.info("This trader is not verified");
      return;
    }

    if (
      !confirm("Are you sure you want to remove verification from this trader?")
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await rejectTraderAction({ traderId: trader.id });
      toast.success("Trader verification removed");
      router.refresh();
    } catch (error) {
      toast.error(
        `Failed to reject trader: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this trader profile? This will also delete all their signals. This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteTraderAction(trader.id);
      toast.success("Trader deleted successfully");
      router.push("/admin/traders");
    } catch (error) {
      toast.error(
        `Failed to delete trader: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const [backfillOpen, setBackfillOpen] = useState(false);
  const [backfillYears, setBackfillYears] = useState(1);

  const handleBackfill = async () => {
    setIsLoading(true);
    try {
      const result = await backfillTraderTradesAction({
        traderId: trader.id,
        days: backfillYears * 365,
      });
      toast.success(
        `Backfill terminé: ${result.summary.tradesUpserted} trade(s) importé(s).`,
      );
      setBackfillOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        `Backfill échoué: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const backfillOptions = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, idx) => {
        const years = idx + 1;
        return { label: `${years} an${years > 1 ? "s" : ""}`, value: years };
      }),
    [],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          <MoreHorizontal className="mr-2 h-4 w-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!trader.verified ? (
          <DropdownMenuItem onClick={handleVerify} disabled={isLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Verify Trader
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleReject} disabled={isLoading}>
            <XCircle className="mr-2 h-4 w-4" />
            Remove Verification
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setBackfillOpen(true)}
          disabled={isLoading}
        >
          <History className="mr-2 h-4 w-4" />
          Backfill Trades
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isLoading}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete Trader
        </DropdownMenuItem>
      </DropdownMenuContent>

      <AlertDialog open={backfillOpen} onOpenChange={setBackfillOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Backfill de l&apos;historique</AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionne la période à importer pour ce trader. L&apos;opération
              peut prendre plusieurs minutes et sollicite l&apos;API Binance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            {backfillOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2"
              >
                <input
                  type="radio"
                  name="backfillYears"
                  value={option.value}
                  checked={backfillYears === option.value}
                  onChange={() => setBackfillYears(option.value)}
                  className="accent-primary"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={() => void handleBackfill()}
            >
              {isLoading
                ? "Backfill en cours..."
                : `Lancer (${backfillYears} an${backfillYears > 1 ? "s" : ""})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
}
