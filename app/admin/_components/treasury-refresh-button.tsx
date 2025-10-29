"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { refreshTreasuryAction } from "../_actions/refresh-treasury.action";

/**
 * TreasuryRefreshButton Component
 *
 * Bouton de refresh manuel qui:
 * 1. Appelle l'action serveur refreshTreasuryAction
 * 2. Utilise useTransition pour le loading state
 * 3. Revalide le cache Next.js pour re-fetch les données
 *
 * Client Component nécessaire pour useTransition + onClick.
 */
export function TreasuryRefreshButton() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshTreasuryAction({});
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
          Actualisation...
        </>
      ) : (
        <>
          <RefreshCw />
          Actualiser
        </>
      )}
    </Button>
  );
}
