"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Coins, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { CreditType } from "@/generated/prisma";

export type CreditTransaction = {
  id: string;
  amount: number;
  type: CreditType;
  reason: string | null;
  createdAt: Date;
};

export type CreditsHistoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: CreditTransaction[];
};

const getCreditTypeLabel = (type: CreditType): string => {
  const labels: Record<CreditType, string> = {
    EARNED_SIGNUP: "Invitation Signup",
    EARNED_ACTIVE: "30 Days Active",
    EARNED_UPGRADE_PRO: "Upgrade to Pro",
    EARNED_UPGRADE_ULTRA: "Upgrade to Ultra",
    EARNED_RETENTION_3M: "3 Months Retention",
    SPENT_PRO_MONTH: "Pro Month Redeemed",
    SPENT_ULTRA_MONTH: "Ultra Month Redeemed",
    SPENT_FEATURED: "Featured Placement",
    SPENT_ANALYTICS: "Premium Analytics",
    SPENT_PROFILE_BOOST: "Profile Boost",
    SPENT_CUSTOM_BADGE: "Custom Badge",
    CLAWBACK_FRAUD: "Fraud Clawback",
  };
  return labels[type] || type;
};

const getCreditTypeColor = (type: CreditType): string => {
  if (type.startsWith("EARNED_")) return "text-green-600";
  if (type.startsWith("SPENT_")) return "text-amber-600";
  if (type === "CLAWBACK_FRAUD") return "text-red-600";
  return "text-gray-600";
};

export const CreditsHistoryModal = ({
  open,
  onOpenChange,
  transactions,
}: CreditsHistoryModalProps) => {
  const hasTransactions = transactions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="size-6 text-gray-600" />
            Credits History
          </DialogTitle>
          <DialogDescription>
            View all your credits transactions and earning history
          </DialogDescription>
        </DialogHeader>

        {!hasTransactions ? (
          // Empty State
          <div className="py-12 text-center">
            <Coins className="mx-auto mb-4 size-16 text-gray-300" />
            <p className="mb-2 text-lg font-medium text-gray-700">
              No transactions yet
            </p>
            <p className="text-muted-foreground text-sm">
              Start inviting users to earn your first credits!
            </p>
          </div>
        ) : (
          // Transactions List
          <div className="h-[500px] overflow-y-auto pr-4">
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const isEarned = transaction.amount > 0;
                const isSpent = transaction.amount < 0;
                const isFraud = transaction.type === "CLAWBACK_FRAUD";

                return (
                  <div
                    key={transaction.id}
                    className={cn(
                      "flex items-start justify-between rounded-lg border p-4 transition-all hover:shadow-sm",
                      isEarned && "border-green-200 bg-green-50/50",
                      isSpent && "border-amber-200 bg-amber-50/50",
                      isFraud && "border-red-200 bg-red-50/50",
                    )}
                  >
                    {/* Left Side: Icon + Details */}
                    <div className="flex flex-1 gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full",
                          isEarned && "bg-green-100",
                          isSpent && "bg-amber-100",
                          isFraud && "bg-red-100",
                        )}
                      >
                        {isEarned && (
                          <TrendingUp className="size-5 text-green-600" />
                        )}
                        {isSpent && (
                          <TrendingDown className="size-5 text-amber-600" />
                        )}
                        {isFraud && (
                          <AlertCircle className="size-5 text-red-600" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {getCreditTypeLabel(transaction.type)}
                        </p>
                        {transaction.reason && (
                          <p className="text-muted-foreground truncate text-xs">
                            {transaction.reason}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-1 text-xs">
                          {format(
                            new Date(transaction.createdAt),
                            "MMM dd, yyyy 'at' HH:mm",
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Amount */}
                    <div className="flex flex-col items-end gap-1">
                      <p
                        className={cn(
                          "text-lg font-bold",
                          getCreditTypeColor(transaction.type),
                        )}
                      >
                        {isEarned ? "+" : ""}
                        {transaction.amount}
                      </p>
                      <Badge
                        variant={
                          isEarned
                            ? "default"
                            : isSpent
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {isEarned ? "Earned" : isSpent ? "Spent" : "Clawback"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Footer */}
        {hasTransactions && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-900">
              <strong>Tip:</strong> Credits are earned when your invitees
              signup, stay active, or upgrade. You can spend them in the Rewards
              Catalog to unlock premium features.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
