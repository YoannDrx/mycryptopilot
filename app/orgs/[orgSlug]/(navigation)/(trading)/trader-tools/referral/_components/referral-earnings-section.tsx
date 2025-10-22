"use client";

import { CreditsBalanceCard } from "@/components/nowts/credits-balance-card";
import { RewardsCatalogModal } from "@/components/nowts/rewards-catalog-modal";
import { CreditsHistoryModal } from "@/components/nowts/credits-history-modal";
import type { CreditTransaction } from "@/components/nowts/credits-history-modal";
import {
  getCreditBalanceAction,
  getCreditsHistoryAction,
  redeemRewardAction,
} from "@/features/referral/referral.action";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export function ReferralEarningsSection() {
  const [balance, setBalance] = useState(0);
  const [earned, setEarned] = useState(0);
  const [spent, setSpent] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch balance
      const balanceResult = await getCreditBalanceAction();
      if (balanceResult.data) {
        setBalance(balanceResult.data.balance);
        setEarned(balanceResult.data.earned);
        setSpent(balanceResult.data.spent);
      }

      // Fetch history
      const historyResult = await getCreditsHistoryAction();
      if (historyResult.data) {
        setTransactions(historyResult.data.transactions);
      }
    } catch (error) {
      logger.error("Failed to load credits data", error);
      toast.error("Failed to load credits data");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId: string, cost: number) => {
    try {
      const result = await redeemRewardAction({ rewardId, cost });

      if (result.data) {
        toast.success(result.data.message);
        // Refresh data
        await loadData();
        // Close catalog
        setCatalogOpen(false);
      } else if (result.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      logger.error("Failed to redeem reward", error);
      toast.error("Failed to redeem reward");
    }
  };

  if (loading) {
    return <div className="bg-muted h-64 animate-pulse rounded-lg border" />;
  }

  return (
    <>
      <CreditsBalanceCard
        balance={balance}
        earned={earned}
        spent={spent}
        onViewCatalog={() => setCatalogOpen(true)}
        onViewHistory={() => setHistoryOpen(true)}
      />

      <RewardsCatalogModal
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        currentBalance={balance}
        onRedeemReward={handleRedeemReward}
      />

      <CreditsHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        transactions={transactions}
      />
    </>
  );
}
