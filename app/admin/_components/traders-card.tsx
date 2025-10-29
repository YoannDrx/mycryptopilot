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
        <CardDescription>Activité et vérifications</CardDescription>
        <CardAction>
          <TradersRefreshButton />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total traders */}
        <div>
          <div className="text-primary text-3xl font-bold">
            {metrics.totalTraders}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Total traders inscrits
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

        {/* Nouveaux ce mois */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-success text-xl font-semibold">
              +{metrics.newTradersThisMonth}
            </div>
            <span className="text-muted-foreground text-sm">
              nouveaux 30 derniers jours
            </span>
          </div>
        </div>

        {/* Avec exchanges */}
        <div className="border-t pt-4">
          <Badge variant="outline" className="text-sm">
            🔗 Avec exchanges: {metrics.withExchanges}
          </Badge>
          <p className="text-muted-foreground mt-2 text-xs">
            Traders ayant connecté Binance ou Bybit
          </p>
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
