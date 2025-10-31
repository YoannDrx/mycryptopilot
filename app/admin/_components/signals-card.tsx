import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSignalsMetrics } from "../_actions/get-signals-metrics";
import { SignalsRefreshButton } from "./signals-refresh-button";

/**
 * SignalsCard Component
 *
 * Affiche les métriques signaux avec:
 * - Total signals publiés
 * - Signals actifs (non expirés)
 * - Nouveaux signals (30 derniers jours)
 * - TTL moyen en heures
 * - Top trader (plus de signaux)
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les métriques via getSignalsMetrics().
 */
export async function SignalsCard() {
  const metrics = await getSignalsMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>📡 Trading Signals</CardTitle>
        <CardDescription>Activity and performance</CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <SignalsRefreshButton />
          <span className="text-muted-foreground text-xs">
            Last updated: {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total signals */}
        <div>
          <div className="text-primary text-3xl font-bold">
            {metrics.totalSignals}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Total published signals
          </p>
        </div>

        {/* Active vs Total */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="text-sm">
            🔥 Active: {metrics.activeSignals}
          </Badge>
          <Badge variant="outline" className="text-sm">
            📈 New 30d: {metrics.newSignalsThisMonth}
          </Badge>
        </div>

        {/* Average TTL */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-primary text-xl font-semibold">
              {metrics.avgTTLHours.toFixed(1)}h
            </div>
            <span className="text-muted-foreground text-sm">Average TTL</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Average signal lifespan
          </p>
        </div>

        {/* Top trader */}
        {metrics.topTrader && (
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-semibold">
              🏆 Top Trader
            </p>
            <Badge variant="outline" className="text-sm">
              {metrics.topTrader.name} ({metrics.topTrader.count} signals)
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
