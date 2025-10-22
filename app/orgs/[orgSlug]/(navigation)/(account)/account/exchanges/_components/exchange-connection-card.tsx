"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { upfetch } from "@/lib/up-fetch";
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Unlink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";

type ExchangeConnectionCardProps = {
  connection: {
    id: string;
    exchange: string;
    isActive: boolean;
    lastSyncedAt: string | null;
    nextSyncAt: string | null;
    lastSyncError: string | null;
    createdAt: string;
  };
  stats: {
    totalTrades: number;
    firstTradeDate: string | null;
    lastTradeDate: string | null;
  };
};

export const ExchangeConnectionCard = ({
  connection,
  stats,
}: ExchangeConnectionCardProps) => {
  const queryClient = useQueryClient();

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await upfetch(`/api/exchange/${connection.id}/sync`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Failed to sync exchange");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message ?? "Sync scheduled successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["exchange-connections"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["exchange-status", connection.id],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await upfetch(
        `/api/exchange/${connection.id}/disconnect`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Failed to disconnect exchange");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message ?? "Exchange disconnected successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["exchange-connections"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDisconnect = () => {
    dialogManager.confirm({
      title: "Disconnect Exchange?",
      description:
        "Your historical trades will be preserved, but automatic syncing will stop. You can reconnect anytime.",
      confirmText: "Disconnect",
      action: {
        label: "Disconnect",
        onClick: async () => {
          await disconnectMutation.mutateAsync();
        },
      },
    });
  };

  const handleSync = async () => {
    await syncMutation.mutateAsync();
  };

  const lastSyncedText = connection.lastSyncedAt
    ? formatDistanceToNow(new Date(connection.lastSyncedAt), {
        addSuffix: true,
      })
    : "Never synced";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Exchange Icon */}
            <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
              <span className="text-2xl">🟡</span>
            </div>

            {/* Exchange Info */}
            <div>
              <CardTitle className="flex items-center gap-2">
                {connection.exchange}
                {connection.isActive ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="size-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {connection.isActive
                  ? `Last synced ${lastSyncedText}`
                  : "Connection inactive"}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {connection.lastSyncError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Sync Error</p>
              <p className="text-xs">{connection.lastSyncError}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg border p-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <TrendingUp className="size-4" />
              <span>Total Trades</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.totalTrades}</p>
          </div>

          <div className="bg-muted/50 rounded-lg border p-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" />
              <span>Next Sync</span>
            </div>
            <p className="mt-1 text-sm font-medium">
              {connection.nextSyncAt
                ? formatDistanceToNow(new Date(connection.nextSyncAt), {
                    addSuffix: true,
                  })
                : "Not scheduled"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSync()}
            disabled={
              !connection.isActive ||
              syncMutation.isPending ||
              disconnectMutation.isPending
            }
            className="flex-1"
          >
            <RefreshCw
              className={`mr-2 size-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            {syncMutation.isPending ? "Syncing..." : "Manual Sync"}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending || syncMutation.isPending}
          >
            <Unlink className="mr-2 size-4" />
            Disconnect
          </Button>
        </div>

        {/* Trade Date Range */}
        {stats.firstTradeDate && stats.lastTradeDate && (
          <div className="text-muted-foreground border-t pt-3 text-xs">
            <p>
              Trades from {new Date(stats.firstTradeDate).toLocaleDateString()}{" "}
              to {new Date(stats.lastTradeDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
