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
        <CardTitle>💎 Subscriptions</CardTitle>
        <CardDescription>Active plans and MRR</CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <SubscriptionsRefreshButton />
          <span className="text-muted-foreground text-xs">
            Last updated: {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
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

        {/* Plans expiring soon */}
        {metrics.expiringSoon > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-sm">
                ⚠️ Expiring within 7 days: {metrics.expiringSoon}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Pro/Ultra plans expiring soon
            </p>
          </div>
        )}

        {/* MRR details */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">
            MRR Details
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
      </CardContent>
    </Card>
  );
}
