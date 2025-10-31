import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTradersMetrics } from "../_actions/get-traders-metrics";
import { TradersRefreshButton } from "./traders-refresh-button";

/**
 * TradersCard Component
 *
 * Affiche les métriques traders avec:
 * - Total traders
 * - Verified traders
 * - Pending verification (queue admin)
 * - Nouveaux traders (30 derniers jours)
 * - Avec exchanges connectés (Binance/Bybit)
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les métriques via getTradersMetrics().
 */
export async function TradersCard() {
  const metrics = await getTradersMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Traders</CardTitle>
        <CardDescription>Activity and verifications</CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <TradersRefreshButton />
          <span className="text-muted-foreground text-xs">
            Last updated: {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total traders */}
        <div>
          <div className="text-primary text-3xl font-bold">
            {metrics.totalTraders}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Total registered traders
          </p>
        </div>

        {/* Verified vs Pending */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="text-sm">
            ✅ Verified: {metrics.verifiedTraders}
          </Badge>
          <Badge variant="outline" className="text-sm">
            ⏳ Pending: {metrics.pendingVerification}
          </Badge>
        </div>

        {/* New this month */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-success text-xl font-semibold">
              +{metrics.newTradersThisMonth}
            </div>
            <span className="text-muted-foreground text-sm">
              new last 30 days
            </span>
          </div>
        </div>

        {/* With exchanges */}
        <div className="border-t pt-4">
          <Badge variant="outline" className="text-sm">
            🔗 With exchanges: {metrics.withExchanges}
          </Badge>
          <p className="text-muted-foreground mt-2 text-xs">
            Traders who connected Binance or Bybit
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
