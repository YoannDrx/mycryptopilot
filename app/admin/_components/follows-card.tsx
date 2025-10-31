import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFollowsMetrics } from "../_actions/get-follows-metrics";
import { FollowsRefreshButton } from "./follows-refresh-button";

/**
 * FollowsCard Component
 *
 * Affiche les métriques de follows avec:
 * - Total follows actifs
 * - Nouveaux follows (30 derniers jours)
 * - Conversion vers plans payants
 * - Moyenne follows par user
 * - Breakdown par source (DIRECT/INVITATION/REFERRAL)
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les métriques via getFollowsMetrics().
 */
export async function FollowsCard() {
  const metrics = await getFollowsMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔗 Follows</CardTitle>
        <CardDescription>Engagement and conversions</CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <FollowsRefreshButton />
          <span className="text-muted-foreground text-xs">
            Last updated: {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Active follows */}
        <div>
          <div className="text-primary text-3xl font-bold">
            {metrics.activeFollows}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Total active follows
          </p>
        </div>

        {/* New this month */}
        <div>
          <div className="text-success text-2xl font-semibold">
            +{metrics.newFollowsThisMonth}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">New last 30 days</p>
        </div>

        {/* Conversion rate */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-primary text-xl font-semibold">
              {metrics.paidConversionRate.toFixed(1)}%
            </div>
            <span className="text-muted-foreground text-sm">
              conversion to paid
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Follows with active Pro/Ultra users
          </p>
        </div>

        {/* Average per user */}
        <div className="border-t pt-4">
          <Badge variant="outline" className="text-sm">
            📊 Average: {metrics.avgFollowsPerUser.toFixed(1)} follows/user
          </Badge>
        </div>

        {/* Source split */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">
            Breakdown by source
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              🎯 Direct: {metrics.sourceSplit.DIRECT}
            </Badge>
            <Badge variant="outline" className="text-xs">
              📩 Invitation: {metrics.sourceSplit.INVITATION}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🎁 Referral: {metrics.sourceSplit.REFERRAL}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
