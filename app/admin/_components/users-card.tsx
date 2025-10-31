import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsersMetrics } from "../_actions/get-users-metrics";
import { UsersRefreshButton } from "./users-refresh-button";

/**
 * UsersCard Component
 *
 * Affiche les métriques utilisateurs avec:
 * - Total users
 * - Nouveaux users (30 derniers jours)
 * - Email verified
 * - Banned users
 * - Paid users (Pro/Ultra actifs)
 * - Conversion rate vers payant
 * - Bouton de refresh manuel
 *
 * Server Component qui récupère les métriques via getUsersMetrics().
 */
export async function UsersCard() {
  const metrics = await getUsersMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>👥 Users</CardTitle>
        <CardDescription>Growth and engagement</CardDescription>
        <CardAction className="flex flex-col items-end gap-2">
          <UsersRefreshButton />
          <span className="text-muted-foreground text-xs">
            Last updated: {metrics.lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Total users */}
        <div>
          <div className="text-primary text-3xl font-bold">
            {metrics.totalUsers}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">Total users</p>
        </div>

        {/* New this month */}
        <div>
          <div className="text-success text-2xl font-semibold">
            +{metrics.newUsersThisMonth}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">New last 30 days</p>
        </div>

        {/* Statuts users */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            ✅ Verified: {metrics.emailVerified}
          </Badge>
          <Badge variant="default" className="text-sm">
            💰 Paid: {metrics.paidUsers}
          </Badge>
          {metrics.bannedUsers > 0 && (
            <Badge variant="destructive" className="text-sm">
              🚫 Banned: {metrics.bannedUsers}
            </Badge>
          )}
        </div>

        {/* Conversion rate */}
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-primary text-xl font-semibold">
              {metrics.conversionRate.toFixed(1)}%
            </div>
            <span className="text-muted-foreground text-sm">
              conversion to paid
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {metrics.paidUsers} Pro/Ultra users out of {metrics.totalUsers}{" "}
            total
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
