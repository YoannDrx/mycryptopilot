"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { refreshUsersAction } from "../_actions/refresh-users.action";

/**
 * UsersRefreshButton Component
 *
 * Bouton de refresh manuel qui:
 * 1. Appelle l'action serveur refreshUsersAction
 * 2. Utilise useTransition pour le loading state
 * 3. Revalide le cache Next.js pour re-fetch les données
 *
 * Client Component nécessaire pour useTransition + onClick.
 */
export function UsersRefreshButton() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshUsersAction({});
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
