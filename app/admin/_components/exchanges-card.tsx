import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getExchangesMetrics } from "../_actions/get-exchanges-metrics";
import { ExchangesRefreshButton } from "./exchanges-refresh-button";

/**
 * ExchangesCard Component
 *
 * Affiche les métriques d'intégration exchanges avec:
 * - Total connexions
 * - Connexions actives
 * - Split par exchange (Binance/Bybit)
 * - Total trades synced
 * - Trades ce mois (30 derniers jours)
 * - Connexions avec erreurs de sync
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les métriques via getExchangesMetrics().
 */
export async function ExchangesCard() {
  const metrics = await getExchangesMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔗 Exchanges</CardTitle>
        <CardDescription>Binance & Bybit integrations</CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <ExchangesRefreshButton />
          <span className="text-muted-foreground text-xs">
            Last updated: {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total active connections */}
        <div>
          <div className="text-primary text-3xl font-bold">
            {metrics.activeConnections}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Active connections ({metrics.totalConnections} total)
          </p>
        </div>

        {/* Exchange split */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            🟡 Binance: {metrics.exchangeSplit.BINANCE}
          </Badge>
          <Badge variant="outline" className="text-sm">
            🟠 Bybit: {metrics.exchangeSplit.BYBIT}
          </Badge>
        </div>

        {/* Trades synced */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-primary text-xl font-semibold">
              {metrics.totalTrades.toLocaleString()}
            </div>
            <span className="text-muted-foreground text-sm">trades synced</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {metrics.tradesThisMonth.toLocaleString()} trades this month
          </p>
        </div>

        {/* Sync errors */}
        {metrics.connectionsWithErrors > 0 && (
          <div className="border-t pt-4">
            <Badge variant="destructive" className="text-sm">
              ⚠️ Sync errors: {metrics.connectionsWithErrors}
            </Badge>
            <p className="text-muted-foreground mt-2 text-xs">
              Connections needing attention
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
