import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubscriptionsMetrics } from "../_actions/get-subscriptions-metrics";
import { SubscriptionsRefreshButton } from "./subscriptions-refresh-button";

/**
 * SubscriptionsCard Component
 *
 * Affiche les métriques d'abonnements avec:
 * - Count users par plan (Free/Pro/Ultra)
 * - Plans expirant dans 7 jours
 * - MRR (Monthly Recurring Revenue)
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les métriques via getSubscriptionsMetrics().
 */
export async function SubscriptionsCard() {
  const metrics = await getSubscriptionsMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>💎 Abonnements</CardTitle>
        <CardDescription>Plans actifs et MRR</CardDescription>
        <CardAction>
          <SubscriptionsRefreshButton />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* MRR */}
        <div>
          <div className="text-primary text-3xl font-bold">
            ${metrics.monthlyRecurringRevenue.toFixed(0)}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            MRR (Monthly Recurring Revenue)
          </p>
        </div>

        {/* Breakdown par plan */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            🆓 Free: {metrics.freeCount}
          </Badge>
          <Badge variant="default" className="text-sm">
            💎 Pro: {metrics.proCount}
          </Badge>
          <Badge variant="default" className="text-sm">
            🌟 Ultra: {metrics.ultraCount}
          </Badge>
        </div>

        {/* Plans expirant bientôt */}
        {metrics.expiringSoon > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-sm">
                ⚠️ Expirent sous 7 jours: {metrics.expiringSoon}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Plans Pro/Ultra arrivant à expiration
            </p>
          </div>
        )}

        {/* Détail revenue */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">
            Détail MRR
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              💎 Pro: ${(metrics.proCount * 49).toFixed(0)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🌟 Ultra: ${(metrics.ultraCount * 99).toFixed(0)}
            </Badge>
          </div>
        </div>

        {/* Last updated */}
        <div className="text-muted-foreground text-xs">
          Dernière mise à jour:{" "}
          {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
        </div>
      </CardContent>
    </Card>
  );
}
