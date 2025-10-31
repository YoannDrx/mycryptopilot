"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { refreshTradersAction } from "../_actions/refresh-traders.action";

/**
 * TradersRefreshButton Component
 *
 * Bouton de refresh manuel qui:
 * 1. Appelle l'action serveur refreshTradersAction
 * 2. Utilise useTransition pour le loading state
 * 3. Revalide le cache Next.js pour re-fetch les données
 *
 * Client Component nécessaire pour useTransition + onClick.
 */
export function TradersRefreshButton() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshTradersAction({});
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="animate-spin" />
          Refreshing...
        </>
      ) : (
        <>
          <RefreshCw />
          Refresh
        </>
      )}
    </Button>
  );
}
