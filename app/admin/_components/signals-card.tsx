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
        <CardTitle>📡 Signaux Trading</CardTitle>
        <CardDescription>Activité et performance</CardDescription>
        <CardAction>
          <SignalsRefreshButton />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total signals */}
        <div>
          <div className="text-primary text-3xl font-bold">
            {metrics.totalSignals}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Total signaux publiés
          </p>
        </div>

        {/* Active vs Total */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="text-sm">
            🔥 Actifs: {metrics.activeSignals}
          </Badge>
          <Badge variant="outline" className="text-sm">
            📈 Nouveaux 30j: {metrics.newSignalsThisMonth}
          </Badge>
        </div>

        {/* TTL moyen */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-primary text-xl font-semibold">
              {metrics.avgTTLHours.toFixed(1)}h
            </div>
            <span className="text-muted-foreground text-sm">TTL moyen</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Durée de vie moyenne des signaux
          </p>
        </div>

        {/* Top trader */}
        {metrics.topTrader && (
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-semibold">
              🏆 Top Trader
            </p>
            <Badge variant="outline" className="text-sm">
              {metrics.topTrader.name} ({metrics.topTrader.count} signaux)
            </Badge>
          </div>
        )}

        {/* Last updated */}
        <div className="text-muted-foreground text-xs">
          Dernière mise à jour:{" "}
          {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
        </div>
      </CardContent>
    </Card>
  );
}
