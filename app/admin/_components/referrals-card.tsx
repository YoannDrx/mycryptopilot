import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReferralsMetrics } from "../_actions/get-referrals-metrics";
import { ReferralsRefreshButton } from "./referrals-refresh-button";

/**
 * ReferralsCard Component
 *
 * Affiche les métriques du système de referral avec:
 * - Total invitations envoyées
 * - Invitations acceptées
 * - Total credits awarded
 * - Invitees upgradés (devenus payants)
 * - Breakdown par tier (BRONZE/SILVER/GOLD/PLATINUM/DIAMOND)
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les métriques via getReferralsMetrics().
 */
export async function ReferralsCard() {
  const metrics = await getReferralsMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎁 Referral Program</CardTitle>
        <CardDescription>Invitations et rewards</CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <ReferralsRefreshButton />
          <span className="text-muted-foreground text-xs">
            Last updated: {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total invitations */}
        <div>
          <div className="text-primary text-3xl font-bold">
            {metrics.totalInvitations}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Total invitations sent
          </p>
        </div>

        {/* Accepted vs Total */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="text-sm">
            ✅ Accepted: {metrics.acceptedInvitations}
          </Badge>
          <Badge variant="outline" className="text-sm">
            💎 Upgraded: {metrics.upgradedInvitees}
          </Badge>
        </div>

        {/* Total credits awarded */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-success text-xl font-semibold">
              {metrics.totalCreditsAwarded}
            </div>
            <span className="text-muted-foreground text-sm">
              credits awarded
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Total credits given to traders
          </p>
        </div>

        {/* Tier split */}
        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">
            Breakdown by tier
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              🥉 Bronze: {metrics.tierSplit.BRONZE}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🥈 Silver: {metrics.tierSplit.SILVER}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🥇 Gold: {metrics.tierSplit.GOLD}
            </Badge>
            <Badge variant="outline" className="text-xs">
              💎 Platinum: {metrics.tierSplit.PLATINUM}
            </Badge>
            <Badge variant="outline" className="text-xs">
              💠 Diamond: {metrics.tierSplit.DIAMOND}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
