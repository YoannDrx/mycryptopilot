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
import { CheckCircle, MoreHorizontal, Trash, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  verifyTraderAction,
  rejectTraderAction,
  deleteTraderAction,
} from "../../_actions/trader-admin.actions";

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
          onClick={handleDelete}
          disabled={isLoading}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete Trader
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
