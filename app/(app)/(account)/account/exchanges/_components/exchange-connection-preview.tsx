"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { upfetch } from "@/lib/up-fetch";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

type BalanceAsset = {
  asset: string;
  free: number;
  locked?: number;
  borrowed?: number;
  total: number;
  usdValue?: number;
};

type PreviewResponse = {
  balance: {
    timestamp: string;
    totalEquityUsd: number;
    spot: { totalUsd: number; assets: BalanceAsset[] };
    futures: {
      totalUsd: number;
      unrealizedPnl: number;
      assets: BalanceAsset[];
    } | null;
    margin: {
      totalUsd: number;
      borrowed: number;
      assets: BalanceAsset[];
    } | null;
  };
  trades: {
    id: string;
    symbol: string;
    side: string;
    type: string;
    quantity: number;
    price: number;
    quoteQuantity: number;
    fee: number;
    feeAsset: string;
    realizedPnl: number | null;
    executedAt: string;
  }[];
  tradeCount: number;
};

export function ExchangeConnectionPreview({
  connectionId,
}: {
  connectionId: string;
}) {
  const [hasRequested, setHasRequested] = useState(false);

  const {
    data,
    refetch,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["exchange-preview", connectionId],
    queryFn: async () => {
      const response = await upfetch(`/api/exchange/${connectionId}/preview`);
      return response as PreviewResponse;
    },
    enabled: false,
    staleTime: 0,
  });

  const handleLoad = () => {
    setHasRequested(true);
    void refetch();
  };

  const renderAssets = (assets: BalanceAsset[]) => {
    if (assets.length === 0) {
      return <p className="text-xs text-muted-foreground">Aucun asset</p>;
    }

    return (
      <div className="max-h-40 overflow-y-auto rounded-md border px-3 py-2 text-xs">
        {assets.map((asset) => (
          <div
            key={asset.asset}
            className="flex items-center justify-between border-b border-border/40 py-1 last:border-b-0"
          >
            <span className="font-medium">{asset.asset}</span>
            <div className="text-right">
              <p>
                {asset.total.toFixed(6)}{" "}
                <span className="text-muted-foreground">total</span>
              </p>
              {asset.usdValue !== undefined && (
                <p className="text-muted-foreground">
                  ≈ ${asset.usdValue.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Test snapshot (DEV only)</p>
          <p className="text-xs text-muted-foreground">
            Récupère le solde live + l&apos;historique des trades pour cette
            connexion.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoad}
          disabled={isFetching}
        >
          {isFetching
            ? "Chargement..."
            : hasRequested
              ? "Actualiser"
              : "Charger"}
        </Button>
      </div>

      {isError && (
        <p className="mt-3 text-sm text-red-500">
          {error instanceof Error ? error.message : "Erreur inconnue"}
        </p>
      )}

      {data && !isFetching && (
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <h4 className="font-semibold">Balance consolidée</h4>
            <p className="text-xs text-muted-foreground">
              Snapshot du {formatDistanceToNow(new Date(data.balance.timestamp), {
                addSuffix: true,
              })}
            </p>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs uppercase">
                  Total Equity
                </p>
                <p className="text-lg font-bold">
                  ${data.balance.totalEquityUsd.toFixed(2)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs uppercase">
                  Spot
                </p>
                <p className="text-lg font-bold">
                  ${data.balance.spot.totalUsd.toFixed(2)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground text-xs uppercase">
                  Futures
                </p>
                <p className="text-lg font-bold">
                  $
                  {data.balance.futures
                    ? data.balance.futures.totalUsd.toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Détail Spot
                </p>
                {renderAssets(data.balance.spot.assets)}
              </div>
              {data.balance.futures && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Détail Futures
                  </p>
                  {renderAssets(data.balance.futures.assets)}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold">
              Historique des trades ({data.tradeCount})
            </h4>
            {data.tradeCount === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun trade importé pour le moment.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-3 py-2 text-left">Symbol</th>
                      <th className="px-3 py-2 text-left">Side</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">PnL</th>
                      <th className="px-3 py-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trades.map((trade) => (
                      <tr key={trade.id} className="border-b">
                        <td className="px-3 py-2 font-medium">
                          {trade.symbol}
                        </td>
                        <td className="px-3 py-2">{trade.side}</td>
                        <td className="px-3 py-2 text-right">
                          {trade.quantity}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {trade.price}
                        </td>
                        <td
                          className={`px-3 py-2 text-right ${trade.realizedPnl && trade.realizedPnl !== 0 ? (trade.realizedPnl > 0 ? "text-emerald-600" : "text-red-600") : "text-muted-foreground"}`}
                        >
                          {trade.realizedPnl ?? "--"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {new Date(trade.executedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
