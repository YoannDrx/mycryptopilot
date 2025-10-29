"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { refreshSubscriptionsAction } from "../_actions/refresh-subscriptions.action";

/**
 * SubscriptionsRefreshButton Component
 *
 * Bouton de refresh manuel qui:
 * 1. Appelle l'action serveur refreshSubscriptionsAction
 * 2. Utilise useTransition pour le loading state
 * 3. Revalide le cache Next.js pour re-fetch les données
 *
 * Client Component nécessaire pour useTransition + onClick.
 */
export function SubscriptionsRefreshButton() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshSubscriptionsAction({});
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
