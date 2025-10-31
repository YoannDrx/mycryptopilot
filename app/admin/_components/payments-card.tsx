import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPaymentsMetrics } from "../_actions/get-payments-metrics";
import { PaymentsRefreshButton } from "./payments-refresh-button";

/**
 * PaymentsCard Component
 *
 * Affiche les métriques de paiements crypto avec:
 * - Total revenue (tous les paiements confirmés)
 * - Revenue mensuel (30 derniers jours)
 * - Paiements en attente (PENDING)
 * - Paiements échoués (FAILED)
 * - Split par réseau (BASE/TRON)
 * - Split par plan (PRO/ULTRA)
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les métriques via getPaymentsMetrics().
 */
export async function PaymentsCard() {
  const metrics = await getPaymentsMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>💵 Crypto Payments</CardTitle>
        <CardDescription>Revenue and payment status</CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <PaymentsRefreshButton />
          <span className="text-muted-foreground text-xs">
            Last updated: {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total revenue */}
        <div>
          <div className="text-primary text-3xl font-bold">
            ${metrics.totalRevenue.toFixed(2)}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Total revenue (all confirmed payments)
          </p>
        </div>

        {/* Monthly revenue */}
        <div>
          <div className="text-success text-2xl font-semibold">
            ${metrics.revenueThisMonth.toFixed(2)}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Revenue last 30 days
          </p>
        </div>

        {/* Statuts paiements */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            ⏳ Pending: {metrics.pendingCount}
          </Badge>
          <Badge variant="destructive" className="text-sm">
            ❌ Failed: {metrics.failedCount}
          </Badge>
        </div>

        {/* Network split */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">
            Revenue by network
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              🟦 BASE: ${metrics.networkSplit.BASE.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🟣 TRON: ${metrics.networkSplit.TRON.toFixed(2)}
            </Badge>
            {metrics.networkSplit.POLYGON > 0 && (
              <Badge variant="outline" className="text-xs">
                🟪 POLYGON: ${metrics.networkSplit.POLYGON.toFixed(2)}
              </Badge>
            )}
            {metrics.networkSplit.ETHEREUM > 0 && (
              <Badge variant="outline" className="text-xs">
                🔷 ETHEREUM: ${metrics.networkSplit.ETHEREUM.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>

        {/* Plan split */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">
            Revenue by plan
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              💎 PRO: ${metrics.planSplit.PRO.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🌟 ULTRA: ${metrics.planSplit.ULTRA.toFixed(2)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
